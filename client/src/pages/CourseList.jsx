import React, { useState, useEffect } from 'react';

import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, User, CheckCircle, AlertTriangle, Search } from 'lucide-react';

const CourseList = ({ hideBackButton = false }) => {
    const [courses, setCourses] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [enrolledCourseIds, setEnrolledCourseIds] = useState([]); // Store IDs of enrolled courses
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [enrollModal, setEnrollModal] = useState({ show: false, courseId: null, courseTitle: '' });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch public courses
                const coursesRes = await axios.get('http://localhost:5000/api/courses');

                // Fetch user data to see enrolled courses (if logged in)
                const token = localStorage.getItem('token');
                if (token) {
                    const config = { headers: { 'x-auth-token': token } };
                    // We can use the dashboard endpoint which has progress/enrolled info
                    const dashboardRes = await axios.get('http://localhost:5000/api/users/dashboard', config);
                    // Extract enrolled course IDs from the courseProgress array
                    const ids = dashboardRes.data.courseProgress.map(cp => cp.id);
                    setEnrolledCourseIds(ids);
                }

                setCourses(coursesRes.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching data', err);
                setError('Failed to load courses. Please check if the server is running.');
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleEnrollClick = (courseId, courseTitle) => {
        setEnrollModal({ show: true, courseId, courseTitle });
    };

    const confirmEnroll = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Please login to enroll.');
                navigate('/login');
                return;
            }

            const config = {
                headers: {
                    'x-auth-token': token
                }
            };

            await axios.post(`http://localhost:5000/api/courses/enroll/${enrollModal.courseId}`, {}, config);

            setEnrollModal({ show: false, courseId: null, courseTitle: '' });
            alert('Successfully Enrolled!');
            // Update local state to show "Go to Course" immediately without reload
            setEnrolledCourseIds([...enrolledCourseIds, enrollModal.courseId]);
            // navigate('/dashboard'); // Optional: stay here or go to dashboard. Stay here is better flow for browsing.

        } catch (err) {
            console.error(err);
            setEnrollModal({ show: false, courseId: null, courseTitle: '' });
            alert(err.response?.data?.msg || 'Enrollment failed');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex justify-center items-center">
            <div className="h-12 w-12 border-t-2 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm max-w-lg">
                <p className="font-bold">Error</p>
                <p>{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 bg-white border border-red-200 text-red-600 px-4 py-2 rounded hover:bg-red-50"
                >
                    Retry
                </button>
            </div>
        </div>
    );

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={`bg-gray-50 p-4 md:p-8 ${!hideBackButton ? 'min-h-screen' : ''}`}>
            {!hideBackButton && (
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-white px-4 py-2 rounded-md shadow-sm border border-gray-200 transition-colors"
                    >
                        &larr; Back to Dashboard
                    </button>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center shrink-0">
                    <BookOpen className="mr-3 text-indigo-600" />
                    Course Catalog
                </h1>

                {/* Search Bar */}
                <div className="relative w-full md:w-96 text-gray-600">
                    <input
                        className="w-full bg-white border-2 border-gray-200 h-12 px-5 pr-10 rounded-full text-sm focus:outline-none focus:border-indigo-500 shadow-sm transition-colors"
                        type="search"
                        name="search"
                        placeholder="Search for courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="absolute right-0 top-0 mt-3 mr-4 focus:outline-none pointer-events-none">
                        <Search className="h-6 w-6 text-gray-400" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.length === 0 ? <p className="text-gray-500 col-span-full">No courses found matching your search.</p> : filteredCourses.map(course => {
                    const isEnrolled = enrolledCourseIds.includes(course._id);

                    return (
                        <div key={course._id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-300 flex flex-col h-full">
                            {/* Thumbnail - CSS "Low Res" simulation or just standard optimization */}
                            <div className="h-48 bg-gray-200 relative overflow-hidden">
                                {course.thumbnail ? (
                                    <img
                                        src={course.thumbnail}
                                        alt={course.title}
                                        className="w-full h-full object-cover"
                                        loading="lazy" // Native lazy loading for performance
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-300">
                                        <BookOpen size={48} />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-indigo-700 uppercase tracking-wide">
                                    {course.category}
                                </div>
                            </div>

                            <div className="p-6 flex-grow flex flex-col justify-between">
                                <div>
                                    <h2 className="text-xl font-bold mb-2 text-gray-800 line-clamp-2">{course.title}</h2>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{course.description}</p>

                                    <div className="flex items-center mb-4 text-sm text-gray-500">
                                        <User size={16} className="mr-1" />
                                        <span>{course.teacher?.name || 'Instructor'}</span>
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-3">
                                    <Link
                                        to={`/courses/${course._id}`}
                                        className="flex-1 text-center border border-indigo-600 text-indigo-600 py-2 rounded-lg hover:bg-indigo-50 font-medium transition-colors"
                                    >
                                        Details
                                    </Link>
                                    {isEnrolled ? (
                                        <Link
                                            to={`/courses/${course._id}`} // Or directly to first lesson if possible. For now, details/course page is fine, which usually has "Start"
                                            className="flex-1 text-center border-2 border-green-500 text-green-600 py-2 rounded-lg hover:bg-green-50 font-medium shadow-sm transition-colors flex items-center justify-center"
                                        >
                                            <CheckCircle size={16} className="mr-1" />
                                            Go to Course
                                        </Link>
                                    ) : (
                                        <button
                                            onClick={() => handleEnrollClick(course._id, course.title)}
                                            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-medium shadow-sm transition-colors"
                                        >
                                            Enroll Now
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Confirmation Modal */}
            {enrollModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 transform transition-all scale-100 opacity-100">
                        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mx-auto mb-4">
                            <AlertTriangle className="text-indigo-600 h-6 w-6" />
                        </div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900 text-center mb-2">Confirm Enrollment</h3>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            Are you sure you want to enroll in <strong>{enrollModal.courseTitle}</strong>?
                            <br /><span className="text-xs text-gray-400 mt-1 block">(This will add the course to your learning dashboard)</span>
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setEnrollModal({ show: false, courseId: null, courseTitle: '' })}
                                className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmEnroll}
                                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 font-medium shadow-sm"
                            >
                                Yes, Enroll
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseList;
