import React, { useState, useEffect } from 'react';
import { Package, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import Notification from '../shared/Notification';
import AIChat from '../features/AIChat';

const StudentDashboard = () => {
    const { user } = useAuth();
    const [clubs, setClubs] = useState([]);
    const [notification, setNotification] = useState(null);

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
                <div className="flex items-center gap-3 mb-4">
                    <Package className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}!</h2>
                </div>
                <p className="text-gray-600">Browse clubs and rent items you need.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" />
                        Available Clubs
                    </h3>
                    <div className="space-y-3">
                        {clubs.map((club) => (
                            <div key={club._id} className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition">
                                <h4 className="font-medium text-gray-900">{club.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{club.description}</p>
                                <p className="text-xs text-gray-500 mt-2">{club.items?.length || 0} items available</p>
                            </div>
                        ))}
                    </div>
                </div>

                <AIChat />
            </div>
        </div>
    );
};

export default StudentDashboard;