const User = require('../models/User');
const Course = require('../models/Course');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

exports.seedDatabase = async (req, res) => {
    try {
        console.log('Seeding Database...');

        // Clear existing data (optional, but good for clean slate)
        await User.deleteMany({});
        await Course.deleteMany({});

        // 1. Create Users
        const salt = await bcrypt.genSalt(10);
        const hasedPassword = await bcrypt.hash('123456', salt);

        const admin = new User({
            name: 'Admin User',
            email: 'admin@example.com',
            password: hasedPassword,
            role: 'admin',
            status: 'active'
        });

        const teacher = new User({
            name: 'Priya Sharma',
            email: 'teacher@example.com',
            password: hasedPassword,
            role: 'teacher',
            status: 'active',
            isApproved: true,
            approvalStatus: 'approved',
            bio: 'Expert in Mathematics and Science with 10 years of experience.'
        });

        const srikanth = new User({
            name: 'srikanth',
            email: 'srikanth@gmail.com',
            password: hasedPassword,
            role: 'teacher',
            status: 'active',
            isApproved: true,
            approvalStatus: 'approved'
        });

        const student = new User({
            name: 'Rahul Verma',
            email: 'student@example.com',
            password: hasedPassword,
            role: 'student',
            status: 'active'
        });

        const studentUsers = [
            { name: 'saiganesh', email: 'saiganesh@example.com' },
            { name: 'lohith', email: 'lohith@example.com' },
            { name: 'Naveen', email: 'naveen@example.com' },
            { name: 'Student User', email: 'user@example.com' },
            { name: 'chikatimalla saiganesh', email: 'chika@example.com' }
        ];

        const createdStudents = await Promise.all(studentUsers.map(async s => {
            const u = new User({ ...s, password: hasedPassword, role: 'student', status: 'active' });
            return await u.save();
        }));

        await admin.save();
        await teacher.save();
        await srikanth.save();
        await student.save();

        // 2. Create Courses
        const courses = [
            {
                title: 'Basic Mathematics for Farmers',
                description: 'Learn fundamental calculations needed for daily farming activities, including crop yield estimation and profit calculation.',
                category: 'Agriculture',
                thumbnail: 'https://images.unsplash.com/photo-1594771804886-715c52e46e49?q=80&w=600&auto=format&fit=crop', // Rice field
                price: 0,
                teacher: teacher._id,
                lessons: [
                    { title: 'Understanding Area and Hectares', type: 'video', url: 'https://www.youtube.com/watch?v=123Dummy' },
                    { title: 'Profit and Loss Basics', type: 'document', url: 'https://example.com/profit.pdf' }
                ]
            },
            {
                title: 'Introduction to Organic Farming',
                description: 'A comprehensive guide to shifting from chemical to organic farming. Healthier soil, healthier crops.',
                category: 'Farming',
                thumbnail: 'https://images.unsplash.com/photo-1625246333195-bf7f85c4c959?q=80&w=600&auto=format&fit=crop', // Organic veg
                price: 0,
                teacher: teacher._id,
                lessons: [
                    { title: 'Composting Techniques', type: 'video', url: 'https://www.youtube.com/watch?v=456Dummy' }
                ]
            },
            {
                title: 'Digital Literacy 101',
                description: 'How to use smartphones, banking apps, and government portals effectively.',
                category: 'Technology',
                thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop', // Laptop/Phone
                price: 0,
                teacher: teacher._id,
                lessons: []
            }
        ];

        const srikanthCourses = [
            {
                title: 'The Introduction to Data Structures',
                description: 'Master the basics of data structures including arrays, linked lists, and trees.',
                category: 'Computer Science',
                thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=600&auto=format&fit=crop',
                price: 0,
                teacher: srikanth._id,
                enrolledStudents: createdStudents.map(s => s._id),
                lessons: [{ title: 'Arrays 101', type: 'video', url: 'https://youtube.com/dummy1' }]
            },
            {
                title: 'Python Full Course for Beginners',
                description: 'Everything you need to know to start coding in Python today.',
                category: 'Programming',
                thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop',
                price: 0,
                teacher: srikanth._id,
                enrolledStudents: [createdStudents[0]._id],
                lessons: [{ title: 'Python Setup', type: 'video', url: 'https://youtube.com/dummy2' }]
            },
            {
                title: 'Computer Networks',
                description: 'Deep dive into computer networking concepts and protocols.',
                category: 'IT',
                thumbnail: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=600&auto=format&fit=crop',
                price: 0,
                teacher: srikanth._id,
                enrolledStudents: [createdStudents[0]._id, srikanth._id], // Self enrollment as seen in screenshot
                lessons: [{ title: 'OSI Model', type: 'video', url: 'https://youtube.com/dummy3' }]
            }
        ];

        await Course.insertMany([...courses, ...srikanthCourses]);

        // 3. Add progress for students so it shows on dashboard
        const allCreatedStudents = [student, ...createdStudents, srikanth]; // srikanth is also enrolled in his own course Networks
        const allCourses = await Course.find();

        for (const s of allCreatedStudents) {
            const enrolled = allCourses.filter(c => c.enrolledStudents.includes(s._id));
            if (enrolled.length > 0) {
                s.progress = enrolled.map(c => {
                    const totalLessons = c.lessons ? c.lessons.length : 0;
                    const randomProgress = Math.floor(Math.random() * 100);
                    const completedLessons = [];

                    if (totalLessons > 0) {
                        const numCompleted = Math.floor((randomProgress / 100) * totalLessons);
                        for (let i = 0; i < numCompleted; i++) {
                            if (c.lessons[i]) {
                                // Since lessons are subdocs without separate IDs in the schema shown, 
                                // we'll use their index or just simulate IDs if needed.
                                // Actually, UserSchema says ref: 'Lesson', but CourseSchema has them inline.
                                // If they are inline, they have _id if they are subdocuments.
                                completedLessons.push(c.lessons[i]._id);
                            }
                        }
                    }

                    return {
                        courseId: c._id,
                        completedLessons,
                        quizScores: [{
                            quizId: new mongoose.Types.ObjectId(), // Placeholder
                            score: Math.floor(Math.random() * 40) + 60, // Passing score
                            date: new Date()
                        }]
                    };
                });
                await s.save();
            }
        }

        res.json({ msg: 'Database Configured with Demo Data!', users: ['admin@example.com', 'teacher@example.com', 'srikanth@gmail.com'], password: '123456' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error during seeding');
    }
};
