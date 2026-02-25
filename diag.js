const axios = require('axios');

async function testApi() {
    try {
        // We need a token. Let's try to login first.
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'srikanth@gmail.com',
            password: '123456'
        });
        const token = loginRes.data.token;
        console.log('Login successful');

        const config = { headers: { 'x-auth-token': token } };

        console.log('Testing /api/courses/my-courses...');
        try {
            const res = await axios.get('http://localhost:5000/api/courses/my-courses', config);
            console.log('Success:', res.status);
        } catch (err) {
            console.log('Failed /api/courses/my-courses:', err.response?.status, err.response?.data);
        }

        console.log('Testing /api/courses/teacher/analytics...');
        try {
            const res = await axios.get('http://localhost:5000/api/courses/teacher/analytics', config);
            console.log('Success:', res.status);
        } catch (err) {
            console.log('Failed /api/courses/teacher/analytics:', err.response?.status, err.response?.data);
        }

    } catch (err) {
        console.error('Login failed:', err.response?.status, err.response?.data);
    }
}

testApi();
