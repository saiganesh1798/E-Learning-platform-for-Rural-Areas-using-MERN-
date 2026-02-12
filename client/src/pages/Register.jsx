import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'student',
        phone: '', village: '', educationLevel: '', // Student
        qualification: '', subjectExpertise: '', teachingExperience: '', idProof: '', reasonForJoining: '' // Teacher 
    });
    const { register } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await register(formData);
        if (res.success) {
            if (res.pending) {
                alert('Registration Successful! Your account is PENDING APPROVAL. Please wait for Admin validation.');
                navigate('/login');
            } else {
                navigate('/dashboard');
            }
        } else {
            setError(res.error);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 py-10">
            <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-md">
                <h2 className="mb-6 text-center text-3xl font-bold text-gray-800">Create Account</h2>
                {error && <p className="mb-4 text-center text-sm text-red-500 bg-red-100 p-2 rounded">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Full Name</label>
                            <input name="name" type="text" onChange={handleChange} required className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email Address</label>
                            <input name="email" type="email" onChange={handleChange} required className="input-field" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input name="password" type="password" onChange={handleChange} required className="input-field" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select name="role" value={formData.role} onChange={handleChange} className="input-field">
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                        </select>
                    </div>

                    {/* Student Specific Fields */}
                    {formData.role === 'student' && (
                        <div className="bg-blue-50 p-4 rounded-lg space-y-3 border border-blue-100">
                            <h3 className="font-semibold text-blue-800">Student Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-gray-700">Phone Number</label>
                                    <input name="phone" type="text" onChange={handleChange} required className="input-field" placeholder="Mobile Number" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700">Village / Location</label>
                                    <input name="village" type="text" onChange={handleChange} required className="input-field" placeholder="Village Name" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm text-gray-700">Education Level</label>
                                    <select name="educationLevel" onChange={handleChange} className="input-field">
                                        <option value="">Select Level</option>
                                        <option value="Primary">Primary School</option>
                                        <option value="Secondary">Secondary School</option>
                                        <option value="Higher Secondary">Higher Secondary</option>
                                        <option value="Graduate">Graduate</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Teacher Specific Fields */}
                    {formData.role === 'teacher' && (
                        <div className="bg-indigo-50 p-4 rounded-lg space-y-3 border border-indigo-100">
                            <h3 className="font-semibold text-indigo-800">Teacher Application</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-gray-700">Qualification</label>
                                    <input name="qualification" type="text" onChange={handleChange} required className="input-field" placeholder="e.g. B.Ed, MSc" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700">Years of Experience</label>
                                    <input name="teachingExperience" type="number" onChange={handleChange} required className="input-field" placeholder="0" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700">Subject Expertise</label>
                                    <input name="subjectExpertise" type="text" onChange={handleChange} required className="input-field" placeholder="Math, Science, etc." />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700">ID Proof URL</label>
                                    <input name="idProof" type="text" onChange={handleChange} required className="input-field" placeholder="Link to ID Doc" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm text-gray-700">Reason for Joining</label>
                                    <textarea name="reasonForJoining" onChange={handleChange} rows="2" className="input-field" placeholder="Why do you want to teach here?"></textarea>
                                </div>
                            </div>
                            <p className="text-xs text-indigo-600 mt-2">* Your account will be pending approval by Admin.</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full rounded-md bg-indigo-600 px-4 py-3 text-white hover:bg-indigo-700 focus:outline-none font-bold text-lg mt-4"
                    >
                        {formData.role === 'teacher' ? 'Submit Application' : 'Register Now'}
                    </button>
                    <p className="mt-4 text-center text-sm text-gray-600">
                        Already have an account? <Link to="/login" className="text-indigo-600 hover:text-indigo-500">Login</Link>
                    </p>
                </form>
            </div>

            {/* Quick Tailwind CSS injection for input-field reuse */}
            <style>{`
                .input-field {
                    margin-top: 0.25rem;
                    display: block;
                    width: 100%;
                    border-radius: 0.375rem;
                    border: 1px solid #d1d5db;
                    padding: 0.5rem;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                }
                .input-field:focus {
                    border-color: #6366f1;
                    outline: 2px solid transparent;
                    outline-offset: 2px;
                    --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
                    --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color);
                    box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
                    --tw-ring-opacity: 1;
                    --tw-ring-color: rgb(99 102 241 / var(--tw-ring-opacity));
                }
            `}</style>
        </div>
    );
};

export default Register;
