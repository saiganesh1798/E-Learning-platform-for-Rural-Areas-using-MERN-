const Discussion = require('../models/Discussion');

// @route   GET /api/courses/:courseId/discussions
// @desc    Get all discussions for a course
exports.getDiscussionsByCourse = async (req, res) => {
    try {
        const discussions = await Discussion.find({ courseId: req.params.courseId })
            .populate('user', 'name role')
            .populate('replies.user', 'name role')
            .sort({ updatedAt: -1 });

        res.json(discussions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   POST /api/courses/:courseId/discussions
// @desc    Create a new discussion thread
exports.createDiscussion = async (req, res) => {
    try {
        const { title, content, lessonId } = req.body;

        if (!title || !content) {
            return res.status(400).json({ msg: 'Please provide title and content' });
        }

        const newDiscussion = new Discussion({
            courseId: req.params.courseId,
            user: req.user.id,
            title,
            content,
            lessonId
        });

        const discussion = await newDiscussion.save();

        // Populate user before sending back
        await discussion.populate('user', 'name role');

        res.json(discussion);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   POST /api/courses/:courseId/discussions/:discussionId/reply
// @desc    Add a reply to a discussion
exports.addReply = async (req, res) => {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ msg: 'Reply content is required' });
        }

        const discussion = await Discussion.findById(req.params.discussionId);

        if (!discussion) {
            return res.status(404).json({ msg: 'Discussion not found' });
        }

        const newReply = {
            user: req.user.id,
            content
        };

        discussion.replies.push(newReply);
        discussion.updatedAt = Date.now();
        await discussion.save();

        // Populate the new reply's user for the frontend
        await discussion.populate('replies.user', 'name role');

        res.json(discussion);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
