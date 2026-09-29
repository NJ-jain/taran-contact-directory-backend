const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const auth = require('../middleware/auth');

router.get('/search', auth, memberController.searchMembers);
// Add auth middleware to each route explicitly
router.post('/', auth, memberController.createMember);

router.get('/', auth, memberController.getAllMembers);

router.get('/:memberId', auth, memberController.getMember);

router.put('/:memberId', auth, memberController.updateMember);

router.delete('/:memberId', auth, memberController.deleteMember);


module.exports = router;    