const User = require('../models/User');
const Course = require('../models/Course');
const bcrypt = require('bcryptjs');

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
            bio: 'Expert in Mathematics and Science with 10 years of experience.'
        });

        const student = new User({
            name: 'Rahul Verma',
            email: 'student@example.com',
            password: hasedPassword,
            role: 'student',
            status: 'active'
        });

        await admin.save();
        await teacher.save();
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

        await Course.insertMany(courses);

        res.json({ msg: 'Database Configured with Demo Data!', users: ['admin@example.com', 'teacher@example.com', 'student@example.com'], password: '123456' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error during seeding');
    }
};
