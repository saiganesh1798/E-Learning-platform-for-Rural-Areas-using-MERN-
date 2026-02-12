const User = require('../models/User');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');

// @route   GET api/admin/users
// @desc    Get all users
// @access  Admin
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   PUT api/admin/users/:id/status
// @desc    Update user status (approve/reject)
// @access  Admin
exports.updateUserStatus = async (req, res) => {
    const { status } = req.body; // 'active', 'rejected', 'pending'
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        user.status = status;
        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   PATCH api/admin/approve-teacher/:id
// @desc    Approve or Reject a teacher
// @access  Admin
exports.approveTeacher = async (req, res) => {
    const { status } = req.body; // 'approved' or 'rejected'
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (user.role !== 'teacher') {
            return res.status(400).json({ msg: 'User is not a teacher' });
        }

        user.approvalStatus = status;
        if (status === 'approved') {
            user.isApproved = true;
            user.status = 'active'; // Sync legacy status
        } else if (status === 'rejected') {
            user.isApproved = false;
            user.status = 'rejected'; // Sync legacy status
            // Optional: Start deletion timer or keep record
        }

        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   GET api/admin/analytics
// @desc    Get platform analytics
// @access  Admin
exports.getAnalytics = async (req, res) => {
    try {
        const totalTeachers = await User.countDocuments({ role: 'teacher' });
        const totalStudents = await User.countDocuments({ role: 'student' });
        const activeCourses = await Course.countDocuments(); // Assuming all exist courses are "active" for now
        const pendingApprovals = await User.countDocuments({ role: 'teacher', approvalStatus: 'pending' });

        res.json({
            pendingApprovals,
            totalTeachers,
            totalStudents,
            activeCourses
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
