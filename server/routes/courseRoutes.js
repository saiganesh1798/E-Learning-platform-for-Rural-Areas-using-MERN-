const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkTeacherApproval = require('../middleware/checkTeacherApproval');
const {
    createCourse,
    getAllCourses,
    getCourseById,
    enrollCourse,
    getMyCourses,
    addLesson
} = require('../controllers/courseController');

router.post('/', auth, checkTeacherApproval, createCourse);
router.get('/', getAllCourses);
router.get('/my-courses', auth, getMyCourses);
router.get('/:id', getCourseById);
router.post('/enroll/:id', auth, enrollCourse);
router.get('/teacher/analytics', auth, require('../controllers/courseController').getTeacherAnalytics);
router.post('/:id/lessons', auth, checkTeacherApproval, addLesson);

module.exports = router;
