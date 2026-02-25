const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getAllUsers, updateUserStatus, getAnalytics, approveTeacher, getAllDiscussions, deleteDiscussion, deleteReply } = require('../controllers/adminController');

// Middleware to check if user is admin
const adminCheck = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }
    next();
};

router.get('/users', auth, adminCheck, getAllUsers);
router.put('/users/:id/status', auth, adminCheck, updateUserStatus);
router.patch('/approve-teacher/:id', auth, adminCheck, approveTeacher);
router.get('/analytics', auth, adminCheck, getAnalytics);
router.get('/discussions', auth, adminCheck, getAllDiscussions);
router.delete('/discussions/:courseId/:discussionId', auth, adminCheck, deleteDiscussion);
router.delete('/discussions/:courseId/:discussionId/replies/:replyId', auth, adminCheck, deleteReply);

module.exports = router;
