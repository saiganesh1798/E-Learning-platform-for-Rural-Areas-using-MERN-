import { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { PlusCircle, Trash2, Clock } from 'lucide-react';

const AddLesson = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        url: '',
        type: 'video',
        interactiveQuizzes: []
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };

            let finalUrl = formData.url.trim();

            // Extract src if user pasted an iframe embed code
            const iframeMatch = finalUrl.match(/src=(["'])(.*?)\1/);
            if (iframeMatch) {
                finalUrl = iframeMatch[2];
            }

            if (finalUrl && !/^https?:\/\//i.test(finalUrl)) {
                finalUrl = 'https://' + finalUrl;
            }

            // Format timestamps to numbers
            const payload = {
                ...formData,
                url: finalUrl,
                interactiveQuizzes: formData.interactiveQuizzes.map(q => ({
                    ...q,
                    timestamp: Number(q.timestamp),
                    correctOptionIndex: Number(q.correctOptionIndex)
                }))
            };

            await axios.post(`http://127.0.0.1:5000/api/courses/${courseId}/lessons`, payload, config);
            navigate(`/courses/${courseId}`);
        } catch (err) {
            console.error('Add lesson error:', err.response?.data || err.message);
            alert(`Failed to add lesson: ${err.response?.data?.msg || err.message}`);
            setLoading(false);
        }
    };

    const handleAddQuiz = () => {
        setFormData({
            ...formData,
            interactiveQuizzes: [
                ...formData.interactiveQuizzes,
                { timestamp: 0, question: '', options: ['', ''], correctOptionIndex: 0, explanation: '' }
            ]
        });
    };

    const handleQuizChange = (index, field, value) => {
        const newQuizzes = [...formData.interactiveQuizzes];
        newQuizzes[index][field] = value;
        setFormData({ ...formData, interactiveQuizzes: newQuizzes });
    };

    const handleOptionChange = (quizIndex, optionIndex, value) => {
        const newQuizzes = [...formData.interactiveQuizzes];
        newQuizzes[quizIndex].options[optionIndex] = value;
        setFormData({ ...formData, interactiveQuizzes: newQuizzes });
    };

    const handleAddOption = (quizIndex) => {
        const newQuizzes = [...formData.interactiveQuizzes];
        if (newQuizzes[quizIndex].options.length < 4) {
            newQuizzes[quizIndex].options.push('');
            setFormData({ ...formData, interactiveQuizzes: newQuizzes });
        }
    };

    const handleRemoveOption = (quizIndex, optionIndex) => {
        const newQuizzes = [...formData.interactiveQuizzes];
        if (newQuizzes[quizIndex].options.length > 2) {
            newQuizzes[quizIndex].options.splice(optionIndex, 1);
            // reset correct index if it goes out of bounds
            if (newQuizzes[quizIndex].correctOptionIndex >= newQuizzes[quizIndex].options.length) {
                newQuizzes[quizIndex].correctOptionIndex = 0;
            }
            setFormData({ ...formData, interactiveQuizzes: newQuizzes });
        }
    }

    const handleRemoveQuiz = (index) => {
        const newQuizzes = formData.interactiveQuizzes.filter((_, i) => i !== index);
        setFormData({ ...formData, interactiveQuizzes: newQuizzes });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-3xl bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Lesson</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-gray-700 font-bold mb-2">Lesson Title</label>
                            <input
                                type="text"
                                className="w-full border p-2 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-bold mb-2">Content Type</label>
                            <select
                                className="w-full border p-2 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value, interactiveQuizzes: [] })}
                            >
                                <option value="video">Video</option>
                                <option value="document">Document (PDF)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 font-bold mb-2">Video/Content URL</label>
                            <input
                                type="text"
                                className="w-full border p-2 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="https://youtube.com/..."
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Interactive Quizzes Section - Only for Videos */}
                    {formData.type === 'video' && (
                        <div className="my-8 border-t border-b border-gray-100 py-6">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Interactive Video Quizzes (Optional)</h3>
                                    <p className="text-sm text-gray-500">Add questions that will pause the video and test the student's knowledge.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddQuiz}
                                    className="flex items-center text-sm bg-indigo-50 text-indigo-700 px-3 py-2 rounded font-medium hover:bg-indigo-100 transition-colors"
                                >
                                    <PlusCircle size={16} className="mr-1" /> Add Quiz Checkpoint
                                </button>
                            </div>

                            <div className="space-y-6">
                                {formData.interactiveQuizzes.map((quiz, qIndex) => (
                                    <div key={qIndex} className="bg-gray-50 border border-gray-200 p-4 rounded-lg relative">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveQuiz(qIndex)}
                                            className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition"
                                        >
                                            <Trash2 size={18} />
                                        </button>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                            <div className="md:col-span-1 border-r border-gray-200 pr-4">
                                                <label className="block text-gray-700 text-sm font-bold mb-1 flex items-center">
                                                    <Clock size={14} className="mr-1 text-gray-500" /> Timestamp (sec)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full border p-2 rounded text-sm text-center font-mono"
                                                    value={quiz.timestamp}
                                                    onChange={(e) => handleQuizChange(qIndex, 'timestamp', e.target.value)}
                                                    required
                                                />
                                                <p className="text-[10px] text-gray-500 mt-1 leading-tight">When the video reaches this second, it will pause.</p>
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="block text-gray-700 text-sm font-bold mb-1">Question</label>
                                                <input
                                                    type="text"
                                                    className="w-full border p-2 rounded text-sm"
                                                    placeholder="e.g., What does this code do?"
                                                    value={quiz.question}
                                                    onChange={(e) => handleQuizChange(qIndex, 'question', e.target.value)}
                                                    required
                                                />

                                                <div className="mt-3">
                                                    <label className="block text-gray-700 text-sm font-bold mb-1">Answers</label>
                                                    {quiz.options.map((opt, oIndex) => (
                                                        <div key={oIndex} className="flex flex-wrap sm:flex-nowrap items-center mb-2 gap-2">
                                                            <input
                                                                type="radio"
                                                                name={`correct-${qIndex}`}
                                                                checked={quiz.correctOptionIndex === oIndex}
                                                                onChange={() => handleQuizChange(qIndex, 'correctOptionIndex', oIndex)}
                                                                className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            <input
                                                                type="text"
                                                                className="flex-1 border p-1.5 rounded text-sm"
                                                                placeholder={`Option ${oIndex + 1}`}
                                                                value={opt}
                                                                onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                                                required
                                                            />
                                                            {quiz.options.length > 2 && (
                                                                <button type="button" onClick={() => handleRemoveOption(qIndex, oIndex)} className="text-red-400 hover:text-red-600 p-1">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {quiz.options.length < 4 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddOption(qIndex)}
                                                            className="text-xs text-indigo-600 font-medium hover:underline flex items-center mt-1"
                                                        >
                                                            <PlusCircle size={12} className="mr-1" /> Add Option
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="mt-3">
                                                    <label className="block text-gray-700 text-sm font-bold mb-1">Explanation (Optional)</label>
                                                    <textarea
                                                        className="w-full border p-2 rounded text-sm"
                                                        placeholder="Explain why the answer is correct..."
                                                        rows="2"
                                                        value={quiz.explanation}
                                                        onChange={(e) => handleQuizChange(qIndex, 'explanation', e.target.value)}
                                                    ></textarea>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {formData.interactiveQuizzes.length === 0 && (
                                    <div className="text-center py-6 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                                        <p className="text-gray-500 text-sm italic">No interactive quizzes added. The video will play uninterrupted.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => navigate(`/courses/${courseId}`)}
                            className="mr-3 px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-indigo-700 transition ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Saving...' : 'Publish Lesson'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddLesson;
