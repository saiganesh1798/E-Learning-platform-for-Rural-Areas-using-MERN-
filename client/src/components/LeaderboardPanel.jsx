import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, ChevronRight, ChevronLeft, UserCircle2 } from 'lucide-react';

const LeaderboardPanel = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            const res = await axios.get('http://127.0.0.1:5000/api/users/leaderboard', config);
            setLeaderboard(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch leaderboard:', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchLeaderboard();
            const intervalId = setInterval(fetchLeaderboard, 10000); // Poll every 10 seconds
            return () => clearInterval(intervalId);
        }
    }, [isOpen]);

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed top-1/2 right-0 transform -translate-y-1/2 bg-yellow-500 text-white p-3 rounded-l-xl shadow-lg hover:bg-yellow-600 transition-all z-50 flex items-center gap-2 ${isOpen ? 'translate-x-[320px] opacity-0 pointer-events-none' : 'translate-x-0'}`}
                style={{ transitionDuration: '400ms' }}
            >
                <ChevronLeft size={24} />
                <Trophy size={24} />
            </button>

            {/* Slide-out Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-400 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="bg-yellow-500 text-white p-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <Trophy size={24} />
                        <h2 className="text-xl font-bold">Top Learners</h2>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-yellow-600 rounded-full transition-colors"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {loading ? (
                        <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                        </div>
                    ) : leaderboard.length === 0 ? (
                        <p className="text-center text-gray-500 mt-8 font-medium">No scores yet!</p>
                    ) : (
                        <ul className="space-y-3">
                            {leaderboard.map((user, index) => (
                                <li
                                    key={user.id}
                                    className={`bg-white p-4 rounded-xl shadow-sm border flex items-center gap-4 transition-transform hover:scale-[1.02] ${index === 0 ? 'border-yellow-400 shadow-yellow-100' :
                                            index === 1 ? 'border-gray-300 shadow-gray-100' :
                                                index === 2 ? 'border-amber-700 shadow-amber-50' :
                                                    'border-gray-100'
                                        }`}
                                >
                                    <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold shadow-inner ${index === 0 ? 'bg-yellow-100 text-yellow-600' :
                                            index === 1 ? 'bg-gray-100 text-gray-600' :
                                                index === 2 ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-50 text-slate-500'
                                        }`}>
                                        #{index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-800 truncate">{user.name}</p>
                                        <div className="flex items-center text-xs text-gray-500 gap-2 mt-0.5">
                                            <span>🔥 {user.currentStreak} Day Streak</span>
                                            <span>•</span>
                                            <span>Score: <strong className="text-indigo-600">{user.score}</strong></span>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
};

export default LeaderboardPanel;
