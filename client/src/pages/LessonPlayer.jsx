import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, PlayCircle, FileText, ChevronRight, ChevronLeft, Menu, MessageCircle, X, Send, Loader, Home } from 'lucide-react';

const LessonPlayer = () => {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [completedLessons, setCompletedLessons] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop
    const [showCelebration, setShowCelebration] = useState(false);

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
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

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!currentMessage.trim()) return;

        const userMsg = { role: 'user', content: currentMessage };
        setChatMessages(prev => [...prev, userMsg]);
        setCurrentMessage('');
        setIsChatLoading(true);

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            const res = await axios.post('http://localhost:5000/api/assistant/chat', {
                courseId,
                lessonId,
                message: userMsg.content
            }, config);

            const assistMsg = { role: 'assistant', content: res.data.reply };
            setChatMessages(prev => [...prev, assistMsg]);
        } catch (err) {
            console.error('Chat error', err);
            const errorMsg = { role: 'assistant', content: 'Oops, something went wrong. Please try again later.' };
            setChatMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsChatLoading(false);
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
        <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
            {/* Top Navigation Bar / Sticky Header */}
            <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm z-40 shrink-0">
                {/* Breadcrumbs */}
                <div className="flex items-center text-sm text-gray-600 overflow-hidden whitespace-nowrap">
                    <Link to="/dashboard" className="hover:text-indigo-600 flex items-center gap-1 font-medium">
                        <Home size={16} className="mb-0.5" /> Home
                    </Link>
                    <ChevronRight size={16} className="mx-2 text-gray-400 shrink-0" />
                    <Link to={`/courses/${courseId}`} className="hover:text-indigo-600 truncate max-w-[120px] sm:max-w-[200px] font-medium">
                        {course.title}
                    </Link>
                    <ChevronRight size={16} className="mx-2 text-gray-400 shrink-0" />
                    <span className="text-gray-900 font-semibold truncate max-w-[150px] sm:max-w-[250px]">
                        {lesson.title}
                    </span>
                </div>
                {/* Home / Back to Dashboard Button */}
                <Link to="/dashboard" className="hidden sm:flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap">
                    Back to Dashboard
                </Link>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar (Desktop: Static, Mobile: Toggle) */}
                <div className={`absolute md:static inset-y-0 left-0 bg-white w-80 shadow-lg transform transition-transform duration-300 z-30 flex flex-col h-full
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                    <div className="p-4 border-b flex justify-between items-center bg-indigo-600 text-white shrink-0">
                        <h2 className="font-bold text-lg truncate">Course Content</h2>
                        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="overflow-y-auto flex-1 pb-20">
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
                                                <div className="mr-3 text-gray-400 shrink-0">
                                                    {isCompleted ? <CheckCircle size={20} className="text-green-500" /> : (
                                                        l.type === 'video' ? <PlayCircle size={20} /> : <FileText size={20} />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className={`text-sm font-medium truncate ${isActive ? 'text-indigo-700' : 'text-gray-700'}`}>
                                                        {idx + 1}. {l.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1 capitalize">{l.type}</p>
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
                <div className="flex-1 flex flex-col relative overflow-y-auto w-full">
                    {/* Mobile Header Toggle */}
                    <div className="md:hidden bg-white p-4 shadow-sm flex items-center shrink-0">
                        <button onClick={() => setIsSidebarOpen(true)} className="mr-4 text-gray-600">
                            <Menu size={24} />
                        </button>
                        <span className="font-bold text-gray-800 truncate">{lesson.title}</span>
                    </div>

                    {/* Back Link */}
                    <div className="p-4 md:p-6 pb-0 shrink-0">
                        <Link to={`/courses/${courseId}`} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                            &larr; Back to Course Overview
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

                {/* AI Assistant Floating Button & Panel */}
                <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
                    {isChatOpen && (
                        <div className="bg-white w-80 sm:w-96 rounded-2xl shadow-2xl mb-4 border border-indigo-100 flex flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right">
                            {/* Header */}
                            <div className="bg-indigo-600 text-white p-4 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold flex items-center">
                                        <MessageCircle size={18} className="mr-2" />
                                        RuralEdu Tutor
                                    </h3>
                                    <p className="text-indigo-200 text-xs mt-1">Ask questions about this lesson</p>
                                </div>
                                <button onClick={() => setIsChatOpen(false)} className="text-white hover:text-indigo-200 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Messages Area */}
                            <div className="h-80 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
                                {chatMessages.length === 0 ? (
                                    <div className="text-center text-gray-500 my-auto">
                                        <MessageCircle size={32} className="mx-auto text-gray-300 mb-2" />
                                        <p className="text-sm">Hi! I'm your AI tutor. What would you like to know about "{lesson.title}"?</p>
                                    </div>
                                ) : (
                                    chatMessages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>
                                                {/* Process basic markdown-like lists for readability */}
                                                {msg.content.split('\n').map((line, i) => (
                                                    <p key={i} className={line.startsWith('-') || line.startsWith('*') ? 'ml-2' : ''}>{line}</p>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                                {isChatLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                                            <Loader className="animate-spin text-indigo-600" size={16} />
                                            <span className="text-xs text-gray-500">Thinking...</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-3 bg-white border-t border-gray-100 pb-4">
                                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={currentMessage}
                                        onChange={(e) => setCurrentMessage(e.target.value)}
                                        placeholder="Ask a question..."
                                        className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow"
                                        disabled={isChatLoading}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!currentMessage.trim() || isChatLoading}
                                        className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Send size={18} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Toggle Button */}
                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className="bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:bg-indigo-700 hover:scale-105 transition-all flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-indigo-300"
                    >
                        {isChatOpen ? <X size={24} /> : <MessageCircle size={24} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LessonPlayer;

