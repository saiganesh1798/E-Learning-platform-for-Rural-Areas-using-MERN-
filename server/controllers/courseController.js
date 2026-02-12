const Course = require('../models/Course');
const User = require('../models/User');

// @route   POST api/courses
// @desc    Create a new course
// @access  Teacher/Admin
exports.createCourse = async (req, res) => {
    const { title, description, category, price, thumbnail } = req.body;
    try {
        const newCourse = new Course({
            title,
            description,
            category,
            price,
            thumbnail,
            teacher: req.user.id
        });

        const course = await newCourse.save();
        res.json(course);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   GET api/courses
// @desc    Get all courses
// @access  Public
exports.getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find().populate('teacher', 'name');
        res.json(courses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   GET api/courses/:id
// @desc    Get course by ID
// @access  Public
exports.getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('teacher', 'name');
        if (!course) {
            return res.status(404).json({ msg: 'Course not found' });
        }
        res.json(course);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Course not found' });
        }
        res.status(500).send('Server Error');
    }
};

// @route   POST api/courses/enroll/:id
// @desc    Enroll in a course
// @access  Student
exports.enrollCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ msg: 'Course not found' });
        }

        // Check if already enrolled (Check both Course and User to be safe, but Course check is usually enough if synced)
        // We will check User progress to be sure we don't duplicate there
        const user = await User.findById(req.user.id);

        const alreadyEnrolled = user.progress.some(p => p.courseId.toString() === course._id.toString());
        if (alreadyEnrolled) {
            return res.status(400).json({ msg: 'Already enrolled in this course' });
        }

        // Add to Course
        course.enrolledStudents.push(req.user.id);
        await course.save();

        // Add to User Progress
        user.progress.push({
            courseId: course._id,
            completedLessons: [],
            quizScores: []
        });
        await user.save();

        res.json(course);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   GET api/courses/my-courses
// @desc    Get courses created by teacher or enrolled by student
// @access  Private
exports.getMyCourses = async (req, res) => {
    try {
        let courses;
        const user = await User.findById(req.user.id);

        if (user.role === 'teacher') {
            courses = await Course.find({ teacher: req.user.id });
        } else {
            courses = await Course.find({ enrolledStudents: req.user.id }).populate('teacher', 'name');
        }
        res.json(courses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   POST api/courses/:id/lessons
// @desc    Add a lesson to a course
// @access  Teacher
exports.addLesson = async (req, res) => {
    const { title, url, type } = req.body;
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ msg: 'Course not found' });
        }

        // Make sure user is course teacher
        if (course.teacher.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const newLesson = {
            title,
            url,
            type // 'video' or 'document'
        };

        course.lessons.push(newLesson);
        await course.save();

        res.json(course.lessons);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   GET api/courses/teacher/analytics
// @desc    Get analytics for teacher dashboard
// @access  Teacher
exports.getTeacherAnalytics = async (req, res) => {
    try {
        // Verify user is a teacher
        // Note: req.user.role is already available via auth middleware, but double check
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ msg: 'Access denied. Teachers only.' });
        }

        // 1. Get all courses created by this teacher
        const courses = await Course.find({ teacher: req.user.id });
        const courseIds = courses.map(c => c._id);

        // 2. Calculate Total Courses
        const totalCourses = courses.length;

        // 3. Calculate Total Students Enrolled (Unique)
        const studentIds = new Set();
        courses.forEach(course => {
            course.enrolledStudents.forEach(studentId => {
                studentIds.add(studentId.toString());
            });
        });
        const totalStudents = studentIds.size;

        // 4. Calculate Average Student Progress & Student List
        const usersWithProgress = await User.find({
            'progress.courseId': { $in: courseIds }
        }).select('progress name email');

        let totalProgressPercentage = 0;
        let progressCount = 0;
        const studentPerformance = [];

        usersWithProgress.forEach(student => {
            // Filter progress for ONLY this teacher's courses
            const relevantProgress = student.progress.filter(p =>
                courseIds.some(id => id.toString() === p.courseId.toString())
            );

            relevantProgress.forEach(p => {
                const course = courses.find(c => c._id.toString() === p.courseId.toString());
                if (!course) return;

                const totalLessons = course.lessons ? course.lessons.length : 0;
                const completedCount = p.completedLessons.length;
                const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

                totalProgressPercentage += percentage;
                progressCount++;

                studentPerformance.push({
                    studentId: student._id,
                    studentName: student.name,
                    courseTitle: course.title,
                    progress: percentage
                });
            });
        });

        const avgProgress = progressCount > 0 ? Math.round(totalProgressPercentage / progressCount) : 0;

        res.json({
            totalCourses,
            totalStudents,
            avgProgress,
            studentPerformance
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
