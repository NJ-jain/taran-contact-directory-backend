const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController.js');
const adminAuth = require('../middleware/adminAuth.js');


router.put('/approve-member/:memberId', adminAuth, adminController.approveMember);

router.post('/create-admin', adminController.createAdmin);

router.post('/admin-login', adminController.adminLogin);

router.get('/get-all-users', adminAuth, adminController.getAllUsersFromAdmin);

router.get('/get-user-members/:userId', adminAuth, adminController.getUserMembers);

module.exports = router;