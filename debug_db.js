const mongoose = require('mongoose');
const User = require('./server/models/User');
const Course = require('./server/models/Course');
require('dotenv').config({ path: './server/.env' });

async function checkDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/e-learning');
        console.log('Connected to DB');

        const srikanth = await User.findOne({ email: 'srikanth@gmail.com' });
        if (!srikanth) {
            console.log('Srikanth not found');
        } else {
            console.log(`Srikanth ID: ${srikanth._id}`);
            const courses = await Course.find({ teacher: srikanth._id });
            console.log(`Owned courses: ${courses.length}`);
            courses.forEach(c => console.log(` - ${c.title} (${c._id})`));
        }

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

checkDB();
