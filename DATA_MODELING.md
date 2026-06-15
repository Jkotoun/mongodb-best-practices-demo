# MongoDB Data Modeling — Principles Showcased

This app is a small order/product system built to demonstrate five MongoDB data‑modeling
principles. Each section below explains the principle, how this codebase applies it, and the
exact spots in the code where you can see it.

Domain: **suppliers** sell **products**; products accumulate **reviews**; users place **orders**.

| # | Principle | Primary location |
|---|-----------|------------------|
| 1 | Denormalization (embed, don't join) | `src/orders/schemas/order.schema.ts` |
| 2 | Data duplication (copy what's read together) | `src/products/` (product + reviews) |
| 3 | Enforce schema with validation rules | every `*.schema.ts` + DTOs + `main.ts` |
| 4 | Index commonly‑queried fields | `src/orders/schemas/order.schema.ts:77` |
| 5 | Link related data (reference, don't copy) | `Product.supplierId` |

---

## 1. Denormalization — embed order line items

**Principle.** In a relational DB an order's line items would be a separate join table
(`order_items` with FK to `orders`). In MongoDB, data that is always read together with its
parent and is bounded in size should be **embedded** in the parent document. An order and its
items are read, written, and deleted as a unit, so the items live *inside* the order document —
no join, one read.

A second benefit shown here: each embedded item is a **point‑in‑time snapshot** of the product
(`productName`, `unitPrice`). If a product's price or name changes later, historical orders stay
correct — exactly what you want for an invoice.

**Where in code.**
- `src/orders/schemas/order.schema.ts:23-39` — `OrderItem` is an embedded sub‑document
  (`@Schema({ _id: false })`), not its own collection. It keeps `productId` for traceability
  **and** the snapshot fields `productName` / `unitPrice`.
- `src/orders/schemas/order.schema.ts:49-58` — `items: OrderItem[]` is an embedded array on the
  `Order`, so the join table never exists.
- `src/orders/orders.service.ts:29-56` — `create()` reads the referenced products once, copies
  `name`/`price` into each embedded item, computes `lineTotal`/`total`, and saves a
  self‑contained order.
- `src/orders/orders.service.ts:58-65` — `GET /orders/:id` returns the whole order, items
  included, in a single read with no join.

**Try it.** `POST /orders` then `GET /orders/:id` — the response carries the full item snapshot
inline (verified: a 2× Mechanical Keyboard order returns `lineTotal: 179.98` embedded).

---

## 2. Data duplication — duplicate the first 5 reviews onto the product

**Principle.** When a subset of related data is shown *every time* you load a document, duplicate
that hot subset onto the document and keep the full set in its own collection. You trade a little
extra write work and storage for cheap, single‑read renders. Here, the product page always shows
the latest 5 reviews plus a rating summary, while the long tail of reviews is paginated from a
dedicated collection.

This is the classic **subset pattern**: embed the hot subset, reference/spill the rest.

**Where in code.**
- `src/products/schemas/product.schema.ts:14-30` — `EmbeddedReview` sub‑document: the duplicated
  shape stored on the product. It keeps a `reviewId` back‑pointer to the canonical review.
- `src/products/schemas/product.schema.ts:66-68` — `topReviews: EmbeddedReview[]` holds the
  latest 5 (the duplicated subset).
- `src/products/schemas/product.schema.ts:74-78` — `reviewCount` and `ratingAverage` are
  **duplicated aggregates** so the product page never has to touch the `reviews` collection just
  to show a count/average.
- `src/products/schemas/review.schema.ts:16-34` — the **canonical** `reviews` collection: one
  document per review, the source of truth and the overflow store.
- `src/products/reviews.service.ts:27-79` — `addReview()` shows the **cost side** of duplication:
  one logical write fans out to (1) the canonical `reviews` doc (`:37-42`), then recomputes the
  duplicated aggregates from source (`:45-57`) and refreshes the embedded latest‑5 (`:60-75`).
- `src/products/reviews.service.ts:85-98` — `findReviews()` is the overflow read path: everything
  beyond the embedded 5 is paginated out of the `reviews` collection.
- `src/products/products.service.ts:18-37` — the payoff: `GET /products/:id` returns the product
  with its embedded `topReviews` + aggregates in a single read, no join.

**Try it.** `GET /products/:id` → `topReviews` has ≤5 items and `reviewCount`/`ratingAverage` are
present (verified: 8 reviews seeded → 5 embedded, `reviewCount: 8`). `GET /products/:id/reviews?page=2&limit=5`
returns the overflow (3 of 8). `POST /products/:id/reviews` bumps the count and pushes the new
review to the front of `topReviews`.

> Design note: reviews are duplicated onto the **product**, not onto order items — keeping reviews
> out of the order snapshot avoids stale data in historical orders.

---

## 3. Enforce schema with validation rules

**Principle.** MongoDB is schema‑flexible, but an application should still enforce shape and
invariants. This app validates at **two layers**: Mongoose schema validators guarantee the data
that reaches the database, and class‑validator DTOs reject bad requests at the API edge before
they ever hit a model.

**Where in code (DB layer — Mongoose validators).**
- `src/products/schemas/product.schema.ts:42-50` — product `name` must match a regex (starts
  alphanumeric, safe character set, 2–80 chars).
- `src/products/schemas/product.schema.ts:53` — `price` uses `min: [0.01, …]` to force a positive
  number.
- `src/orders/schemas/order.schema.ts:49-58` — custom validator requires an order to have at least
  one item.
- `src/orders/schemas/order.schema.ts:64` — `status` is constrained to an `enum`
  (`pending | paid | shipped | cancelled`).
- `src/products/schemas/review.schema.ts:29,32` — `rating` bounded 1–5, `comment` length 1–500.

**Where in code (API layer — DTOs + pipe).**
- `src/products/dto/create-product.dto.ts`, `src/orders/dto/create-order.dto.ts`,
  `src/products/dto/create-review.dto.ts` — request shapes with `@IsPositive`, `@Matches`,
  `@IsMongoId`, `@ValidateNested`, etc.
- `src/main.ts:10` — a global `ValidationPipe({ whitelist: true, transform: true })` strips unknown
  fields and coerces payloads into the DTO classes for the whole app.

**Try it (verified).** `POST /products` with a negative price → **400**; with a bad‑regex name →
**400**; `POST /orders` with empty `items` → **400**; a valid product → **201**.

---

## 4. Index commonly‑queried fields

**Principle.** Index the fields your hot queries filter and sort on, including **compound** indexes
when a query filters by multiple fields together. A compound index over an embedded array field is
a *multikey* index — it indexes every element of the array.

The showcase query is a user‑profile lookup: *"show orders where this user bought a product named
X."* It filters by `userId` and by an embedded item's `productName`, so a single compound index
covers both.

**Where in code.**
- `src/orders/schemas/order.schema.ts:77` —
  `OrderSchema.index({ userId: 1, 'items.productName': 1 })`, the compound multikey index backing
  the profile search.
- `src/orders/orders.service.ts:72-83` — `findByUserAndProductName()` issues exactly the query that
  index serves (`{ userId, 'items.productName' }`).
- `src/products/schemas/review.schema.ts:18-23` — `productId` is indexed (`index: true`) because
  every review lookup/pagination filters by it.
- `src/products/schemas/product.schema.ts:84` — a single‑field index on product `name` for catalog
  search.

**Try it (verified).** `GET /orders?userId=…&productName=Mechanical%20Keyboard` returns the matching
order. `db.orders.getIndexes()` lists `userId_1_items.productName_1`.

---

## 5. Link related data — reference the supplier, don't copy it

**Principle.** Not everything should be embedded or duplicated. When related data is large, changes
independently, or is **rarely read** on the hot paths, store a reference (an ObjectId) and resolve
it on demand. Supplier details are evidence‑level data — needed occasionally, not on every product
view — so the product keeps only a `supplierId` and joins via `populate()` when asked.

**Where in code.**
- `src/products/schemas/product.schema.ts:59-64` — `supplierId` is a `ref: 'Supplier'` ObjectId.
  No supplier fields are copied onto the product.
- `src/suppliers/schemas/supplier.schema.ts` — `Supplier` is its own collection (the reference
  target).
- `src/products/products.service.ts:27-37` — `findById(id, withSupplier)` resolves the link with
  `.populate('supplierId')` **only** when the caller asks (`?withSupplier=true`); the default hot
  path pays nothing for it.
- `src/products/schemas/review.schema.ts:14,18-24` — the review's `productId` is the same idea: a
  foreign‑key reference back to the product rather than a copy of it.

**Try it (verified).** `GET /products/:id` returns a bare `supplierId`; `GET /products/:id?withSupplier=true`
returns the populated supplier object (`{ name: 'Acme Components', country: 'US' }`).

---

## Embed vs. duplicate vs. reference — the decision in one table

| Data | Choice | Why |
|------|--------|-----|
| Order line items | **Embed** (#1) | Always read with the order, bounded, want a price/name snapshot |
| Latest 5 reviews + rating summary | **Duplicate** (#2) | Shown on every product view; full set too large to embed |
| All reviews | **Reference** (#5) | Unbounded; paginated on demand from its own collection |
| Supplier | **Reference** (#5) | Rarely read on hot paths; changes independently |

## Running the demo

```bash
docker compose up -d        # MongoDB
pnpm install
pnpm seed                   # builds + seeds suppliers/products/reviews/orders; prints sample URLs
pnpm run start:dev          # NestJS API
```

The seed output prints concrete product IDs and ready‑to‑run requests for each principle above.

> Note: the local `.env` sets `PORT=4000` (not the 3000 in CLAUDE.md), so the API is at
> `http://localhost:4000`.
