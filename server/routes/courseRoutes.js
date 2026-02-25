const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkTeacherApproval = require('../middleware/checkTeacherApproval');
const {
    createCourse,
    updateCourse,
    getAllCourses,
    getCourseById,
    enrollCourse,
    getMyCourses,
    addLesson,
    updateLesson,
    deleteCourse
} = require('../controllers/courseController');

router.post('/', auth, checkTeacherApproval, createCourse);
router.put('/:id', auth, checkTeacherApproval, updateCourse);
router.get('/', getAllCourses);
router.get('/my-courses', auth, getMyCourses);
router.get('/:id', getCourseById);
router.post('/enroll/:id', auth, enrollCourse);
router.get('/teacher/analytics', auth, require('../controllers/courseController').getTeacherAnalytics);

router.post('/:id/lessons', auth, checkTeacherApproval, addLesson);
router.put('/:id/lessons/:lessonId', auth, checkTeacherApproval, updateLesson);
router.delete('/:id', auth, checkTeacherApproval, deleteCourse);

module.exports = router;
