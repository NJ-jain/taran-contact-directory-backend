const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController.js');
const auth = require('../middleware/auth.js');

// Apply auth middleware to all routes
router.use(auth);

// Route to get a user and populate members
router.get('/users', userController.getUser);

// Route to update a user
router.put('/users', userController.updateUser);

module.exports = router;