const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;
    console.log('REGISTER REQUEST RECEIVED:', req.body);
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Determine initial status
        // Teachers: Pending by default
        // Students: Active by default (can be changed to pending if strictness needed)
        // Admin: Active (usually seeded, but if registered via this route - assume active or protected)
        let initialStatus = 'active';
        if (role === 'teacher') {
            initialStatus = 'pending';
        }

        const isApproved = role === 'teacher' ? false : true;
        const approvalStatus = role === 'teacher' ? 'pending' : 'approved';

        user = new User({
            name,
            email,
            password,
            role,
            status: initialStatus,
            // Spread other potential fields from body
            phone: req.body.phone,
            village: req.body.village,
            educationLevel: req.body.educationLevel,
            qualification: req.body.qualification,
            subjectExpertise: req.body.subjectExpertise,
            teachingExperience: req.body.teachingExperience,
            idProof: req.body.idProof,
            reasonForJoining: req.body.reasonForJoining,
            isApproved,
            approvalStatus
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const payload = {
            user: {
                id: user.id,
                role: user.role,
                isApproved: user.isApproved
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Check Access Status
        if (user.role === 'teacher') {
            if (!user.isApproved) {
                if (user.approvalStatus === 'rejected') {
                    return res.status(403).json({ msg: 'Your account has been rejected by the admin.' });
                }
                return res.status(403).json({ msg: 'Your account is pending approval. Please wait for Admin.' });
            }
        }

        if (user.status === 'pending' || user.status === 'rejected') { // Keep legacy check just in case
            return res.status(403).json({ msg: `Account is ${user.status}. Please contact support.` });
        }

        // Streak Logic (Only for students)
        if (user.role === 'student') {
            const now = new Date();
            const lastLogin = user.streaks.lastLoginDate ? new Date(user.streaks.lastLoginDate) : null;

            if (lastLogin) {
                const diffTime = Math.abs(now - lastLogin);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // If logged in yesterday (within roughly 24-48 hours window logic or just check calendar days)
                // Simplified logic: Check if last login was strictly "yesterday"
                const today = new Date().setHours(0, 0, 0, 0);
                const lastLoginDay = new Date(lastLogin).setHours(0, 0, 0, 0);

                if (today - lastLoginDay === 86400000) { // Exactly 1 day difference
                    user.streaks.currentStreak += 1;
                } else if (today - lastLoginDay > 86400000) {
                    // Missed a day
                    user.streaks.currentStreak = 1;
                }
                // If same day, do nothing
            } else {
                // First login ever or since tracking
                user.streaks.currentStreak = 1;
            }

            // Update Longest Streak
            if (user.streaks.currentStreak > user.streaks.longestStreak) {
                user.streaks.longestStreak = user.streaks.currentStreak;
            }

            user.streaks.lastLoginDate = now;
            await user.save();
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role,
                isApproved: user.isApproved
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
