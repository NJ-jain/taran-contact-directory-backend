const mongoose = require('mongoose');
const { Admin, GlobalUserArray } = require('../models/adminModel');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const migrateUserArray = async () => {
  try {
    // Step 1: Fetch all admin documents that have a `userArray`.
    const admins = await Admin.find({ userArray: { $exists: true, $not: { $size: 0 } } });

    // Step 2: Create a new `GlobalUserArray` document if it doesn't exist.
    let globalUserArray = await GlobalUserArray.findOne();
    if (!globalUserArray) {
      globalUserArray = new GlobalUserArray({ userArray: [] });
    }

    // Step 3: Merge all `userArray` entries from each admin into the global `userArray`.
    for (const admin of admins) {
      globalUserArray.userArray = [...new Set([...globalUserArray.userArray, ...admin.userArray])];
    }
    await globalUserArray.save();

    // Step 4: Remove the `userArray` field from the admin documents.
    await Admin.updateMany({}, { $unset: { userArray: "" } });

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.disconnect();
  }
};

migrateUserArray();