const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getAllUsers, updateUserStatus, getAnalytics, approveTeacher } = require('../controllers/adminController');

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

module.exports = router;
