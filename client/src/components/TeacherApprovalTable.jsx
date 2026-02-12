import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, FileText } from 'lucide-react';

const TeacherApprovalTable = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/admin/users', {
                headers: { 'x-auth-token': token }
            });
            // Filter only pending teachers
            const pending = res.data.filter(user => user.role === 'teacher' && user.approvalStatus === 'pending');
            setTeachers(pending);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleApproval = async (id, status) => {
        try {
            const token = localStorage.getItem('token');
            // Optimistic UI Update
            setTeachers(teachers.filter(teacher => teacher._id !== id));

            await axios.patch(`http://localhost:5000/api/admin/approve-teacher/${id}`,
                { status },
                { headers: { 'x-auth-token': token } }
            );
        } catch (err) {
            console.error('Error updating status', err);
            fetchTeachers(); // Revert on failure
        }
    };

    if (loading) return <div className="text-gray-500 text-center py-4">Loading requests...</div>;

    if (teachers.length === 0) {
        return (
            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                <p>No pending teacher approvals.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credentials</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {teachers.map((teacher) => (
                            <tr key={teacher._id} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{teacher.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">
                                        {new Date(teacher.createdAt).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {teacher.idProof ? (
                                        <a href={teacher.idProof} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900 flex items-center">
                                            <FileText size={16} className="mr-1" /> View
                                        </a>
                                    ) : (
                                        <span className="text-gray-400 text-sm">Not Uploaded</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end space-x-2">
                                        <button
                                            onClick={() => handleApproval(teacher._id, 'approved')}
                                            className="bg-green-100 text-green-700 p-2 rounded-full hover:bg-green-200 transition-colors"
                                            title="Approve"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleApproval(teacher._id, 'rejected')}
                                            className="bg-red-100 text-red-700 p-2 rounded-full hover:bg-red-200 transition-colors"
                                            title="Reject"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeacherApprovalTable;
