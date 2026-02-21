import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Flame, BookOpen, Trophy, Clock, AlertCircle, Sparkles, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import CourseList from './CourseList';

const StudentDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [allCourses, setAllCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Not authenticated');
                    setLoading(false);
                    return;
                }

                const config = {
                    headers: {
                        'x-auth-token': token
                    }
                };

                const [dashboardRes, coursesRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/users/dashboard', config),
                    axios.get('http://localhost:5000/api/courses')
                ]);

                setDashboardData(dashboardRes.data);
                setAllCourses(coursesRes.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to load dashboard data.');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-gray-300 rounded-full mb-4"></div>
                    <div className="h-4 w-48 bg-gray-300 rounded"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    // --- Recommendation Logic ---
    const getRecommendations = () => {
        if (!dashboardData || !allCourses.length) return [];

        const activeCourseIds = dashboardData.courseProgress?.map(cp => cp.id) || [];
        const completedCourseIds = dashboardData.courseProgress?.filter(cp => cp.percentage === 100).map(cp => cp.id) || [];

        // 1. Filter out courses the user is already enrolled in
        let availableCourses = allCourses.filter(course => !activeCourseIds.includes(course._id));

        // 2. Simple Rules Engine for Recommendations
        const recommendations = [];

        // Rule A: If finished Python, recommend Data Analytics or similar advanced topics
        const hasFinishedPython = completedCourseIds.some(id => allCourses.find(c => c._id === id)?.title.toLowerCase().includes('python'));
        if (hasFinishedPython) {
            const dataCourse = availableCourses.find(c => c.title.toLowerCase().includes('data') || c.category.toLowerCase().includes('data'));
            if (dataCourse) {
                recommendations.push({ course: dataCourse, reason: 'Since you finished Python, try Data Analytics!' });
                availableCourses = availableCourses.filter(c => c._id !== dataCourse._id); // Remove from pool
            }
        }

        // Rule B: If they have taken a quiz recently, recommend a course in the same category
        if (dashboardData.recentQuizzes?.length > 0) {
            const recentQuizCourseTitle = dashboardData.recentQuizzes[0].courseTitle;
            const recentCourse = allCourses.find(c => c.title === recentQuizCourseTitle);
            if (recentCourse) {
                const similarCourse = availableCourses.find(c => c.category === recentCourse.category);
                if (similarCourse) {
                    recommendations.push({ course: similarCourse, reason: `Because you studied ${recentCourse.category}` });
                    availableCourses = availableCourses.filter(c => c._id !== similarCourse._id);
                }
            }
        }

        // Rule C: Fill the rest with popular/random courses (up to 4 max)
        while (recommendations.length < 4 && availableCourses.length > 0) {
            const randomCourse = availableCourses[Math.floor(Math.random() * availableCourses.length)];
            recommendations.push({ course: randomCourse, reason: 'Highly rated by other students' });
            availableCourses = availableCourses.filter(c => c._id !== randomCourse._id);
        }

        return recommendations;
    };

    const recommendedCourses = getRecommendations();

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">My Learning Dashboard</h1>

            {/* Grid Layout - Responsive for Mobile/Rural */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Streak Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100 flex items-center space-x-4 transform transition-all hover:scale-105 duration-200">
                    <div className="bg-orange-100 p-4 rounded-full">
                        <Flame className="h-8 w-8 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Daily Streak</p>
                        <h2 className="text-3xl font-bold text-gray-900">{dashboardData?.streaks?.currentStreak || 0} Days</h2>
                        <p className="text-xs text-gray-400 mt-1">Longest: {dashboardData?.streaks?.longestStreak || 0} days</p>
                    </div>
                </div>

                {/* Course Completion Summary Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-100 flex items-center space-x-4">
                    <div className="bg-blue-100 p-4 rounded-full">
                        <BookOpen className="h-8 w-8 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Active Courses</p>
                        <h2 className="text-3xl font-bold text-gray-900">{dashboardData?.courseProgress?.length || 0}</h2>
                        <p className="text-xs text-gray-400 mt-1">Keep learning!</p>
                    </div>
                </div>

                {/* Total Quizzes Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-purple-100 flex items-center space-x-4">
                    <div className="bg-purple-100 p-4 rounded-full">
                        <Trophy className="h-8 w-8 text-purple-500" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Quizzes Taken</p>
                        <h2 className="text-3xl font-bold text-gray-900">{dashboardData?.recentQuizzes?.length || 0}</h2>
                        <p className="text-xs text-gray-400 mt-1">Test your knowledge</p>
                    </div>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">

                {/* Course Progress Section */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center">
                            <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                            Course Progress
                        </h3>
                    </div>

                    {dashboardData?.courseProgress?.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-gray-500 italic mb-4">No courses started yet.</p>
                            <a
                                href="/courses"
                                className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                Browse Catalog
                            </a>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {dashboardData?.courseProgress?.map((course) => (
                                <div key={course.id}>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="font-medium text-gray-700 flex items-center">
                                            {course.title}
                                            {course.percentage === 100 && (
                                                <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-bold">
                                                    Completed
                                                </span>
                                            )}
                                        </span>
                                        <span className={`text-sm font-semibold ${course.percentage === 100 ? 'text-green-600' : 'text-gray-500'}`}>{course.percentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className={`h-2.5 rounded-full transition-all duration-500 ease-out ${course.percentage === 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                                            style={{ width: `${course.percentage}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1 text-right">{course.completed} / {course.total} lessons</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quiz Results Section */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center">
                            <Trophy className="h-5 w-5 mr-2 text-purple-600" />
                            Recent Quiz Results
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 border-b border-gray-100">Course</th>
                                    <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 border-b border-gray-100">Date</th>
                                    <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 border-b border-gray-100 text-right">Score</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-gray-700">
                                {dashboardData?.recentQuizzes?.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="py-4 text-center text-gray-500 italic">No quizzes taken yet.</td>
                                    </tr>
                                ) : (
                                    dashboardData?.recentQuizzes?.map((quiz, index) => (
                                        <tr key={index} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                            <td className="py-3 pr-2 font-medium">{quiz.courseTitle}</td>
                                            <td className="py-3 pr-2 text-gray-500">
                                                <div className="flex items-center">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {new Date(quiz.date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="py-3 text-right font-bold text-purple-600">{quiz.score}%</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Recommended For You Section */}
            {recommendedCourses.length > 0 && (
                <div className="mt-12 bg-indigo-50 rounded-xl shadow-sm border border-indigo-100 p-6">
                    <div className="flex items-center justify-between mb-6 relative">
                        <h3 className="text-2xl font-bold text-indigo-900 flex items-center">
                            <Sparkles className="h-6 w-6 mr-2 text-yellow-500" />
                            Recommended for You
                        </h3>
                    </div>

                    {/* Horizontal Scrolling Container */}
                    <div className="flex overflow-x-auto pb-6 gap-6 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {/* 
                            Inline style for hide-scrollbar fallback. 
                            If you have tailwind plugin for it, you can remove the inline styles.
                        */}
                        <style>{`
                            .hide-scrollbar::-webkit-scrollbar {
                                display: none;
                            }
                        `}</style>
                        {recommendedCourses.map((item, index) => (
                            <div key={item.course._id || index} className="snap-start shrink-0 w-80 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col group relative">

                                {/* Tooltip "Why this course?" */}
                                <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg max-w-[200px] pointer-events-none">
                                        <span className="font-bold block mb-0.5 text-indigo-300">Why this course?</span>
                                        {item.reason}
                                    </div>
                                </div>
                                <div className="absolute top-2 left-2 z-0 opacity-100 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none">
                                    <div className="bg-indigo-600/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded shadow-sm">
                                        Hover to see why
                                    </div>
                                </div>

                                <div className="h-40 bg-gray-200 relative overflow-hidden">
                                    {item.course.thumbnail ? (
                                        <img
                                            src={item.course.thumbnail}
                                            alt={item.course.title}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-300">
                                            <BookOpen size={48} />
                                        </div>
                                    )}
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <h4 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">{item.course.title}</h4>
                                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{item.course.description}</p>
                                    <Link
                                        to={`/courses/${item.course._id}`}
                                        className="mt-auto w-full flex items-center justify-center bg-indigo-50 text-indigo-700 font-semibold py-2 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100"
                                    >
                                        View Course <ChevronRight size={16} className="ml-1" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Added Course Catalog inline */}
            <div className="mt-12 rounded-xl shadow-sm bg-white border border-gray-100 overflow-hidden">
                <CourseList hideBackButton={true} />
            </div>

        </div>
    );
};

export default StudentDashboard;
