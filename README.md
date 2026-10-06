# MongoDB Testing — Schema Design Best Practices

A personal sandbox for practicing MongoDB data-modeling decisions with NestJS and Mongoose: when to embed vs. reference, how to denormalize for read performance, where validation and integrity should actually live, and how to index for the queries you really run.

The domain is a small e-commerce slice — suppliers, products, reviews, orders — chosen because it naturally contains every classic modeling tension: a 1:many relationship that barely changes (supplier → products), a 1:many relationship that grows without bound (product → reviews), and data that must stay frozen at a point in time even though its source keeps changing (order line items vs. live product prices).

## Data model

```
Supplier ──┐
           │ (referenced)
           ▼
        Product ──── topReviews[] (embedded subset, max 5, denormalized)
           │
           │ (referenced, full history)
           ▼
         Review

        Product ──── snapshotted into ──── Order.items[]
                                               │
                                          (embedded)
```

- **Supplier** — plain referenced document (`Product.supplierId`). It changes rarely and isn't needed on every product read, so there's no reason to embed or duplicate it.
- **Product** — embeds `topReviews`, a capped array of the 5 most recent reviews, plus cached `reviewCount` / `ratingAverage`. The full review history lives separately in `Review`, referenced by `productId`.
- **Review** — normalized collection, indexed on `productId`, paginated with `skip`/`limit`.
- **Order** — embeds a *snapshot* of each line item (`productName`, `unitPrice`, `lineTotal` as they were at purchase time), not just a `productId` reference.

## Best practices this repo exercises

### Embedding vs. referencing — the subset pattern
**Wrong way:** embed every review directly in the product document (`Product.reviews: Review[]`). A popular product accumulates thousands of reviews, the document keeps growing, approaches the 16MB document limit, and every write to the array re-serializes the whole thing.
**This repo:** `Product.topReviews` embeds only the latest 5 reviews — just enough to render a product page without a second query — while the authoritative, unbounded history lives in its own `Review` collection. Adding a review ([`reviews.service.ts`](src/products/reviews.service.ts)) writes to `Review`, then recomputes the cached top-5 slice and stats back onto the product.

### Denormalization for read performance
**Wrong way:** compute `ratingAverage` and `reviewCount` with an aggregation on every product read.
**This repo:** both are cached fields on `Product`, recalculated once per write (when a review is added) instead of on every read — a deliberate read/write tradeoff that favors the far more common operation (viewing a product).

### Snapshotting mutable data
**Wrong way:** `Order.items` stores only a `productId` and resolves `name`/`price` by populating the live `Product` at render time. Change the price tomorrow and every past invoice silently changes with it.
**This repo:** [`orders.service.ts`](src/orders/orders.service.ts) copies `productName`, `unitPrice`, and the computed `lineTotal` onto the order item at creation time. The order is a historical record, not a live view of the catalog.

### Schema-level validation as the source of truth
**Wrong way:** validate only at the DTO/controller boundary (e.g. `class-validator`). Anything that writes to the collection outside that one code path — a seed script, a migration, a different service — bypasses validation entirely.
**This repo:** validation (`match`, `min`/`max`, `enum`, `required`) is declared directly on the Mongoose schemas (see [`product.schema.ts`](src/products/schemas/product.schema.ts), [`order.schema.ts`](src/orders/schemas/order.schema.ts)), so it's enforced no matter what writes the data. DTOs here are plain shape definitions, not validation.

### Indexing for the queries you actually run
**Wrong way:** add indexes speculatively, or not at all, and let common lookups fall back to a collection scan.
**This repo:** `Product` is indexed on `name`; `Order` has a compound index on `{ userId: 1, 'items.productName': 1 }` because that's exactly the shape of the "find my orders for product X" query exposed by `GET /orders`.

### Referential integrity lives in the application layer
MongoDB has no foreign key constraints. `OrdersService.create` explicitly loads every referenced product and rejects the order if any id doesn't resolve, rather than trusting the input and discovering a dangling reference later.

## API layer

These aren't MongoDB modeling decisions, but round out the showcase as a usable API:

- **Response DTOs, not raw documents.** Controllers map Mongoose documents to explicit `*ResponseDto` classes (e.g. [`product-response.dto.ts`](src/products/dto/product-response.dto.ts)) instead of returning them directly. Returning a document as-is leaks persistence internals into the wire format — notably Mongoose's `__v` version key — and couples the API shape 1:1 to the schema.
- **OpenAPI docs.** `@nestjs/swagger` decorators on every controller and DTO; browse them at `/docs` once the app is running.
- **A GCP OIDC guard, applied globally.** [`GcpOidcGuard`](src/common/guards/gcp-oidc.guard.ts) verifies a Google-signed OIDC bearer token (via `google-auth-library`, audience from `OIDC_AUDIENCE`) on every request. It's a no-op outside `NODE_ENV=production` (bypassed for `local`/`development`/`test`), so it doesn't get in the way of local dev or the test suite, but a production deployment is actually protected.

## Project structure

```
src/
  suppliers/   # Supplier CRUD — referenced by products
  products/    # Product CRUD + Review sub-resource (embedded subset + full history)
  orders/      # Order creation — snapshots product data, validates references
  common/      # Cross-cutting concerns (GcpOidcGuard)
  config/      # Mongoose connection config (reads MONGO_URL)
  seed.ts      # Populates all four collections with sample data
```

## Running it

```bash
docker compose up -d        # starts MongoDB locally
cp .env.example .env        # MONGO_URL already points at the local container; NODE_ENV=local bypasses auth
pnpm install
pnpm run start:dev           # watch mode, http://localhost:4000
pnpm run seed                 # optional: seed sample suppliers/products/reviews/orders
```

Swagger/OpenAPI docs are served at `/docs`. A [Postman collection](postman_collection.json) also covers every endpoint (suppliers, products, reviews, orders) for manual exploration.

## Testing

`test/api.e2e-spec.ts` runs the real endpoints against a live MongoDB (the one from `docker compose up -d`), covering the subset-pattern review cache, order snapshotting, referential-integrity rejection, and pagination. Run it with `pnpm run test:e2e`.

## Known gaps / not goals

This is a learning sandbox, not a production template:

- No multi-document transactions around the order-creation / stock-decrement flow.
- Unit tests are still missing — only e2e coverage exists so far.
