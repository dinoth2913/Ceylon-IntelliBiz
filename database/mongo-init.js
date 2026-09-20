// MongoDB initialization for Ceylon IntelliBiz.
//
// The mongo image runs this ONCE, on the first start of an empty data volume, authenticated as the root user
// and with MONGO_INITDB_DATABASE as the current database. It:
//   1. creates a least-privilege user for the backend (read/write on the app database only, never the root user),
//   2. creates the marketplace/chat collections with their indexes.
// The backend itself creates the indexes for everything else (users, customers, orders, invoices, inventory...)
// at startup, from the annotations on its model classes.

const dbName = process.env.MONGO_INITDB_DATABASE || 'intellibiz';
const appUser = process.env.MONGODB_APP_USER;
const appPassword = process.env.MONGODB_APP_PASSWORD;

if (!appUser || !appPassword) {
  throw new Error('MONGODB_APP_USER and MONGODB_APP_PASSWORD must be set so the backend gets its own database user.');
}

const appDb = db.getSiblingDB(dbName);

appDb.createUser({
  user: appUser,
  pwd: appPassword,
  roles: [{ role: 'readWrite', db: dbName }]
});

appDb.createCollection('products');
appDb.createCollection('reviews');
appDb.createCollection('chat_messages');

appDb.products.createIndex({ category: 1 });
appDb.products.createIndex({ title: 'text', description: 'text' });

appDb.reviews.createIndex({ productId: 1 });
appDb.reviews.createIndex({ createdAt: -1 });

appDb.chat_messages.createIndex({ sessionId: 1 });
appDb.chat_messages.createIndex({ createdAt: -1 });

print('MongoDB initialized: database "' + dbName + '" with an application user and the marketplace/chat collections.');
