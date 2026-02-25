import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, PlayCircle, FileText, ChevronRight, ChevronLeft, Menu, MessageCircle, X, Send, Loader, Home, Code2, Maximize, Minimize } from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import ReactPlayer from 'react-player';
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import LeaderboardPanel from '../components/LeaderboardPanel';

const LessonPlayer = () => {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [completedLessons, setCompletedLessons] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop
    const [showCelebration, setShowCelebration] = useState(false);
    const [isPracticeMode, setIsPracticeMode] = useState(false); // IDE toggle

    // Video Quiz State
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [answeredQuizzes, setAnsweredQuizzes] = useState([]);
    const [selectedOption, setSelectedOption] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [quizFeedback, setQuizFeedback] = useState(null);

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const handleFullScreen = useFullScreenHandle();
    const lesson = course?.lessons?.find(l => l._id === lessonId);

    // Reset video quiz state on lesson change
    useEffect(() => {
        setAnsweredQuizzes([]);
        setActiveQuiz(null);
        setIsPlaying(false);
    }, [lessonId]);

    useEffect(() => {
        const fetchCourseAndProgress = async () => {
            try {
                // Fetch course details
                const courseRes = await axios.get(`http://127.0.0.1:5000/api/courses/${courseId}`);
                setCourse(courseRes.data);

                // Fetch current user progress
                const token = localStorage.getItem('token');
                if (token) {
                    const config = { headers: { 'x-auth-token': token } };
                    const dashboardRes = await axios.get('http://127.0.0.1:5000/api/users/dashboard', config);

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
                await axios.post('http://127.0.0.1:5000/api/users/progress', {
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
            const res = await axios.post('http://127.0.0.1:5000/api/assistant/chat', {
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
        let finalUrl = url.trim();

        // Extract URL from iframe if needed
        if (finalUrl.includes('<iframe')) {
            const match = finalUrl.match(/src=(["'])(.*?)\1/);
            if (match) finalUrl = match[2];
        }

        // Add protocol if missing
        if (!/^https?:\/\//i.test(finalUrl)) {
            finalUrl = 'https://' + finalUrl;
        }

        // Just use URL object to safely parse out the ID for youtube
        try {
            const parsedUrl = new URL(finalUrl);
            const hostname = parsedUrl.hostname.toLowerCase();

            if (hostname.includes('youtube.com') || hostname === 'youtu.be') {
                let videoId = null;
                if (hostname === 'youtu.be') {
                    videoId = parsedUrl.pathname.slice(1);
                } else if (parsedUrl.pathname === '/watch') {
                    videoId = parsedUrl.searchParams.get('v');
                } else if (parsedUrl.pathname.startsWith('/embed/')) {
                    videoId = parsedUrl.pathname.split('/')[2];
                } else if (parsedUrl.pathname.startsWith('/shorts/')) {
                    videoId = parsedUrl.pathname.split('/')[2];
                } else if (parsedUrl.pathname.startsWith('/live/')) {
                    videoId = parsedUrl.pathname.split('/')[2];
                }

                if (videoId) {
                    // Clean id from any trailing trash just in case
                    videoId = videoId.split('?')[0].split('&')[0];
                    return `https://www.youtube.com/watch?v=${videoId}`;
                }
            }
        } catch (e) {
            console.error('URL parse error', e);
        }

        return finalUrl;
    };

    const handleProgress = (state) => {
        if (!lesson.interactiveQuizzes || lesson.interactiveQuizzes.length === 0) return;

        const currentTime = state.playedSeconds;
        const triggeredQuiz = lesson.interactiveQuizzes.find(
            q => currentTime >= q.timestamp && !answeredQuizzes.includes(q._id || q.timestamp)
        );

        if (triggeredQuiz && isPlaying) {
            setIsPlaying(false);
            setActiveQuiz(triggeredQuiz);
            setSelectedOption(null);
            setShowExplanation(false);
            setQuizFeedback(null);
        }
    };

    const handleQuizSubmit = async () => {
        const isCorrect = selectedOption === activeQuiz.correctOptionIndex;
        if (isCorrect) {
            setQuizFeedback('correct');
        } else {
            setQuizFeedback('incorrect');
        }
        setShowExplanation(true);

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            const res = await axios.post('http://127.0.0.1:5000/api/users/video-quiz-score', { isCorrect }, config);
            if (isCorrect) {
                toast.success('+3 Points! Score updated.', { icon: '🌟' });
            } else {
                toast.error('-0.5 Points.', { icon: '📉' });
            }
        } catch (err) {
            console.error('Failed to submit video quiz score:', err);
        }
    };

    const handleResumeVideo = () => {
        setAnsweredQuizzes([...answeredQuizzes, activeQuiz._id || activeQuiz.timestamp]);
        setActiveQuiz(null);
        setIsPlaying(true);
    };

    if (loading) return <div>Loading...</div>;
    if (!lesson) return <div>Lesson not found</div>;

    const embedUrl = lesson.type === 'video' ? getEmbedUrl(lesson.url) : null;
    const currentIndex = course?.lessons.findIndex(l => l._id === lessonId);
    const isLastLesson = currentIndex === course?.lessons.length - 1;

    // Check if programming-related to show IDE button (optional check, but let's assume all can for now or checking category)
    const canPractice = course?.category?.toLowerCase().includes('programming') || course?.category?.toLowerCase().includes('data') || true;

    return (
        <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
            <LeaderboardPanel />
            {/* Top Navigation Bar / Sticky Header */}
            <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm z-40 shrink-0">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm text-gray-600 overflow-hidden whitespace-nowrap">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="mr-2 text-gray-600 hover:text-indigo-600 transition-colors hidden md:block">
                        <Menu size={20} />
                    </button>
                    <Link to="/dashboard" className="hover:text-indigo-600 flex items-center gap-1 font-medium">
                        <Home size={16} className="mb-0.5" /> Home
                    </Link>
                    <ChevronRight size={16} className="text-gray-400 shrink-0" />
                    <Link to={`/courses/${courseId}`} className="hover:text-indigo-600 truncate max-w-[120px] sm:max-w-[200px] font-medium">
                        {course.title}
                    </Link>
                    <ChevronRight size={16} className="text-gray-400 shrink-0" />
                    <span className="text-gray-900 font-semibold truncate max-w-[150px] sm:max-w-[250px]">
                        {lesson.title}
                    </span>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-3">
                    {canPractice && (
                        <button
                            onClick={() => setIsPracticeMode(!isPracticeMode)}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors shadow-sm outline-none ${isPracticeMode ? 'bg-indigo-100 text-indigo-700 border border-indigo-200 hover:bg-indigo-200' : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'}`}
                        >
                            <Code2 size={16} />
                            <span className="hidden sm:inline">{isPracticeMode ? 'Close IDE' : 'Practice Now'}</span>
                        </button>
                    )}
                    <Link to="/dashboard" className="hidden sm:flex items-center px-4 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md hover:bg-indigo-100 transition-colors shadow-sm whitespace-nowrap">
                        Dashboard
                    </Link>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar (Desktop: Static/Toggle, Mobile: Absolute/Toggle) */}
                <div className={`absolute md:relative inset-y-0 left-0 bg-white shadow-lg md:shadow-none md:border-r border-gray-200 transform transition-transform duration-300 z-30 flex flex-col h-full
                    ${isSidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full w-0 hidden md:flex'} md:shrink-0`}>
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

                {/* Main Content Area (Player + Optional IDE) */}
                <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden bg-white w-full">
                    {/* Left Side: Video Player */}
                    <div className={`${isPracticeMode ? 'hidden md:flex flex-col w-1/2 border-r border-gray-200' : 'flex-1'} flex flex-col overflow-y-auto`}>
                        {/* Mobile Header Toggle */}
                        <div className="md:hidden bg-white p-4 shadow-sm flex items-center shrink-0 border-b">
                            <button onClick={() => setIsSidebarOpen(true)} className="mr-4 text-gray-600">
                                <Menu size={24} />
                            </button>
                            <span className="font-bold text-gray-800 truncate">{lesson.title}</span>
                        </div>

                        {/* Video Player Area */}
                        <div className={`flex-grow p-4 md:p-6 flex flex-col items-center ${isPracticeMode ? '' : 'lg:p-8'}`}>
                            <div className={`w-full ${isPracticeMode ? '' : 'max-w-5xl'} bg-black rounded-xl overflow-hidden shadow-xl relative`}>
                                {lesson.type === 'video' ? (
                                    <FullScreen handle={handleFullScreen} className="w-full h-full bg-black relative group flex flex-col justify-center items-center">
                                        <div className={`relative w-full ${handleFullScreen.active ? 'h-screen flex items-center justify-center' : 'aspect-w-16 aspect-h-9'}`}>
                                            <ReactPlayer
                                                url={embedUrl || lesson.url}
                                                width="100%"
                                                height={handleFullScreen.active ? '100%' : (isPracticeMode ? '300px' : '500px')}
                                                controls={!activeQuiz}
                                                playing={isPlaying}
                                                onPlay={() => setIsPlaying(true)}
                                                onPause={() => setIsPlaying(false)}
                                                onReady={() => console.log('ReactPlayer ready, url:', embedUrl)}
                                                onError={(e) => console.error('ReactPlayer error', e, embedUrl)}
                                                onProgress={handleProgress}
                                                progressInterval={500}
                                                style={handleFullScreen.active ? { height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyItems: 'center' } : {}}
                                            />

                                            {/* Custom Fullscreen Toggle Button overlaying video if not activeQuiz */}
                                            {!activeQuiz && (
                                                <button
                                                    onClick={handleFullScreen.active ? handleFullScreen.exit : handleFullScreen.enter}
                                                    className="absolute top-4 right-4 z-50 bg-black/50 text-white p-2 text-sm rounded-lg hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100 flex items-center gap-2 shadow-lg backdrop-blur-sm"
                                                    title={handleFullScreen.active ? "Exit Fullscreen" : "Enter Fullscreen"}
                                                >
                                                    {handleFullScreen.active ? <Minimize size={18} /> : <Maximize size={18} />}
                                                    <span className="hidden sm:inline font-medium">{handleFullScreen.active ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                                                </button>
                                            )}

                                            {/* Quiz Overlay Modal */}
                                            {activeQuiz && (
                                                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                                                    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl relative animate-fadeIn">
                                                        <div className="flex items-center gap-2 mb-4 text-indigo-600 font-bold">
                                                            <CheckCircle size={20} />
                                                            <span>Knowledge Checkpoint</span>
                                                        </div>
                                                        <h3 className="text-xl font-bold text-gray-800 mb-6">{activeQuiz.question}</h3>

                                                        <div className="space-y-3 mb-6">
                                                            {activeQuiz.options.map((opt, i) => (
                                                                <button
                                                                    key={i}
                                                                    onClick={() => !showExplanation && setSelectedOption(i)}
                                                                    disabled={showExplanation}
                                                                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedOption === i
                                                                        ? 'border-indigo-600 bg-indigo-50'
                                                                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                                                                        } ${showExplanation && i === activeQuiz.correctOptionIndex
                                                                            ? '!border-green-500 !bg-green-50'
                                                                            : ''
                                                                        } ${showExplanation && selectedOption === i && i !== activeQuiz.correctOptionIndex
                                                                            ? '!border-red-500 !bg-red-50'
                                                                            : ''
                                                                        }`}
                                                                >
                                                                    {opt}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        {!showExplanation ? (
                                                            <button
                                                                onClick={handleQuizSubmit}
                                                                disabled={selectedOption === null}
                                                                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
                                                            >
                                                                Check Answer
                                                            </button>
                                                        ) : (
                                                            <div className="animate-fadeIn">
                                                                <div className={`p-4 rounded-lg mb-4 flex gap-3 ${quizFeedback === 'correct' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                                    <div className="mt-0.5">
                                                                        {quizFeedback === 'correct' ? <CheckCircle size={20} /> : <X size={20} />}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold">{quizFeedback === 'correct' ? 'Correct!' : 'Incorrect. Try again next time!'}</p>
                                                                        {activeQuiz.explanation && (
                                                                            <p className="text-sm mt-1">{activeQuiz.explanation}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {quizFeedback === 'correct' && (
                                                                    <button
                                                                        onClick={handleResumeVideo}
                                                                        className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-gray-800 flex justify-center items-center gap-2"
                                                                    >
                                                                        <PlayCircle size={20} /> Resume Video
                                                                    </button>
                                                                )}
                                                                {quizFeedback === 'incorrect' && (
                                                                    <button
                                                                        onClick={() => {
                                                                            // Reset to try again
                                                                            setSelectedOption(null);
                                                                            setShowExplanation(false);
                                                                            setQuizFeedback(null);
                                                                        }}
                                                                        className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 flex justify-center items-center gap-2"
                                                                    >
                                                                        Try Again
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </FullScreen>
                                ) : (
                                    <div className={`p-8 text-center bg-white flex flex-col justify-center items-center ${isPracticeMode ? 'min-h-[300px]' : 'min-h-[400px]'}`}>
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
                            <div className={`w-full ${isPracticeMode ? '' : 'max-w-5xl'} mt-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100`}>
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
                    </div> {/* End Left Side Video Player */}

                    {/* Right Side: IDE Simulator */}
                    {isPracticeMode && (
                        <div className="flex-1 w-full md:w-1/2 h-full z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.1)]">
                            <CodeEditor courseId={courseId} courseTitle={course.title} />
                        </div>
                    )}

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
                    <div className={`fixed bottom-6 ${isPracticeMode ? 'left-6 md:left-[calc(50%-4rem)]' : 'right-6'} z-40 flex flex-col items-end`}>
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
                </div> {/* End Main Content Area */}
            </div>
        </div>
    );
};

export default LessonPlayer;

