import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import api from '../../services/api';

const AIChat = () => {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        const userMessage = { role: 'user', content: query };
        setMessages([...messages, userMessage]);
        setQuery('');
        setLoading(true);

        try {
            const response = await api.aiQuery(query);
            setMessages((prev) => [...prev, { role: 'assistant', content: response.answer }]);
        } catch (err) {
            setMessages((prev) => [...prev, { role: 'error', content: err.message }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[600px] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <h2 className="font-semibold text-gray-900">AI Assistant</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-8">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Ask me anything about inventory, items, or rentals!</p>
                        <p className="text-sm mt-2">Try: "Show me all available items" or "Who has overdue rentals?"</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white'
                                    : msg.role === 'error'
                                        ? 'bg-red-50 text-red-700 border border-red-200'
                                        : 'bg-gray-100 text-gray-900'
                                }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg px-4 py-2 text-gray-600">Thinking...</div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask about inventory..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AIChat;