const User = require('../models/User');
const Course = require('../models/Course');

exports.getDashboardData = async (req, res) => {
    try {
        console.log('Fetching dashboard data for user:', req.user.id);
        const user = await User.findById(req.user.id) // req.user set by auth middleware
            .populate('progress.courseId', 'title lessons') // Populate course title and lessons
            .select('-password'); // Exclude password

        if (!user) {
            console.log('User not found:', req.user.id);
            return res.status(404).json({ msg: 'User not found' });
        }

        // Calculate Course Progress Percentages
        const courseProgress = await Promise.all((user.progress || []).map(async (p) => {
            if (!p.courseId) {
                console.log('Skipping progress entry with missing courseId');
                return null;
            }

            const totalLessons = p.courseId.lessons ? p.courseId.lessons.length : 0;
            const completedCount = p.completedLessons ? p.completedLessons.length : 0;
            let percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
            if (percentage > 100) percentage = 100;

            return {
                id: p.courseId._id,
                title: p.courseId.title,
                completed: completedCount,
                total: totalLessons,
                percentage: percentage,
                completedLessonIds: p.completedLessons || [],
                completedAt: p.completedAt || (percentage === 100 ? new Date(p.courseId.createdAt || Date.now()) : null)
            };
        }));

        // Filter out nulls from deleted courses
        const validProgress = courseProgress.filter(cp => cp !== null);
        console.log('Processed progress items:', validProgress.length);

        // Format Quiz Results
        const recentQuizzes = (user.progress || []).flatMap(p =>
            (p.quizScores || []).map(q => ({
                courseTitle: p.courseId ? p.courseId.title : 'Unknown Course',
                score: q.score,
                date: q.date
            }))
        ).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5); // Top 5 recent
        console.log('Processed quiz results:', recentQuizzes.length);

        const dashboardData = {
            userName: user.name,
            streaks: user.streaks,
            courseProgress: validProgress,
            recentQuizzes: recentQuizzes
        };

        res.json(dashboardData);
    } catch (err) {
        console.error('Error in getDashboardData:', err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateCourseProgress = async (req, res) => {
    const { courseId, lessonId } = req.body;
    try {
        const user = await User.findById(req.user.id);
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ msg: 'Course not found' });
        }

        const courseProgress = user.progress.find(p => p.courseId.toString() === courseId);

        if (courseProgress) {
            // Check if lesson already completed
            if (!courseProgress.completedLessons.includes(lessonId)) {
                courseProgress.completedLessons.push(lessonId);

                // Track completion date
                if (courseProgress.completedLessons.length >= course.lessons.length && !courseProgress.completedAt) {
                    courseProgress.completedAt = new Date();
                }

                await user.save();
            }
        } else {
            // If for some reason progress record doesn't exist (should exist on enroll), create it
            user.progress.push({
                courseId: courseId,
                completedLessons: [lessonId],
                quizScores: [],
                completedAt: course.lessons.length === 1 ? new Date() : undefined
            });
            await user.save();
        }
        res.json(user.progress);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateTheme = async (req, res) => {
    const { theme } = req.body;
    if (!['light', 'dark'].includes(theme)) {
        return res.status(400).json({ msg: 'Invalid theme' });
    }
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        user.theme = theme;
        await user.save();
        res.json({ theme: user.theme });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateStreak = async (req, res) => {
    try {
        console.log('Updating streak for user:', req.user.id);
        const user = await User.findById(req.user.id);
        if (!user) {
            console.log('User not found for streak update:', req.user.id);
            return res.status(404).json({ msg: 'User not found' });
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let lastLogin = user.streaks?.lastLoginDate;

        if (lastLogin) {
            const lastLoginDate = new Date(lastLogin);
            const lastLoginDay = new Date(lastLoginDate.getFullYear(), lastLoginDate.getMonth(), lastLoginDate.getDate());

            const diffTime = Math.abs(today - lastLoginDay);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Logged in yesterday -> increment
                user.streaks.currentStreak += 1;
                if (user.streaks.currentStreak > (user.streaks.longestStreak || 0)) {
                    user.streaks.longestStreak = user.streaks.currentStreak;
                }
            } else if (diffDays > 1) {
                // Missed a day -> reset to 1
                user.streaks.currentStreak = 1;
            }
            // If diffDays === 0, already logged in today, do nothing to streak count
        } else {
            // First time logic
            user.streaks = {
                currentStreak: 1,
                longestStreak: 1,
            };
        }

        user.streaks.lastLoginDate = now;
        await user.save();
        console.log('Streak updated successfully for user:', req.user.id);

        res.json(user.streaks);
    } catch (err) {
        console.error('Error in updateStreak:', err.message);
        res.status(500).send('Server Error');
    }
};

exports.getLeaderboard = async (req, res) => {
    try {
        console.log('Fetching leaderboard');
        const users = await User.find({ role: 'student' }).select('name streaks progress profilePicture');

        // Calculate score: 10 pts per completed lesson, 5 pts per streak day
        const leaderboard = (users || []).map(u => {
            let totalLessons = 0;
            if (u.progress) {
                u.progress.forEach(p => {
                    totalLessons += (p.completedLessons ? p.completedLessons.length : 0);
                });
            }
            const currentStreak = u.streaks ? u.streaks.currentStreak || 0 : 0;
            const score = (totalLessons * 10) + (currentStreak * 5);

            return {
                id: u._id,
                name: u.name,
                score,
                lessonsCompleted: totalLessons,
                currentStreak,
                profilePicture: u.profilePicture
            };
        });

        // Sort descending and take top 10
        leaderboard.sort((a, b) => (b.score || 0) - (a.score || 0));
        const top10 = leaderboard.slice(0, 10);
        console.log('Leaderboard calculated, found:', top10.length, 'students');

        res.json(top10);
    } catch (err) {
        console.error('Error in getLeaderboard:', err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateCourseProgress = async (req, res) => {
    const { courseId, lessonId } = req.body;
    try {
        const user = await User.findById(req.user.id);
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ msg: 'Course not found' });
        }

        const courseProgress = user.progress.find(p => p.courseId.toString() === courseId);

        if (courseProgress) {
            // Check if lesson already completed
            if (!courseProgress.completedLessons.includes(lessonId)) {
                courseProgress.completedLessons.push(lessonId);

                // Track completion date
                if (courseProgress.completedLessons.length >= course.lessons.length && !courseProgress.completedAt) {
                    courseProgress.completedAt = new Date();
                }

                await user.save();
            }
        } else {
            // If for some reason progress record doesn't exist (should exist on enroll), create it
            user.progress.push({
                courseId: courseId,
                completedLessons: [lessonId],
                quizScores: [],
                completedAt: course.lessons.length === 1 ? new Date() : undefined
            });
            await user.save();
        }
        res.json(user.progress);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateTheme = async (req, res) => {
    const { theme } = req.body;
    if (!['light', 'dark'].includes(theme)) {
        return res.status(400).json({ msg: 'Invalid theme' });
    }
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        user.theme = theme;
        await user.save();
        res.json({ theme: user.theme });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateStreak = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let lastLogin = user.streaks?.lastLoginDate;

        if (lastLogin) {
            const lastLoginDate = new Date(lastLogin);
            const lastLoginDay = new Date(lastLoginDate.getFullYear(), lastLoginDate.getMonth(), lastLoginDate.getDate());

            const diffTime = Math.abs(today - lastLoginDay);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Logged in yesterday -> increment
                user.streaks.currentStreak += 1;
                if (user.streaks.currentStreak > (user.streaks.longestStreak || 0)) {
                    user.streaks.longestStreak = user.streaks.currentStreak;
                }
            } else if (diffDays > 1) {
                // Missed a day -> reset to 1
                user.streaks.currentStreak = 1;
            }
            // If diffDays === 0, already logged in today, do nothing to streak count
        } else {
            // First time logic
            user.streaks = {
                currentStreak: 1,
                longestStreak: 1,
            };
        }

        user.streaks.lastLoginDate = now;
        await user.save();

        res.json(user.streaks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getLeaderboard = async (req, res) => {
    try {
        const users = await User.find({ role: 'student' }).select('name streaks progress profilePicture videoQuizScore');

        // Calculate score: 10 pts per completed lesson, 5 pts per streak day + real-time videoQuizScore
        const leaderboard = users.map(u => {
            let totalLessons = 0;
            if (u.progress) {
                u.progress.forEach(p => {
                    totalLessons += (p.completedLessons?.length || 0);
                });
            }
            const currentStreak = u.streaks?.currentStreak || 0;
            const videoScore = u.videoQuizScore || 0;
            const score = (totalLessons * 10) + (currentStreak * 5) + videoScore;

            return {
                id: u._id,
                name: u.name,
                score,
                videoScore,
                lessonsCompleted: totalLessons,
                currentStreak,
                profilePicture: u.profilePicture
            };
        });

        // Sort descending and take top 10
        leaderboard.sort((a, b) => b.score - a.score);
        const top10 = leaderboard.slice(0, 10);

        res.json(top10);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateVideoQuizScore = async (req, res) => {
    try {
        const { isCorrect } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Initialize score if it doesn't exist
        if (user.videoQuizScore === undefined) {
            user.videoQuizScore = 0;
        }

        // Apply score logic (+3 for correct, -0.5 for incorrect)
        if (isCorrect) {
            user.videoQuizScore += 3;
        } else {
            user.videoQuizScore -= 0.5;
        }

        await user.save();

        res.json({
            msg: 'Score updated successfully',
            videoQuizScore: user.videoQuizScore
        });
    } catch (err) {
        console.error('Error updating video quiz score:', err.message);
        res.status(500).send('Server Error');
    }
};
