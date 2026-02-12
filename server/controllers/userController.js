const User = require('../models/User');
const Course = require('../models/Course');

exports.getDashboardData = async (req, res) => {
    try {
        const user = await User.findById(req.user.id) // req.user set by auth middleware
            .populate('progress.courseId', 'title lessons') // Populate course title and lessons
            .select('-password'); // Exclude password

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Calculate Course Progress Percentages
        const courseProgress = await Promise.all(user.progress.map(async (p) => {
            if (!p.courseId) return null; // Handle deleted courses

            // Calculate total lessons from the lessons array length
            const totalLessons = p.courseId.lessons ? p.courseId.lessons.length : 0;
            const completedCount = p.completedLessons.length;
            let percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
            if (percentage > 100) percentage = 100;

            return {
                id: p.courseId._id,
                title: p.courseId.title,
                completed: completedCount,
                total: totalLessons,
                percentage: percentage,
                completedLessonIds: p.completedLessons
            };
        }));

        // Filter out nulls from deleted courses
        const validProgress = courseProgress.filter(cp => cp !== null);

        // Format Quiz Results
        const recentQuizzes = user.progress.flatMap(p =>
            p.quizScores.map(q => ({
                courseTitle: p.courseId ? p.courseId.title : 'Unknown Course',
                score: q.score,
                date: q.date
            }))
        ).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5); // Top 5 recent

        const dashboardData = {
            streaks: user.streaks,
            courseProgress: validProgress,
            recentQuizzes: recentQuizzes
        };

        res.json(dashboardData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateCourseProgress = async (req, res) => {
    const { courseId, lessonId } = req.body;
    try {
        const user = await User.findById(req.user.id);
        const courseProgress = user.progress.find(p => p.courseId.toString() === courseId);

        if (courseProgress) {
            // Check if lesson already completed
            if (!courseProgress.completedLessons.includes(lessonId)) {
                courseProgress.completedLessons.push(lessonId);
                await user.save();
            }
        } else {
            // If for some reason progress record doesn't exist (should exist on enroll), create it
            user.progress.push({
                courseId: courseId,
                completedLessons: [lessonId],
                quizScores: []
            });
            await user.save();
        }
        res.json(user.progress);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
