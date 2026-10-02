const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const auth = require('../middleware/auth');

router.get('/search', memberController.searchMembers);
// Add auth middleware to each route explicitly
router.post('/', auth, memberController.createMember);

router.get('/', memberController.getAllMembers);

router.get('/:memberId', memberController.getMember);

router.put('/:memberId', auth, memberController.updateMember);

router.delete('/:memberId', auth, memberController.deleteMember);


module.exports = router;    