import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


const TeacherDashboard = () => {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState({
        totalCourses: 0,
        totalStudents: 0,
        avgProgress: 0,
        studentPerformance: []
    });
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [courseToDelete, setCourseToDelete] = useState(null); // Custom modal state

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { 'x-auth-token': token } };

                // Fetch Analytics
                const analyticsRes = await axios.get('http://127.0.0.1:5000/api/courses/teacher/analytics', config);
                setAnalytics(analyticsRes.data);

                // Fetch Teacher's Courses
                const coursesRes = await axios.get('http://127.0.0.1:5000/api/courses/my-courses', config);
                setCourses(coursesRes.data);



                setLoading(false);
            } catch (err) {
                console.error('Error fetching teacher dashboard data:', err);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleDeleteCourse = async () => {
        if (!courseToDelete) return;

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };

            await axios.delete(`http://127.0.0.1:5000/api/courses/${courseToDelete}`, config);

            alert('Course deleted successfully.');
            setCourseToDelete(null);
            // Trigger a re-fetch of dashboard data to update the UI
            window.location.reload();
        } catch (err) {
            console.error('Error deleting course:', err);
            alert('Failed to delete course. Please try again.');
            setCourseToDelete(null);
        }
    };



    const filteredStudents = analytics.studentPerformance.filter(student =>
        student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-6xl space-y-8">

                {/* Header & Welcome */}
                <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
                        <p className="text-gray-600 mt-1">Welcome back, {user?.name}. Here's what's happening today.</p>
                    </div>
                    <Link to="/create-course" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow transition duration-200">
                        + Create New Course
                    </Link>
                </div>

                {/* Empty State Check */}
                {courses.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <div className="mb-6">
                            <svg className="w-24 h-24 text-indigo-100 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Start Your Teaching Journey</h2>
                        <p className="text-gray-600 max-w-md mx-auto mb-8">
                            You haven't created any courses yet. Share your knowledge with students in rural areas and help them grow.
                        </p>
                        <Link to="/create-course" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
                            Create Your First Course &rarr;
                        </Link>

                        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto border-t pt-8">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h3 className="font-bold text-blue-800 mb-2">Teaching Tip #1</h3>
                                <p className="text-sm text-blue-700">Break down complex topics into bite-sized lessons (3-5 mins) for better engagement on mobile data.</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <h3 className="font-bold text-green-800 mb-2">Rural Teaching Best Practice</h3>
                                <p className="text-sm text-green-700">Use simple language and relatable examples. Many students might be learning in English as a second language.</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Analytics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-500 uppercase">Total Students</p>
                                        <h3 className="text-3xl font-bold text-gray-800 mt-1">{analytics.totalStudents}</h3>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-indigo-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-500 uppercase">Courses Published</p>
                                        <h3 className="text-3xl font-bold text-gray-800 mt-1">{analytics.totalCourses}</h3>
                                    </div>
                                    <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-500 uppercase">Avg. Student Progress</p>
                                        <h3 className="text-3xl font-bold text-gray-800 mt-1">{analytics.avgProgress}%</h3>
                                    </div>
                                    <div className="p-3 bg-green-100 rounded-full text-green-600">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>



                        {/* Two Column Layout: My Courses & Student Progress */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                            {/* Course Management Table */}
                            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                    <h2 className="text-lg font-bold text-gray-800">My Courses</h2>
                                    <Link to="/courses" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">View All</Link>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-gray-600">
                                        <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b">
                                            <tr>
                                                <th className="px-6 py-3">Course Title</th>
                                                <th className="px-6 py-3 text-center">Enrolled</th>
                                                <th className="px-6 py-3 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {courses.map(course => (
                                                <tr key={course._id} className="hover:bg-gray-50 transition">
                                                    <td className="px-6 py-4 font-medium text-gray-900 border-l-4 border-transparent hover:border-indigo-500">
                                                        {course.title}
                                                        <div className="text-xs text-gray-400 font-normal mt-1">
                                                            Created: {new Date(course.createdAt).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-xs font-bold">
                                                            {course.enrolledStudents.length}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center space-x-2">
                                                            <Link
                                                                to={`/courses/${course._id}/add-lesson`}
                                                                className="text-gray-500 hover:text-indigo-600 p-1 tooltip"
                                                                title="Manage Lessons"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                                            </Link>
                                                            <button
                                                                onClick={() => setCourseToDelete(course._id)}
                                                                className="text-gray-500 hover:text-red-500 p-1 tooltip"
                                                                title="Delete Course"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Student Performance Table */}
                            <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                    <h2 className="text-lg font-bold text-gray-800">Student Progress</h2>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search student..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="text-sm border border-gray-300 rounded-md py-1 px-3 pl-8 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                        <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>
                                </div>
                                <div className="overflow-x-auto flex-grow">
                                    {filteredStudents.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 text-sm">
                                            No student data found.
                                        </div>
                                    ) : (
                                        <table className="w-full text-left text-sm text-gray-600">
                                            <thead className="bg-white text-xs uppercase font-semibold text-gray-500 border-b">
                                                <tr>
                                                    <th className="px-6 py-3">Student Name</th>
                                                    <th className="px-6 py-3">Course</th>
                                                    <th className="px-6 py-3 w-1/3">Progress</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {filteredStudents.map((student, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-6 py-3 font-medium text-gray-900">{student.studentName}</td>
                                                        <td className="px-6 py-3 text-xs text-gray-500">{student.courseTitle}</td>
                                                        <td className="px-6 py-3">
                                                            <div className="flex items-center">
                                                                <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                                                                    <div
                                                                        className={`h-2 rounded-full ${student.progress === 100 ? 'bg-green-500' :
                                                                            student.progress > 50 ? 'bg-indigo-500' : 'bg-yellow-500'
                                                                            }`}
                                                                        style={{ width: `${student.progress}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-xs font-semibold text-gray-700">{student.progress}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>

                        </div>
                    </>
                )}
            </div>

            {/* Custom Delete Confirmation Modal */}
            {courseToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl transform transition-all">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900 text-center mb-2">Delete Course</h3>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            Are you sure you want to delete this course? All of its data, including student progress, will be permanently removed. This action cannot be undone.
                        </p>
                        <div className="flex justify-center space-x-3">
                            <button
                                onClick={() => setCourseToDelete(null)}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteCourse}
                                className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Delete Course
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherDashboard;
