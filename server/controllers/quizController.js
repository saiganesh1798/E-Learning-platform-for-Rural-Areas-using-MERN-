const Quiz = require('../models/Quiz');
const Course = require('../models/Course');
const User = require('../models/User');

// @route   POST api/quizzes
// @desc    Create a new quiz
// @access  Teacher
exports.createQuiz = async (req, res) => {
    const { title, courseId, questions } = req.body;
    try {
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ msg: 'Course not found' });

        if (course.teacher.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const newQuiz = new Quiz({
            title,
            course: courseId,
            questions
        });

        const quiz = await newQuiz.save();
        res.json(quiz);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   PUT api/quizzes/:id
// @desc    Update an existing quiz
// @access  Teacher
exports.updateQuiz = async (req, res) => {
    const { title, questions } = req.body;
    try {
        let quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ msg: 'Quiz not found' });

        const course = await Course.findById(quiz.course);
        if (!course) return res.status(404).json({ msg: 'Associated course not found' });

        if (course.teacher.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        quiz = await Quiz.findByIdAndUpdate(
            req.params.id,
            { $set: { title, questions } },
            { new: true }
        );

        res.json(quiz);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   GET api/quizzes/course/:courseId
// @desc    Get all quizzes for a course
// @access  Public (or Enrolled Check ideally)
exports.getQuizzesByCourse = async (req, res) => {
    try {
        const quizzes = await Quiz.find({ course: req.params.courseId });
        res.json(quizzes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   GET api/quizzes/:id
// @desc    Get quiz by ID
// @access  Private
exports.getQuizById = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ msg: 'Quiz not found' });
        res.json(quiz);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   POST api/quizzes/:id/submit
// @desc    Submit quiz and get grade
// @access  Student
exports.submitQuiz = async (req, res) => {
    const { answers } = req.body; // Array of selected option indices
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ msg: 'Quiz not found' });

        let score = 0;
        quiz.questions.forEach((q, index) => {
            if (answers[index] === q.correctOptionIndex) {
                score++;
            }
        });

        const percentage = Math.round((score / quiz.questions.length) * 100);

        // Save result to User profile
        const user = await User.findById(req.user.id);

        // Find if course progress exists
        let courseProgress = user.progress.find(p => p.courseId.toString() === quiz.course.toString());

        if (!courseProgress) {
            // Create new progress entry if not exists (should theoretically exist if enrolled, but fail-safe)
            user.progress.push({
                courseId: quiz.course,
                completedLessons: [],
                quizScores: [{
                    quizId: quiz._id,
                    score: percentage,
                    date: Date.now()
                }]
            });
        } else {
            // Push to existing
            courseProgress.quizScores.push({
                quizId: quiz._id,
                score: percentage,
                date: Date.now()
            });
        }

        await user.save();

        res.json({ score, total: quiz.questions.length, percentage });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
