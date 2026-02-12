const express = require('express');
const router = express.Router();
const { getDashboardData, updateCourseProgress } = require('../controllers/userController');
const auth = require('../middleware/auth'); // Assuming you have an auth middleware

// Protected Route: Get Student Dashboard
router.get('/dashboard', auth, getDashboardData);

// Protected Route: Update Course Progress (Mark Lesson as Completed)
router.post('/progress', auth, updateCourseProgress);

module.exports = router;
