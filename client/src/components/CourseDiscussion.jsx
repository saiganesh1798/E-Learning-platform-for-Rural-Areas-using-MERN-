import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, Send, User, Clock, ChevronDown, ChevronUp, Reply } from 'lucide-react';

const CourseDiscussion = ({ courseId, isEnrolled, isTeacher }) => {
    const [discussions, setDiscussions] = useState([]);
    const [newThreadTitle, setNewThreadTitle] = useState('');
    const [newThreadContent, setNewThreadContent] = useState('');
    const [replyContent, setReplyContent] = useState('');
    const [activeReplyId, setActiveReplyId] = useState(null); // ID of thread being replied to
    const [expandedThreads, setExpandedThreads] = useState({}); // { threadId: boolean }
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchDiscussions = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = token ? { headers: { 'x-auth-token': token } } : {};
            const res = await axios.get(`http://127.0.0.1:5000/api/courses/${courseId}/discussions`, config);
            setDiscussions(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching discussions', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDiscussions();
        // eslint-disable-next-line
    }, [courseId]);

    const handleCreateThread = async (e) => {
        e.preventDefault();
        if (!newThreadTitle.trim() || !newThreadContent.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            const res = await axios.post(
                `http://127.0.0.1:5000/api/courses/${courseId}/discussions`,
                { title: newThreadTitle, content: newThreadContent },
                config
            );

            setDiscussions([res.data, ...discussions]);
            setNewThreadTitle('');
            setNewThreadContent('');
            setIsCreating(false);
        } catch (err) {
            console.error('Error creating discussion', err);
            alert('Failed to post discussion.');
        }
    };

    const handleReply = async (e, discussionId) => {
        e.preventDefault();
        if (!replyContent.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            const res = await axios.post(
                `http://127.0.0.1:5000/api/courses/${courseId}/discussions/${discussionId}/reply`,
                { content: replyContent },
                config
            );

            // Update the specific discussion in state
            setDiscussions(discussions.map(d => d._id === discussionId ? res.data : d));
            setReplyContent('');
            setActiveReplyId(null);

            // Make sure the thread is expanded to see the reply
            setExpandedThreads(prev => ({ ...prev, [discussionId]: true }));
        } catch (err) {
            console.error('Error replying', err);
            alert('Failed to post reply.');
        }
    };

    const toggleThread = (id) => {
        setExpandedThreads(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (loading) return <div className="animate-pulse flex h-32 bg-gray-100 rounded-xl items-center justify-center text-gray-400">Loading Discussions...</div>;

    const canParticipate = isEnrolled || isTeacher;

    return (
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-50 to-white px-8 py-6 border-b border-indigo-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center">
                    <div className="bg-indigo-100 p-3 rounded-full mr-4">
                        <MessageSquare className="text-indigo-600 h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Course Q&A</h2>
                        <p className="text-sm text-gray-500">Ask questions and learn from the community</p>
                    </div>
                </div>
                {canParticipate && !isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        Ask a Question
                    </button>
                )}
            </div>

            {/* Create Thread Form */}
            {isCreating && canParticipate && (
                <div className="p-8 bg-indigo-50/50 border-b border-indigo-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Start a new discussion</h3>
                    <form onSubmit={handleCreateThread}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                                type="text"
                                value={newThreadTitle}
                                onChange={(e) => setNewThreadTitle(e.target.value)}
                                placeholder="e.g. How does the event loop work?"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                            <textarea
                                value={newThreadContent}
                                onChange={(e) => setNewThreadContent(e.target.value)}
                                placeholder="Provide more context..."
                                rows="4"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                                required
                            ></textarea>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm flex items-center"
                            >
                                <Send size={16} className="mr-2" /> Post Question
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Discussion List */}
            <div className="p-4 sm:p-8">
                {discussions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium mb-1">No discussions yet</h3>
                        <p className="text-sm">Be the first to start a conversation!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {discussions.map(discussion => (
                            <div key={discussion._id} className="border border-gray-200 rounded-xl hover:border-indigo-200 transition-colors bg-white overflow-hidden shadow-sm">
                                {/* Thread Header */}
                                <div
                                    className="p-5 cursor-pointer hover:bg-gray-50 transition-colors flex justify-between items-start"
                                    onClick={() => toggleThread(discussion._id)}
                                >
                                    <div className="flex-1 pr-4">
                                        <h4 className="text-lg font-bold text-gray-900 mb-2">{discussion.title}</h4>
                                        <div className="flex flex-wrap items-center text-sm text-gray-500 gap-y-2">
                                            <span className="flex items-center mr-4">
                                                <User size={14} className="mr-1" />
                                                <span className={`font-medium ${discussion.user.role === 'teacher' || discussion.user.role === 'admin' ? 'text-indigo-600' : 'text-gray-700'}`}>
                                                    {discussion.user.name}
                                                    {(discussion.user.role === 'teacher' || discussion.user.role === 'admin') && ' (Instructor)'}
                                                </span>
                                            </span>
                                            <span className="flex items-center mr-4">
                                                <Clock size={14} className="mr-1" />
                                                {new Date(discussion.createdAt).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded text-xs">
                                                <MessageSquare size={12} className="mr-1" />
                                                {discussion.replies.length} {discussion.replies.length === 1 ? 'Reply' : 'Replies'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-100 p-2 rounded-full text-gray-500">
                                        {expandedThreads[discussion._id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>

                                {/* Thread Content & Replies */}
                                {expandedThreads[discussion._id] && (
                                    <div className="bg-gray-50 border-t border-gray-100 p-5">
                                        {/* Original Post */}
                                        <div className="mb-6 pb-6 border-b border-gray-200 text-gray-700 whitespace-pre-wrap leading-relaxed">
                                            {discussion.content}
                                        </div>

                                        {/* Replies */}
                                        <div className="space-y-4 pl-4 sm:pl-8 border-l-2 border-indigo-100 mb-6">
                                            {discussion.replies.map(reply => (
                                                <div key={reply._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className={`text-sm font-semibold flex items-center ${reply.user.role === 'teacher' || reply.user.role === 'admin' ? 'text-indigo-600' : 'text-gray-800'}`}>
                                                            {reply.user.name}
                                                            {(reply.user.role === 'teacher' || reply.user.role === 'admin') && (
                                                                <span className="ml-2 bg-indigo-100 text-indigo-800 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">Instructor</span>
                                                            )}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(reply.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{reply.content}</p>
                                                </div>
                                            ))}
                                            {discussion.replies.length === 0 && (
                                                <p className="text-sm text-gray-500 italic">No replies yet.</p>
                                            )}
                                        </div>

                                        {/* Reply Form */}
                                        {canParticipate ? (
                                            activeReplyId === discussion._id ? (
                                                <form onSubmit={(e) => handleReply(e, discussion._id)} className="mt-4">
                                                    <textarea
                                                        value={replyContent}
                                                        onChange={(e) => setReplyContent(e.target.value)}
                                                        placeholder="Write your reply..."
                                                        rows="3"
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-3 text-sm"
                                                        required
                                                    ></textarea>
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => { setActiveReplyId(null); setReplyContent(''); }}
                                                            className="text-xs px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded font-medium"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            className="text-xs px-4 py-1.5 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700"
                                                        >
                                                            Post Reply
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <button
                                                    onClick={() => setActiveReplyId(discussion._id)}
                                                    className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 px-4 py-2 rounded-md transition-colors"
                                                >
                                                    <Reply size={16} className="mr-2" /> Reply to thread
                                                </button>
                                            )
                                        ) : (
                                            <p className="text-xs text-gray-500 italic">Enroll in the course to participate in discussions.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseDiscussion;
