const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createQuiz, getQuizzesByCourse, getQuizById, updateQuiz, submitQuiz } = require('../controllers/quizController');

router.post('/', auth, createQuiz);
router.put('/:id', auth, updateQuiz);
router.get('/course/:courseId', getQuizzesByCourse);
router.get('/:id', auth, getQuizById);
router.post('/:id/submit', auth, submitQuiz);

module.exports = router;
