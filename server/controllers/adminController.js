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

// @route   GET api/admin/discussions
// @desc    Get all discussions globally
// @access  Admin
exports.getAllDiscussions = async (req, res) => {
    try {
        const courses = await Course.find({ 'discussions.0': { $exists: true } })
            .populate('discussions.user', 'name email profilePicture')
            .populate('discussions.replies.user', 'name email profilePicture')
            .select('title discussions');

        let allDiscussions = [];
        courses.forEach(course => {
            course.discussions.forEach(discussion => {
                allDiscussions.push({
                    courseId: course._id,
                    courseTitle: course.title,
                    discussionId: discussion._id,
                    user: discussion.user,
                    text: discussion.text,
                    isTeacher: discussion.isTeacher,
                    createdAt: discussion.createdAt,
                    replies: discussion.replies
                });
            });
        });

        // Sort by newest first globally
        allDiscussions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(allDiscussions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   DELETE api/admin/discussions/:courseId/:discussionId
// @desc    Delete a discussion thread
// @access  Admin
exports.deleteDiscussion = async (req, res) => {
    try {
        const { courseId, discussionId } = req.params;
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ msg: 'Course not found' });

        course.discussions = course.discussions.filter(d => d._id.toString() !== discussionId);
        await course.save();
        res.json({ msg: 'Discussion deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   DELETE api/admin/discussions/:courseId/:discussionId/replies/:replyId
// @desc    Delete a discussion reply
// @access  Admin
exports.deleteReply = async (req, res) => {
    try {
        const { courseId, discussionId, replyId } = req.params;
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ msg: 'Course not found' });

        const discussion = course.discussions.id(discussionId);
        if (!discussion) return res.status(404).json({ msg: 'Discussion not found' });

        discussion.replies = discussion.replies.filter(r => r._id.toString() !== replyId);
        await course.save();
        res.json({ msg: 'Reply deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
