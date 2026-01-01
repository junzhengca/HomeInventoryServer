/**
 * Script to fix sync collection indexes
 * 
 * This script removes the old single-field index on userId
 * and ensures only the compound unique index exists.
 * 
 * Run with: node scripts/fix-sync-indexes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function fixIndexes() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || "";
    
    if (!MONGODB_URI) {
      console.error("MONGODB_URI environment variable is required");
      process.exit(1);
    }

    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    const syncDataCollection = db.collection('syncdatas');
    const syncMetadataCollection = db.collection('syncmetadatas');

    // Get current indexes
    console.log("\n=== Current SyncData indexes ===");
    const syncDataIndexes = await syncDataCollection.indexes();
    console.log(JSON.stringify(syncDataIndexes, null, 2));

    console.log("\n=== Current SyncMetadata indexes ===");
    const syncMetadataIndexes = await syncMetadataCollection.indexes();
    console.log(JSON.stringify(syncMetadataIndexes, null, 2));

    // Drop single-field index on userId if it exists
    try {
      await syncDataCollection.dropIndex('userId_1');
      console.log("\n✓ Dropped userId_1 index from syncdatas");
    } catch (error) {
      if (error.code === 27) {
        console.log("\n- userId_1 index does not exist in syncdatas (already removed)");
      } else {
        console.error("Error dropping userId_1 index from syncdatas:", error.message);
      }
    }

    try {
      await syncMetadataCollection.dropIndex('userId_1');
      console.log("✓ Dropped userId_1 index from syncmetadatas");
    } catch (error) {
      if (error.code === 27) {
        console.log("- userId_1 index does not exist in syncmetadatas (already removed)");
      } else {
        console.error("Error dropping userId_1 index from syncmetadatas:", error.message);
      }
    }

    // Ensure compound unique indexes exist
    try {
      await syncDataCollection.createIndex(
        { userId: 1, fileType: 1 },
        { unique: true, name: 'userId_1_fileType_1' }
      );
      console.log("✓ Created/verified compound unique index on syncdatas (userId, fileType)");
    } catch (error) {
      console.error("Error creating compound index on syncdatas:", error.message);
    }

    try {
      await syncMetadataCollection.createIndex(
        { userId: 1, fileType: 1 },
        { unique: true, name: 'userId_1_fileType_1' }
      );
      console.log("✓ Created/verified compound unique index on syncmetadatas (userId, fileType)");
    } catch (error) {
      console.error("Error creating compound index on syncmetadatas:", error.message);
    }

    // Show final indexes
    console.log("\n=== Final SyncData indexes ===");
    const finalSyncDataIndexes = await syncDataCollection.indexes();
    console.log(JSON.stringify(finalSyncDataIndexes, null, 2));

    console.log("\n=== Final SyncMetadata indexes ===");
    const finalSyncMetadataIndexes = await syncMetadataCollection.indexes();
    console.log(JSON.stringify(finalSyncMetadataIndexes, null, 2));

    console.log("\n✓ Index fix completed successfully!");
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error fixing indexes:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

fixIndexes();

