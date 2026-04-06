import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

const StudentHeader = ({ searchTerm, setSearchTerm, selectedDepartment, setSelectedDepartment }) => {
    const { theme, toggleTheme } = useTheme();

    const [userName, setUserName] = useState('Student');
    const [userPic, setUserPic] = useState('https://ui-avatars.com/api/?name=Student&background=random');

    const [notifications, setNotifications] = useState([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        const storedName = localStorage.getItem('userName');
        const storedPic = localStorage.getItem('userPic');
        if (storedName) setUserName(storedName);
        if (storedPic) setUserPic(storedPic);

        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('userToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get('http://localhost:5000/api/dashboard-data/notifications', config);
            setNotifications(res.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleNotificationClick = async (id) => {
        try {
            const token = localStorage.getItem('userToken');
            await axios.put(`http://localhost:5000/api/dashboard-data/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Error marking notification read:', error);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    return (
        <header className={`flex justify-between items-center mb-8 border-b pb-4 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="flex space-x-4 w-full max-w-2xl">
                <div className="relative flex-1 max-w-md">
                    <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input
                        type="text"
                        placeholder="Search courses, instructors, topics..."
                        value={searchTerm || ''}
                        onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${theme === 'dark' ? 'border-gray-800 bg-[#131825] text-white' : 'border-gray-300 bg-white text-slate-800 shadow-sm'}`}
                    />
                </div>
                <div className="relative">
                    <select
                        value={selectedDepartment || 'All Departments'}
                        onChange={(e) => setSelectedDepartment && setSelectedDepartment(e.target.value)}
                        className={`w-48 appearance-none pl-4 pr-10 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer font-medium text-sm ${theme === 'dark' ? 'border-gray-800 bg-[#131825] text-white' : 'border-gray-300 bg-white text-slate-800 shadow-sm'}`}
                    >
                        <option value="All Departments">All Departments</option>
                        {['CSE', 'IT', 'CSBS', 'AI & DS'].map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-6">
                {/* Theme Toggle */}
                <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-white/10 text-yellow-400 hover:bg-white/20' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                    {theme === 'dark' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                    )}
                </button>

                {/* Notification Bell with Dropdown */}
                <div className="relative">
                    <div
                        className={`p-2 border rounded-full cursor-pointer transition-colors flex items-center justify-center h-10 w-10 ${theme === 'dark' ? 'bg-[#131825] border-gray-800 hover:bg-gray-800' : 'bg-white border-gray-300 hover:bg-gray-100 shadow-sm'}`}
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                    >
                        <svg className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg shadow-red-500/30">
                                {unreadCount}
                            </span>
                        )}
                    </div>

                    {/* Notification Dropdown */}
                    {isNotifOpen && (
                        <div className="absolute right-0 mt-3 w-80 bg-[#131825] border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                            <div className="p-4 border-b border-gray-800 bg-[#1a2035] flex justify-between items-center">
                                <h3 className="font-bold text-white">Notifications</h3>
                                <span className="text-xs text-blue-400 cursor-pointer hover:underline" onClick={() => setIsNotifOpen(false)}>Close</span>
                            </div>
                            <div className="max-h-80 overflow-y-auto divide-y divide-gray-800">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 text-sm">No notifications</div>
                                ) : (
                                    notifications.map(notif => (
                                        <div
                                            key={notif._id}
                                            onClick={() => handleNotificationClick(notif._id)}
                                            className={`p-4 cursor-pointer hover:bg-[#1a2035] transition-colors flex space-x-3 ${!notif.isRead ? 'bg-[#1a2035]/40' : ''}`}
                                        >
                                            <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!notif.isRead ? 'bg-red-500' : 'bg-transparent'}`}></div>
                                            <div>
                                                <p className={`text-sm ${!notif.isRead ? 'text-white font-semibold' : 'text-gray-400'}`}>{notif.message}</p>
                                                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{notif.type} • {new Date(notif.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Profile & Logout */}
                <div className="flex items-center space-x-2">
                    <div className={`flex items-center space-x-3 border px-3 py-1.5 rounded-full cursor-pointer transition-colors ${theme === 'dark' ? 'bg-[#131825] border-gray-800 hover:bg-gray-800' : 'bg-white border-gray-300 hover:bg-gray-50 shadow-sm'}`}>
                        <img src={userPic} alt="Profile" className={`w-8 h-8 rounded-full border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`} />
                        <div className="hidden md:block pr-2">
                            <p className={`text-sm font-bold leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{userName}</p>
                            <p className={`text-[10px] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Premium Student</p>
                        </div>
                    </div>

                    <button 
                        onClick={handleLogout}
                        title="Logout"
                        className={`p-2 rounded-full border transition-colors shadow-sm ${theme === 'dark' ? 'bg-[#131825] border-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400' : 'bg-white border-gray-300 hover:bg-red-50 text-gray-500 hover:text-red-500'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default StudentHeader;
