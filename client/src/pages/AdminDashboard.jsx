import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, GraduationCap, BookOpen, Clock } from 'lucide-react';
import TeacherApprovalTable from '../components/TeacherApprovalTable';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        pendingApprovals: 0,
        totalTeachers: 0,
        totalStudents: 0,
        activeCourses: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/admin/analytics', {
                headers: { 'x-auth-token': token }
            });
            setStats(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching analytics', err);
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-l-transparent" style={{ borderLeftColor: color }}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm uppercase tracking-wider font-semibold">{title}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
                </div>
                <div className={`p-3 rounded-full ${bgColor}`}>
                    <Icon size={24} style={{ color }} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Admin Overview</h1>
                    <p className="text-gray-600 mt-2">Welcome back, Admin. Here's what's happening on the platform.</p>
                </header>

                {/* Analytics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <StatCard
                        title="Pending Approvals"
                        value={stats.pendingApprovals}
                        icon={Clock}
                        color="#F59E0B" // Amber-500
                        bgColor="bg-amber-100"
                    />
                    <StatCard
                        title="Total Teachers"
                        value={stats.totalTeachers}
                        icon={GraduationCap}
                        color="#4F46E5" // Indigo-600
                        bgColor="bg-indigo-100"
                    />
                    <StatCard
                        title="Total Students"
                        value={stats.totalStudents}
                        icon={Users}
                        color="#10B981" // Emerald-500
                        bgColor="bg-emerald-100"
                    />
                    <StatCard
                        title="Active Courses"
                        value={stats.activeCourses}
                        icon={BookOpen}
                        color="#EC4899" // Pink-500
                        bgColor="bg-pink-100"
                    />
                </div>

                {/* Teacher Approval Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Teacher Approval Management</h2>
                        <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded shadow-sm">
                            {stats.pendingApprovals} Request{stats.pendingApprovals !== 1 && 's'} Pending
                        </span>
                    </div>
                    <TeacherApprovalTable />
                </section>
            </div>
        </div>
    );
};

export default AdminDashboard;
