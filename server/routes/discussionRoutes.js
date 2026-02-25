const express = require('express');
const router = express.Router({ mergeParams: true }); // Important: to access :courseId from parent route
const auth = require('../middleware/auth');
const {
    getDiscussionsByCourse,
    createDiscussion,
    addReply
} = require('../controllers/discussionController');

// All routes here will be prepended with /api/courses/:courseId/discussions 
// in server.js due to how we mount it (or we can mount it directly).

router.get('/', auth, getDiscussionsByCourse);
router.post('/', auth, createDiscussion);
router.post('/:discussionId/reply', auth, addReply);

module.exports = router;
