// MongoDB initialization script for Ceylon IntelliBiz
// This runs automatically when the MongoDB container starts for the first time.

db = db.getSiblingDB('intellibiz');

// Create collections with validation
db.createCollection('products');
db.createCollection('reviews');
db.createCollection('chat_messages');

// Create indexes for performance
db.products.createIndex({ category: 1 });
db.products.createIndex({ title: 'text', description: 'text' });

db.reviews.createIndex({ productId: 1 });
db.reviews.createIndex({ createdAt: -1 });

db.chat_messages.createIndex({ sessionId: 1 });
db.chat_messages.createIndex({ createdAt: -1 });

print('MongoDB initialized: intellibiz database with products, reviews, and chat_messages collections.');
