import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const TakeQuiz = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({}); // { 0: 1, 1: 0 } -> questionIndex: optionIndex
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/quizzes/${quizId}`);
                setQuiz(res.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [quizId]);

    const handleOptionSelect = (qIndex, oIndex) => {
        setAnswers({ ...answers, [qIndex]: oIndex });
    };

    const handleSubmit = async () => {
        // Convert answers object to array for backend
        const answersArray = quiz.questions.map((_, i) => answers[i] ?? -1);

        try {
            const res = await axios.post(`http://localhost:5000/api/quizzes/${quizId}/submit`, { answers: answersArray });
            setResult(res.data);
        } catch (err) {
            console.error(err);
            alert('Failed to submit quiz');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!quiz) return <div>Quiz not found</div>;

    if (result) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
                <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
                    <h2 className="text-3xl font-bold mb-4 text-gray-800">Quiz Results</h2>
                    <div className="text-6xl font-bold text-indigo-600 mb-4">{Math.round((result.score / result.total) * 100)}%</div>
                    <p className="text-xl text-gray-600 mb-8">You scored {result.score} out of {result.total}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
                    >
                        Back to Course
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-3xl bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">{quiz.title}</h2>
                {quiz.questions.map((q, qIndex) => (
                    <div key={qIndex} className="mb-8 border-b pb-6 last:border-b-0">
                        <h4 className="text-lg font-semibold mb-3">{qIndex + 1}. {q.questionText}</h4>
                        <div className="space-y-2">
                            {q.options.map((option, oIndex) => (
                                <label key={oIndex} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200">
                                    <input
                                        type="radio"
                                        name={`question-${qIndex}`}
                                        value={oIndex}
                                        checked={answers[qIndex] === oIndex}
                                        onChange={() => handleOptionSelect(qIndex, oIndex)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-gray-700">{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
                <button
                    onClick={handleSubmit}
                    className="w-full bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-700 font-bold text-lg"
                    disabled={Object.keys(answers).length !== quiz.questions.length}
                >
                    Submit Quiz
                </button>
            </div>
        </div>
    );
};

export default TakeQuiz;
