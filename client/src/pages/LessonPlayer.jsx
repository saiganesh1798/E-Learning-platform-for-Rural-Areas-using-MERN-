import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, PlayCircle, FileText, ChevronRight, ChevronLeft, Menu } from 'lucide-react';

const LessonPlayer = () => {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [completedLessons, setCompletedLessons] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop
    const [showCelebration, setShowCelebration] = useState(false);

    const lesson = course?.lessons?.find(l => l._id === lessonId);

    useEffect(() => {
        const fetchCourseAndProgress = async () => {
            try {
                // Fetch course details
                const courseRes = await axios.get(`http://localhost:5000/api/courses/${courseId}`);
                setCourse(courseRes.data);

                // Fetch current user progress
                const token = localStorage.getItem('token');
                if (token) {
                    const config = { headers: { 'x-auth-token': token } };
                    const dashboardRes = await axios.get('http://localhost:5000/api/users/dashboard', config);

                    const currentCourseProgress = dashboardRes.data.courseProgress.find(p => p.id === courseId);

                    if (currentCourseProgress && currentCourseProgress.completedLessonIds) {
                        setCompletedLessons(currentCourseProgress.completedLessonIds);
                    }
                }
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchCourseAndProgress();
    }, [courseId]);


    const markLessonComplete = async (currentLessonId) => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const config = { headers: { 'x-auth-token': token } };
                await axios.post('http://localhost:5000/api/users/progress', {
                    courseId,
                    lessonId: currentLessonId
                }, config);

                // Update local state for sidebar checkmarks
                if (!completedLessons.includes(currentLessonId)) {
                    setCompletedLessons([...completedLessons, currentLessonId]);
                }
            }
        } catch (err) {
            console.error('Error marking lesson complete', err);
        }
    };

    const handleNext = async () => {
        // Mark current as complete
        await markLessonComplete(lessonId);

        // Find next lesson
        const currentIndex = course.lessons.findIndex(l => l._id === lessonId);
        if (currentIndex < course.lessons.length - 1) {
            const nextLesson = course.lessons[currentIndex + 1];
            navigate(`/courses/${courseId}/lessons/${nextLesson._id}`);
        } else {
            // Finished
            setShowCelebration(true);
            setTimeout(() => navigate('/dashboard'), 3000);
        }
    };

    const handlePrev = () => {
        const currentIndex = course.lessons.findIndex(l => l._id === lessonId);
        if (currentIndex > 0) {
            const prevLesson = course.lessons[currentIndex - 1];
            navigate(`/courses/${courseId}/lessons/${prevLesson._id}`);
        }
    };

    const getEmbedUrl = (url) => {
        if (!url) return '';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
    };

    if (loading) return <div>Loading...</div>;
    if (!lesson) return <div>Lesson not found</div>;

    const embedUrl = lesson.type === 'video' ? getEmbedUrl(lesson.url) : null;
    const currentIndex = course?.lessons.findIndex(l => l._id === lessonId);
    const isLastLesson = currentIndex === course?.lessons.length - 1;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">

            {/* Sidebar (Desktop: Static, Mobile: Toggle) */}
            <div className={`fixed inset-y-0 left-0 bg-white w-80 shadow-lg transform transition-transform duration-300 z-30 
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
                <div className="p-4 border-b flex justify-between items-center bg-indigo-600 text-white">
                    <h2 className="font-bold text-lg truncate">{course.title}</h2>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden">X</button>
                </div>
                <div className="overflow-y-auto h-full pb-20">
                    <ul className="divide-y divide-gray-100">
                        {course.lessons.map((l, idx) => {
                            const isActive = l._id === lessonId;
                            const isCompleted = completedLessons.includes(l._id);

                            return (
                                <li key={l._id}>
                                    <Link
                                        to={`/courses/${courseId}/lessons/${l._id}`}
                                        className={`block p-4 hover:bg-gray-50 transition-colors ${isActive ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}
                                    >
                                        <div className="flex items-center">
                                            <div className="mr-3 text-gray-400">
                                                {isCompleted ? <CheckCircle size={20} className="text-green-500" /> : (
                                                    l.type === 'video' ? <PlayCircle size={20} /> : <FileText size={20} />
                                                )}
                                            </div>
                                            <div>
                                                <p className={`text-sm font-medium ${isActive ? 'text-indigo-700' : 'text-gray-700'}`}>
                                                    {idx + 1}. {l.title}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">{l.type}</p>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
                {/* Mobile Header Toggle */}
                <div className="md:hidden bg-white p-4 shadow flex items-center">
                    <button onClick={() => setIsSidebarOpen(true)} className="mr-4 text-gray-600">
                        <Menu />
                    </button>
                    <span className="font-bold text-gray-800 truncate">{lesson.title}</span>
                </div>

                {/* Back Link */}
                <div className="p-4 md:p-6 pb-0">
                    <Link to={`/courses/${courseId}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center">
                        &larr; Course Overview
                    </Link>
                </div>

                {/* Video Player Area */}
                <div className="flex-grow p-4 md:p-6 lg:p-8 flex flex-col items-center">
                    <div className="w-full max-w-5xl bg-black rounded-xl overflow-hidden shadow-2xl">
                        {lesson.type === 'video' ? (
                            <div className="aspect-w-16 aspect-h-9 bg-black relative">
                                {embedUrl ? (
                                    <iframe
                                        src={embedUrl}
                                        title={lesson.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="w-full h-[500px]" // Fixed height fallback, expect aspect-ratio utility to handle
                                    ></iframe>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                                        <p>Video not embeddable.</p>
                                        <a href={lesson.url} target="_blank" rel="noopener noreferrer" className="mt-4 text-indigo-400 underline">Open External Link</a>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-16 text-center bg-white min-h-[400px] flex flex-col justify-center items-center">
                                <FileText size={64} className="text-gray-300 mb-6" />
                                <h2 className="text-2xl font-bold mb-2">Reading Material</h2>
                                <p className="mb-8 text-gray-500">This lesson is a document/article.</p>
                                <a
                                    href={lesson.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                                >
                                    Open Document
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Navigation Footer */}
                    <div className="w-full max-w-5xl mt-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <button
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${currentIndex === 0
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
                                }`}
                        >
                            <ChevronLeft size={20} className="mr-1" />
                            Previous
                        </button>

                        <div className="text-center hidden sm:block">
                            <h2 className="text-lg font-bold text-gray-800">{lesson.title}</h2>
                            <p className="text-xs text-gray-500">Lesson {currentIndex + 1} of {course.lessons.length}</p>
                        </div>

                        <button
                            onClick={handleNext}
                            className="flex items-center px-6 py-2 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-transform active:scale-95"
                        >
                            {isLastLesson ? 'Finish Course' : 'Next Lesson'}
                            {!isLastLesson && <ChevronRight size={20} className="ml-1" />}
                        </button>
                    </div>
                </div>
            </div>
            {showCelebration && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm animate-fadeIn">
                    <div className="text-center">
                        <div className="text-6xl mb-6 animate-bounce">🎉 🏆 🎉</div>
                        <h2 className="text-4xl font-bold text-white mb-2">Course Completed!</h2>
                        <p className="text-xl text-indigo-200">Congratulations!</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LessonPlayer;
