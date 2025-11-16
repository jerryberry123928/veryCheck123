import React, { useState } from 'react';
import { Users, Plus, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import Notification from '../shared/Notification';
import AIChat from '../features/AIChat';

const ClubMemberDashboard = () => {
    const { user } = useAuth();
    const [showCreateItem, setShowCreateItem] = useState(false);
    const [notification, setNotification] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        condition: 'good',
        purchaseCost: '',
    });

    const handleCreateItem = async (e) => {
        e.preventDefault();

        // Validate that user has a club assigned
        if (!user.club) {
            setNotification({
                type: 'error',
                message: 'You are not assigned to any club. Contact admin.'
            });
            return;
        }

        try {
            // Send item data with user's club
            const itemData = {
                name: formData.name,
                description: formData.description,
                category: formData.category,
                condition: formData.condition,
                purchaseCost: formData.purchaseCost,
                club: user.club, // Use club from logged-in user
            };

            await api.createItem(itemData);
            setNotification({ type: 'success', message: 'Item created successfully!' });
            setShowCreateItem(false);
            setFormData({
                name: '',
                description: '',
                category: '',
                condition: 'good',
                purchaseCost: ''
            });
        } catch (err) {
            setNotification({ type: 'error', message: err.message });
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
                            <Users className="w-6 h-6 text-indigo-600" />
                            Club Member Dashboard
                        </h2>
                        <p className="text-gray-600 mt-1">Manage your club's inventory</p>
                        {user.club && (
                            <p className="text-sm text-indigo-600 mt-1">
                                Club ID: {user.club}
                            </p>
                        )}
                        {!user.club && (
                            <p className="text-sm text-red-600 mt-1">
                                ⚠️ No club assigned. Contact admin.
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => setShowCreateItem(!showCreateItem)}
                        disabled={!user.club}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-4 h-4" />
                        Add Item
                    </button>
                </div>
            </div>

            {showCreateItem && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">Create New Item</h3>
                    <form onSubmit={handleCreateItem} className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Item Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g., Basketball"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category
                            </label>
                            <input
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g., Sports Equipment"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                rows="3"
                                placeholder="Describe the item..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Condition *
                            </label>
                            <select
                                name="condition"
                                value={formData.condition}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="new">New</option>
                                <option value="good">Good</option>
                                <option value="fair">Fair</option>
                                <option value="damaged">Damaged</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Purchase Cost (₹)
                            </label>
                            <input
                                type="number"
                                name="purchaseCost"
                                value={formData.purchaseCost}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="0"
                                min="0"
                                step="0.01"
                            />
                        </div>

                        <div className="md:col-span-2 flex gap-3">
                            <button
                                type="submit"
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                            >
                                Create Item
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCreateItem(false)}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                        Quick Stats
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">Total Items</span>
                            <span className="font-semibold text-gray-900">--</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">Available</span>
                            <span className="font-semibold text-green-600">--</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">Rented Out</span>
                            <span className="font-semibold text-blue-600">--</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">In Repair</span>
                            <span className="font-semibold text-orange-600">--</span>
                        </div>
                    </div>
                </div>

                <AIChat />
            </div>
        </div>
    );
};

export default ClubMemberDashboard;