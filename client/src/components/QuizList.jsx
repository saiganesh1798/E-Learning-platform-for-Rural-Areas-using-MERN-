import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const QuizList = ({ courseId, isTeacher }) => {
    const [quizzes, setQuizzes] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const res = await axios.get(`http://127.0.0.1:5000/api/quizzes/course/${courseId}`);
                setQuizzes(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchQuizzes();
    }, [courseId]);

    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Quizzes</h2>
                {isTeacher && (
                    <button
                        onClick={() => navigate(`/courses/${courseId}/create-quiz`)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm"
                    >
                        + Create Quiz
                    </button>
                )}
            </div>

            {quizzes.length > 0 ? (
                <ul className="space-y-3">
                    {quizzes.map((quiz) => (
                        <li key={quiz._id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center border border-gray-200">
                            <div className="flex items-center">
                                <span className="mr-3 p-2 rounded-full bg-yellow-100 text-yellow-600">❓</span>
                                <span className="font-medium text-gray-700">{quiz.title}</span>
                            </div>
                            <div className="flex gap-3">
                                {isTeacher && (
                                    <button
                                        onClick={() => navigate(`/courses/${courseId}/edit-quiz/${quiz._id}`)}
                                        className="text-gray-500 hover:text-indigo-600 font-semibold text-sm transition-colors"
                                    >
                                        Edit
                                    </button>
                                )}
                                <button
                                    onClick={() => navigate(`/quizzes/${quiz._id}`)}
                                    className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-colors"
                                >
                                    {isTeacher ? 'View' : 'Take Quiz'}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500 italic">No quizzes available.</p>
            )}
        </div>
    );
};

export default QuizList;
