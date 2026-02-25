const express = require('express');
const router = express.Router();
const { getDashboardData, updateCourseProgress, updateTheme, updateStreak, getLeaderboard, updateVideoQuizScore } = require('../controllers/userController');
const auth = require('../middleware/auth'); // Assuming you have an auth middleware

// Protected Route: Get Student Dashboard
router.get('/dashboard', auth, getDashboardData);

// Protected Route: Update Course Progress (Mark Lesson as Completed)
router.post('/progress', auth, updateCourseProgress);

// Protected Route: Update Theme Preference
router.put('/theme', auth, updateTheme);

// Protected Route: Update Daily Streak
router.post('/update-streak', auth, updateStreak);

// Protected Route: Get Leaderboard
router.get('/leaderboard', auth, getLeaderboard);
// Protected Route: Update Video Quiz Score
router.post('/video-quiz-score', auth, updateVideoQuizScore);

module.exports = router;
