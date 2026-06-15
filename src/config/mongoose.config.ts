import type { MongooseModuleOptions } from '@nestjs/mongoose';

export function mongooseConfigFactory(): MongooseModuleOptions {
  return {
    uri: process.env.MONGO_URL,
    serverSelectionTimeoutMS: 5000,
  };
}
