import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Flame, BookOpen, Trophy, Clock, AlertCircle, Sparkles, ChevronRight, Award, Download, TrendingUp, Route, Medal } from 'lucide-react';
import { Link } from 'react-router-dom';
import CourseList from './CourseList';
import { generateCertificate } from '../utils/CertificateGenerator';

const StudentDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [allCourses, setAllCourses] = useState([]);
    const [snippets, setSnippets] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
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

                const [dashboardRes, coursesRes, snippetsRes, streakRes, leaderboardRes] = await Promise.all([
                    axios.get('http://127.0.0.1:5000/api/users/dashboard', config),
                    axios.get('http://127.0.0.1:5000/api/courses'),
                    axios.get('http://127.0.0.1:5000/api/snippets/my-snippets', config),
                    axios.post('http://127.0.0.1:5000/api/users/update-streak', {}, config),
                    axios.get('http://127.0.0.1:5000/api/users/leaderboard', config)
                ]);

                setDashboardData({
                    ...dashboardRes.data,
                    streaks: streakRes.data
                });
                setAllCourses(coursesRes.data);
                setSnippets(snippetsRes.data);
                setLeaderboard(leaderboardRes.data);
                setLoading(false);
            } catch (err) {
                console.error('Fetch error:', err);
                const errorMsg = err.response?.data?.msg || err.message || 'Failed to load dashboard data.';
                setError(errorMsg + ' (Check backend console for logs)');
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

    // --- Smart Recommendations & Pathways Logic ---
    const getCareerPathways = () => {
        if (!dashboardData || !allCourses.length) return [];

        const activeCourseIds = dashboardData.courseProgress?.map(cp => cp.id) || [];
        const completedCourseIds = dashboardData.courseProgress?.filter(cp => cp.percentage === 100).map(cp => cp.id) || [];
        let availableCourses = allCourses.filter(course => !activeCourseIds.includes(course._id));

        const pathways = [];

        // 1. Data Scientist Track: Completed Python
        const hasFinishedPython = completedCourseIds.some(id => allCourses.find(c => c._id === id)?.title.toLowerCase().includes('python'));
        if (hasFinishedPython) {
            const dataCourses = availableCourses.filter(c => c.title.toLowerCase().includes('data') || c.category.toLowerCase().includes('data'));
            if (dataCourses.length > 0) {
                pathways.push({
                    goal: 'Data Scientist',
                    description: 'Since you mastered Python, step into the world of Data Analytics.',
                    courses: dataCourses.slice(0, 3) // recommend up to 3
                });
                // Remove from available so they don't appear in other tracks
                const idsToRemove = dataCourses.slice(0, 3).map(c => c._id);
                availableCourses = availableCourses.filter(c => !idsToRemove.includes(c._id));
            }
        }

        // 2. Software Engineer Track: Mid-way Data Structures (e.g. 1% to 99%)
        const inProgressDS = dashboardData.courseProgress?.some(cp => {
            const courseTitle = allCourses.find(c => c._id === cp.id)?.title.toLowerCase() || '';
            return courseTitle.includes('data structure') && cp.percentage > 0 && cp.percentage < 100;
        });

        if (inProgressDS) {
            const algoOrSystemCourses = availableCourses.filter(c =>
                c.title.toLowerCase().includes('algorithm') || c.title.toLowerCase().includes('system design')
            );
            if (algoOrSystemCourses.length > 0) {
                pathways.push({
                    goal: 'Software Engineer',
                    description: 'Build robust applications by mastering algorithms and architecture next.',
                    courses: algoOrSystemCourses.slice(0, 3)
                });
                const idsToRemove = algoOrSystemCourses.slice(0, 3).map(c => c._id);
                availableCourses = availableCourses.filter(c => !idsToRemove.includes(c._id));
            }
        }

        // 3. Fallback General Track (If no specific logic triggered, but we want to show a pathway)
        if (pathways.length === 0 && availableCourses.length > 0) {
            pathways.push({
                goal: 'Lifelong Learner',
                description: 'Explore these popular courses highly rated by other students.',
                courses: availableCourses.slice(0, 3)
            });
        }

        return pathways;
    };

    const careerPathways = getCareerPathways();
    const trendingCourseKeywords = ['data analytics', 'system design', 'machine learning', 'ai', 'react', 'full stack']; // Mock list of trending topics
    const isTrending = (title) => trendingCourseKeywords.some(keyword => title.toLowerCase().includes(keyword));
    const completedCourses = dashboardData?.courseProgress?.filter(course => course.percentage === 100) || [];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 font-sans transition-colors">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">My Learning Dashboard</h1>

            {/* Grid Layout - Responsive for Mobile/Rural */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Streak Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-orange-100 dark:border-gray-700 flex items-center space-x-4 transform transition-all hover:scale-105 duration-200">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-full">
                        <Flame className="h-8 w-8 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Daily Streak</p>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{dashboardData?.streaks?.currentStreak || 0} Days</h2>
                        <p className="text-xs text-gray-400 mt-1">Longest: {dashboardData?.streaks?.longestStreak || 0} days</p>
                    </div>
                </div>

                {/* Course Completion Summary Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-blue-100 dark:border-gray-700 flex items-center space-x-4 transition-colors">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full">
                        <BookOpen className="h-8 w-8 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Active Courses</p>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{dashboardData?.courseProgress?.length || 0}</h2>
                        <p className="text-xs text-gray-400 mt-1">Keep learning!</p>
                    </div>
                </div>

                {/* Total Quizzes Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-purple-100 dark:border-gray-700 flex items-center space-x-4 transition-colors">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-full">
                        <Trophy className="h-8 w-8 text-purple-500" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Quizzes Taken</p>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{dashboardData?.recentQuizzes?.length || 0}</h2>
                        <p className="text-xs text-gray-400 mt-1">Test your knowledge</p>
                    </div>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">

                {/* Course Progress Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-colors">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                            <BookOpen className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
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
                                        <span className="font-medium text-gray-700 dark:text-gray-200 flex items-center">
                                            {course.title}
                                            {course.percentage === 100 && (
                                                <span className="ml-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs px-2 py-0.5 rounded-full font-bold">
                                                    Completed
                                                </span>
                                            )}
                                        </span>
                                        <span className={`text-sm font-semibold ${course.percentage === 100 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>{course.percentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                        <div
                                            className={`h-2.5 rounded-full transition-all duration-500 ease-out ${course.percentage === 100 ? 'bg-green-500' : 'bg-blue-600 dark:bg-blue-500'}`}
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
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-colors">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                            <Trophy className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                            Recent Quiz Results
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 border-b border-gray-100 dark:border-gray-700">Course</th>
                                    <th className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 border-b border-gray-100 dark:border-gray-700">Date</th>
                                    <th className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 border-b border-gray-100 dark:border-gray-700 text-right">Score</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-gray-700 dark:text-gray-300">
                                {dashboardData?.recentQuizzes?.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="py-4 text-center text-gray-500 italic">No quizzes taken yet.</td>
                                    </tr>
                                ) : (
                                    dashboardData?.recentQuizzes?.map((quiz, index) => (
                                        <tr key={index} className="border-b border-gray-50 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="py-3 pr-2 font-medium">{quiz.courseTitle}</td>
                                            <td className="py-3 pr-2 text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {new Date(quiz.date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="py-3 text-right font-bold text-purple-600 dark:text-purple-400">{quiz.score}%</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Gamification: Leaderboard Section */}
            {leaderboard.length > 0 && (
                <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-yellow-100 dark:border-gray-700 transition-colors">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                            <Medal className="h-6 w-6 mr-2 text-yellow-500" />
                            Global Leaderboard
                        </h3>
                        <span className="text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400 px-3 py-1 rounded-full font-bold">Top Students</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {leaderboard.map((student, index) => {
                            const isCurrentUser = dashboardData?.userName === student.name;
                            return (
                                <div
                                    key={student.id}
                                    className={`flex items-center p-4 rounded-xl border ${isCurrentUser ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800' : 'bg-gray-50 border-gray-100 dark:bg-gray-700/50 dark:border-gray-600'} transition-colors relative overflow-hidden`}
                                >
                                    {isCurrentUser && (
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-500 to-transparent opacity-20"></div>
                                    )}
                                    <div className="flex-shrink-0 w-10 text-center font-bold text-gray-400 dark:text-gray-500 text-xl">
                                        #{index + 1}
                                    </div>
                                    <div className="ml-2 flex-1">
                                        <h4 className={`font-bold ${isCurrentUser ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                            {student.name} {isCurrentUser && <span className="text-xs font-normal text-indigo-500 ml-1">(You)</span>}
                                        </h4>
                                        <div className="flex text-xs text-gray-500 dark:text-gray-400 mt-1 gap-3">
                                            <span className="flex items-center"><BookOpen size={12} className="mr-1" /> {student.lessonsCompleted}</span>
                                            <span className="flex items-center"><Flame size={12} className="mr-1 text-orange-400" /> {student.currentStreak}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-xl font-black text-gray-800 dark:text-white">{student.score}</span>
                                        <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest">PTS</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Saved Code Snippets Section */}
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-colors">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                        <Sparkles className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400" />
                        Saved Code Snippets
                    </h3>
                </div>

                {snippets.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500 italic">No code snippets saved yet. Use the Practice IDE in your courses to save code!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {snippets.map(snippet => (
                            <div key={snippet._id} className="bg-slate-900 border border-slate-700 rounded-lg p-4 flex flex-col hover:shadow-lg transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="text-white font-semibold truncate flex-1 pr-2">{snippet.title}</h4>
                                    <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 uppercase tracking-wider font-mono">
                                        {snippet.language}
                                    </span>
                                </div>
                                <div className="bg-black/50 p-3 rounded overflow-hidden flex-1 relative group">
                                    <pre className="text-emerald-400 font-mono text-xs whitespace-pre-wrap line-clamp-4">
                                        {snippet.code}
                                    </pre>
                                </div>
                                <div className="mt-3 flex justify-between items-center text-xs text-slate-500">
                                    <span>{new Date(snippet.createdAt).toLocaleDateString()}</span>
                                    {snippet.courseId && <Link to={`/courses/${snippet.courseId}`} className="text-indigo-400 hover:text-indigo-300 hover:underline">View Course</Link>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Achievements Gallery Section */}
            {completedCourses.length > 0 && (
                <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                            <Award className="h-6 w-6 mr-2 text-yellow-500" />
                            Achievements Gallery
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {completedCourses.map(course => (
                            <div key={course.id} className="bg-gradient-to-br from-indigo-50 to-white dark:from-gray-700 dark:to-gray-800 border border-indigo-100 dark:border-gray-600 rounded-xl p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
                                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <Award className="h-10 w-10 text-yellow-600 dark:text-yellow-500" />
                                </div>
                                <h4 className="font-bold text-gray-800 dark:text-white text-lg mb-1 line-clamp-2">{course.title}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 flex-1">
                                    Completed: {new Date(course.completedAt || Date.now()).toLocaleDateString()}
                                </p>
                                <button
                                    onClick={() => generateCertificate(dashboardData.userName, course.title, course.completedAt)}
                                    className="w-full flex items-center justify-center bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
                                >
                                    <Download size={16} className="mr-2" />
                                    Download Certificate
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Smart Recommendations: Career Pathways Section */}
            {careerPathways.length > 0 && (
                <div className="mt-12">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                            <Route className="h-6 w-6 mr-2 text-indigo-500" />
                            Smart Recommendations & Pathways
                        </h3>
                    </div>

                    <div className="space-y-8">
                        {careerPathways.map((pathway, trackIdx) => (
                            <div key={trackIdx} className="bg-indigo-50 dark:bg-gray-800 rounded-xl shadow-sm border border-indigo-100 dark:border-gray-700 overflow-hidden transition-colors flex flex-col">
                                {/* Pathway Header */}
                                <div className="bg-indigo-600 dark:bg-indigo-900/60 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <div className="text-indigo-200 text-sm font-semibold uppercase tracking-wider mb-1 flex items-center">
                                            <Sparkles size={16} className="mr-2" />
                                            Career Track
                                        </div>
                                        <h4 className="text-2xl font-bold text-white mb-2">Goal: {pathway.goal}</h4>
                                        <p className="text-indigo-100 text-sm max-w-2xl">{pathway.description}</p>
                                    </div>
                                    <div className="shrink-0 bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/20">
                                        <div className="text-white text-sm font-medium">Included Courses</div>
                                        <div className="text-2xl font-bold text-white text-center mt-1">{pathway.courses.length}</div>
                                    </div>
                                </div>

                                {/* Pathway Courses List */}
                                <div className="p-6">
                                    <div className="flex overflow-x-auto pb-6 gap-6 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                        <style>{`
                                            .hide-scrollbar::-webkit-scrollbar {
                                                display: none;
                                            }
                                        `}</style>

                                        {pathway.courses.map((course) => {
                                            const trending = isTrending(course.title);
                                            return (
                                                <div key={course._id} className="snap-start shrink-0 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow flex flex-col group relative">

                                                    {/* Trending Badge */}
                                                    {trending && (
                                                        <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center shadow-lg">
                                                            <TrendingUp size={14} className="mr-1" />
                                                            TRENDING 2026
                                                        </div>
                                                    )}

                                                    <div className="h-40 bg-gray-200 dark:bg-gray-800 relative overflow-hidden">
                                                        {course.thumbnail ? (
                                                            <img
                                                                src={course.thumbnail}
                                                                alt={course.title}
                                                                className="w-full h-full object-cover"
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-300 dark:text-indigo-500">
                                                                <BookOpen size={48} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="p-5 flex-1 flex flex-col">
                                                        <h5 className="text-lg font-bold text-gray-800 dark:text-white mb-2 line-clamp-2">{course.title}</h5>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-1">{course.description}</p>
                                                        <Link
                                                            to={`/courses/${course._id}`}
                                                            className="mt-auto w-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 font-semibold py-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors border border-indigo-100 dark:border-indigo-900/20"
                                                        >
                                                            Start Course <ChevronRight size={16} className="ml-1" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Added Course Catalog inline */}
            <div className="mt-12 rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                <CourseList hideBackButton={true} />
            </div>

        </div>
    );
};

export default StudentDashboard;
