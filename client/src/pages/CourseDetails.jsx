import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QuizList from '../components/QuizList';

const CourseDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [completedLessonIds, setCompletedLessonIds] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/courses/${id}`);
                setCourse(res.data);

                // Fetch progress if user is logged in
                const token = localStorage.getItem('token');
                if (token) {
                    const config = { headers: { 'x-auth-token': token } };
                    const dashboardRes = await axios.get('http://localhost:5000/api/users/dashboard', config);
                    const currentCourseProgress = dashboardRes.data.courseProgress.find(p => p.id === id);
                    if (currentCourseProgress && currentCourseProgress.completedLessonIds) {
                        setCompletedLessonIds(currentCourseProgress.completedLessonIds);
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching course', err);
                setLoading(false);
            }
        };
        fetchCourse();
    }, [id]);

    const handleEnroll = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            await axios.post(`http://localhost:5000/api/courses/enroll/${id}`);
            // Update local state to reflect enrollment immediately
            setCourse(prev => ({
                ...prev,
                enrolledStudents: [...prev.enrolledStudents, user.id]
            }));

            // Show alert slightly after UI updates to avoid blocking
            setTimeout(() => alert('Enrolled successfully!'), 100);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.msg || 'Enrollment failed');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!course) return <div>Course not found</div>;

    const isEnrolled = course.enrolledStudents.includes(user?.id) || user?.role === 'admin';
    const isTeacher = user?.id === course.teacher?._id;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto mb-6">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-white px-4 py-2 rounded-md shadow-sm border border-gray-200 transition-colors"
                >
                    &larr; Back to Dashboard
                </button>
            </div>
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
                {course.thumbnail && (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-64 object-cover" />
                )}
                <div className="p-8">
                    <h1 className="text-3xl font-bold mb-4 text-gray-800">{course.title}</h1>
                    <div className="flex items-center text-sm text-gray-500 mb-6">
                        <span className="mr-4">Category: {course.category}</span>
                        <span>Instructor: {course.teacher?.name}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-8">{course.description}</p>

                    <div className="flex gap-4 mb-8">
                        {!isEnrolled && !isTeacher && user?.role === 'student' && (
                            <button
                                onClick={handleEnroll}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-semibold"
                            >
                                Enroll Now {course.price > 0 ? `($${course.price})` : '(Free)'}
                            </button>
                        )}
                        {isTeacher && (
                            <button
                                onClick={() => navigate(`/courses/${id}/add-lesson`)}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-semibold"
                            >
                                Add Lesson
                            </button>
                        )}
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">Course Content</h2>
                        {course.lessons && course.lessons.length > 0 ? (
                            <ul className="space-y-3">
                                {course.lessons.map((lesson) => (
                                    <li key={lesson._id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center border border-gray-200">
                                        <div className="flex items-center">
                                            <span className={`mr-3 p-2 rounded-full ${lesson.type === 'video' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {lesson.type === 'video' ? '📹' : '📄'}
                                            </span>
                                            <span className="font-medium text-gray-700">{lesson.title}</span>
                                        </div>
                                        {(isEnrolled || isTeacher) && (
                                            <button
                                                onClick={() => navigate(`/courses/${id}/lessons/${lesson._id}`)}
                                                className={`font-semibold text-sm px-3 py-1 rounded transition-colors ${completedLessonIds.includes(lesson._id)
                                                    ? 'text-green-600 border border-green-200 bg-green-50 hover:bg-green-100'
                                                    : 'text-indigo-600 hover:text-indigo-800'
                                                    }`}
                                            >
                                                {isTeacher ? 'Preview' : (completedLessonIds.includes(lesson._id) ? '✓ Completed' : 'Start')}
                                            </button>
                                        )}
                                        {!isEnrolled && !isTeacher && (
                                            <span className="text-gray-400 text-sm">Enroll to view</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 italic">No lessons added yet.</p>
                        )}
                    </div>

                    <QuizList courseId={id} isTeacher={isTeacher} />
                </div>
            </div>
        </div>
    );
};

export default CourseDetails;
