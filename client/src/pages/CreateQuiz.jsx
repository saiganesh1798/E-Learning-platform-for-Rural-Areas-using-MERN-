import { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const CreateQuiz = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [questions, setQuestions] = useState([
        { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 }
    ]);

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex] = value;
        setQuestions(newQuestions);
    };

    const addQuestion = () => {
        setQuestions([...questions, { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 }]);
    };

    const removeQuestion = (index) => {
        const newQuestions = questions.filter((_, i) => i !== index);
        setQuestions(newQuestions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/quizzes', {
                title,
                courseId,
                questions
            });
            alert('Quiz created successfully!');
            navigate(`/courses/${courseId}`);
        } catch (err) {
            console.error(err);
            alert('Failed to create quiz');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-3xl bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Quiz</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-gray-700 font-bold mb-2">Quiz Title</label>
                        <input
                            type="text"
                            className="w-full border p-2 rounded"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    {questions.map((q, qIndex) => (
                        <div key={qIndex} className="mb-8 p-6 bg-gray-50 rounded border">
                            <div className="flex justify-between mb-4">
                                <h4 className="font-bold text-lg">Question {qIndex + 1}</h4>
                                {questions.length > 1 && (
                                    <button type="button" onClick={() => removeQuestion(qIndex)} className="text-red-500">Remove</button>
                                )}
                            </div>
                            <input
                                type="text"
                                placeholder="Question Text"
                                className="w-full border p-2 rounded mb-4"
                                value={q.questionText}
                                onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                                required
                            />
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                {q.options.map((option, oIndex) => (
                                    <input
                                        key={oIndex}
                                        type="text"
                                        placeholder={`Option ${oIndex + 1}`}
                                        className="w-full border p-2 rounded"
                                        value={option}
                                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                        required
                                    />
                                ))}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Correct Option (1-4)</label>
                                <select
                                    className="border p-2 rounded"
                                    value={q.correctOptionIndex}
                                    onChange={(e) => handleQuestionChange(qIndex, 'correctOptionIndex', parseInt(e.target.value))}
                                >
                                    {q.options.map((_, i) => (
                                        <option key={i} value={i}>Option {i + 1}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addQuestion}
                        className="mb-6 text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                        + Add Another Question
                    </button>

                    <button
                        type="submit"
                        className="block w-full bg-indigo-600 text-white px-4 py-3 rounded hover:bg-indigo-700 font-bold"
                    >
                        Save Quiz
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateQuiz;
