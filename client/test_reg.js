import axios from 'axios';

async function testRegistration() {
    try {
        console.log('Registering Teacher...');
        const teacherData = {
            name: 'Test Teacher Verify',
            email: 'testteacher_v' + Date.now() + '@example.com',
            password: 'password123',
            role: 'teacher',
            qualification: 'PhD in Physics',
            subjectExpertise: 'Physics',
            teachingExperience: 10,
            idProof: 'http://example.com/id.jpg',
            reasonForJoining: 'To teach rural students'
        };

        const res = await axios.post('http://localhost:5000/api/auth/register', teacherData);
        console.log('Registration Response Status:', res.status);
        if (res.data.user) {
            console.log('User Status:', res.data.user.status);
        } else {
            console.log('Response Token:', res.data.token);
        }

        // Now login as admin to check if fields are present in getAllUsers
        console.log('\nLogging in as Admin...');
        const adminLogin = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@example.com',
            password: '123456'
        });
        const token = adminLogin.data.token;

        console.log('Fetching Users as Admin...');
        const usersRes = await axios.get('http://localhost:5000/api/admin/users', {
            headers: { 'x-auth-token': token }
        });

        const createdTeacher = usersRes.data.find(u => u.email === teacherData.email);
        console.log('\nRetrieved Teacher from Admin API:');
        console.log(createdTeacher);

    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
}

testRegistration();
