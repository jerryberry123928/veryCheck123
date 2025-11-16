import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const Register = ({ onSwitchToLogin }) => {
    const { register } = useAuth();
    const [clubs, setClubs] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        regNo: '',
        role: 'student',
        club: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadClubs();
    }, []);

    const loadClubs = async () => {
        try {
            const data = await api.getAllClubs();
            setClubs(data);
        } catch (err) {
            console.error('Failed to load clubs:', err);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Only send club if role is club-member
            const dataToSend = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                regNo: formData.regNo,
                role: formData.role,
            };

            if (formData.role === 'club-member' && formData.club) {
                dataToSend.club = formData.club;
            }

            await register(dataToSend);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <Package className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
                    <p className="text-gray-600 mt-2">Join VeryCheck today</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
                        <input
                            type="text"
                            name="regNo"
                            value={formData.regNo}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="student">Student</option>
                            <option value="club-member">Club Member</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    {formData.role === 'club-member' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Club</label>
                            <select
                                name="club"
                                value={formData.club}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                required
                            >
                                <option value="">-- Select a Club --</option>
                                {clubs.map((club) => (
                                    <option key={club._id} value={club._id}>
                                        {club.name}
                                    </option>
                                ))}
                            </select>
                            {clubs.length === 0 && (
                                <p className="text-xs text-gray-500 mt-1">No clubs available. Contact admin.</p>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <p className="text-center text-gray-600 text-sm mt-6">
                    Already have an account?{' '}
                    <button onClick={onSwitchToLogin} className="text-indigo-600 hover:underline font-medium">
                        Sign In
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Register;