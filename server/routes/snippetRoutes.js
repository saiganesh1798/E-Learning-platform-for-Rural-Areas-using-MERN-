const express = require('express');
const router = express.Router();
const Snippet = require('../models/Snippet');
const auth = require('../middleware/auth');

// @route   POST api/snippets
// @desc    Create a new snippet
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { title, language, code, courseId } = req.body;

        const newSnippet = new Snippet({
            title,
            language,
            code,
            courseId,
            user: req.user.id
        });

        const snippet = await newSnippet.save();
        res.json(snippet);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/snippets/my-snippets
// @desc    Get current user's snippets
// @access  Private
router.get('/my-snippets', auth, async (req, res) => {
    try {
        console.log('Fetching snippets for user:', req.user.id);
        const snippets = await Snippet.find({ user: req.user.id }).sort({ createdAt: -1 });
        console.log('Found snippets:', snippets.length);
        res.json(snippets);
    } catch (err) {
        console.error('Error in /my-snippets:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
