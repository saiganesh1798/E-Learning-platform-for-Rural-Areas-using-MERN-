import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Flame, BookOpen, Trophy, Clock, AlertCircle } from 'lucide-react';

const StudentDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
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

                const res = await axios.get('http://localhost:5000/api/users/dashboard', config);
                setDashboardData(res.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to load dashboard data.');
                setLoading(false);
            }
        };

        fetchDashboardData();
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

                {/* Course Completion Summary Card (Optional Summary) */}
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

                {/* Total Quizzes Card (Optional Summary) */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-purple-100 flex items-center space-x-4">
                    <div className="bg-purple-100 p-4 rounded-full">
                        <Trophy className="h-8 w-8 text-purple-500" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Quizzes Taken</p>
                        <h2 className="text-3xl font-bold text-gray-900">{dashboardData?.recentQuizzes?.length || 0}</h2>
                        {/* Note: This is just recent quizzes length, cleaner to show total but relying on recent for now */}
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
        </div>
    );
};

export default StudentDashboard;
