import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var mongooseConn: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

const globalWithMongoose = global as typeof global & { mongooseConn?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } };

export async function dbConnect() {
  if (!globalWithMongoose.mongooseConn) {
    globalWithMongoose.mongooseConn = { conn: null, promise: null };
  }
  const cached = globalWithMongoose.mongooseConn!;

  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI not set");
    cached.promise = mongoose.connect(uri, {});
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
