import React, { useState, useEffect } from 'react';
import { BarChart3, Plus, Users, Package, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import Notification from '../shared/Notification';
import AIChat from '../features/AIChat';

const AdminDashboard = () => {
    const [showCreateClub, setShowCreateClub] = useState(false);
    const [notification, setNotification] = useState(null);
    const [clubs, setClubs] = useState([]);
    const [clubData, setClubData] = useState({ name: '', description: '' });

    useEffect(() => {
        loadClubs();
    }, []);

    const loadClubs = async () => {
        try {
            const data = await api.getAllClubs();
            setClubs(data);
        } catch (err) {
            setNotification({ type: 'error', message: err.message });
        }
    };

    const handleCreateClub = async (e) => {
        e.preventDefault();
        try {
            await api.createClub(clubData);
            setNotification({ type: 'success', message: 'Club created successfully!' });
            setShowCreateClub(false);
            setClubData({ name: '', description: '' });
            loadClubs();
        } catch (err) {
            setNotification({ type: 'error', message: err.message });
        }
    };

    return (
        <div className="space-y-6">
            {notification && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <BarChart3 className="w-6 h-6 text-indigo-600" />
                            Admin Dashboard
                        </h2>
                        <p className="text-gray-600 mt-1">Full system management and analytics</p>
                    </div>
                    <button
                        onClick={() => setShowCreateClub(!showCreateClub)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create Club
                    </button>
                </div>
            </div>

            {showCreateClub && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">Create New Club</h3>
                    <form onSubmit={handleCreateClub} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Club Name</label>
                            <input
                                type="text"
                                value={clubData.name}
                                onChange={(e) => setClubData({ ...clubData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                                value={clubData.description}
                                onChange={(e) => setClubData({ ...clubData, description: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                rows="3"
                                required
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Create Club
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCreateClub(false)}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
                    <Users className="w-8 h-8 mb-3 opacity-80" />
                    <p className="text-blue-100 text-sm">Total Clubs</p>
                    <p className="text-3xl font-bold mt-1">{clubs.length}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
                    <Package className="w-8 h-8 mb-3 opacity-80" />
                    <p className="text-green-100 text-sm">Total Items</p>
                    <p className="text-3xl font-bold mt-1">--</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6">
                    <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
                    <p className="text-purple-100 text-sm">Active Rentals</p>
                    <p className="text-3xl font-bold mt-1">--</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" />
                        All Clubs
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {clubs.map((club) => (
                            <div key={club._id} className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition">
                                <h4 className="font-medium text-gray-900">{club.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{club.description}</p>
                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-xs text-gray-500">{club.items?.length || 0} items</span>
                                    <span className="text-xs text-gray-400">ID: {club._id.slice(-6)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <AIChat />
            </div>
        </div>
    );
};

export default AdminDashboard;