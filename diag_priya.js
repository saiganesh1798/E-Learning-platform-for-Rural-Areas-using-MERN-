async function testDelete() {
    try {
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'teacher@example.com', password: '123456' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Login successful');

        const config = { headers: { 'x-auth-token': token } };

        const coursesRes = await fetch('http://localhost:5000/api/courses/my-courses', config);
        const courses = await coursesRes.json();
        console.log(`Priya has ${courses.length} courses.`);

        if (courses.length > 0) {
            const courseToDelete = courses[0];
            console.log(`Attempting to delete course: ${courseToDelete.title} (${courseToDelete._id})`);

            const delRes = await fetch(`http://localhost:5000/api/courses/${courseToDelete._id}`, {
                method: 'DELETE',
                ...config
            });
            const delData = await delRes.text();
            console.log('Delete status:', delRes.status, delData);

        }
    } catch (err) {
        console.error('Test failed:', err);
    }
}

testDelete();
