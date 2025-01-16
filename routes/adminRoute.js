const express = require('express');
const router = express.Router();
const adminCollection = require('../controllers/adminCollection.js');
const auth = require('../middleware/auth');

// ... existing code ...

// Route to approve a member
router.put('/approve-member/:memberId', auth, adminCollection.approveMember);

// ... existing code ...

module.exports = router;