const Member = require('../models/memberModel');
const User = require('../models/userModel');
const Admin = require('../models/adminModel'); // Assuming you have an Admin model

const adminCollection = {
  // ... existing code ...

  // Method to approve a member
  approveMember: async (req, res) => {
    try {
      const memberId = req.params.memberId;
      const member = await Member.findByIdAndUpdate(memberId, { isApproved: true }, { new: true });
      if (!member) {
        return res.status(404).json({ message: 'Member not found' });
      }

      // Optionally, you can also update the User model to reflect the approval
      // For example, if you have a reference to the members in the User model:
      await User.updateOne(
        { _id: member.userId, 'members._id': memberId },
        { '$set': { 'members.$.isApproved': true } }
      );

      res.status(200).json({ message: 'Member approved successfully', member });
    } catch (error) {
      res.status(500).json({ message: 'Error approving member', error: error.message });
    }
  },

  // ... You can add more admin methods as needed ...
};

module.exports = adminCollection;