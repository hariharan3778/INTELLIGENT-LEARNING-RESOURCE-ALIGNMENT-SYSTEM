import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

const FacultyLayout = () => {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [userName, setUserName] = useState('Faculty');
    const [userRole, setUserRole] = useState('faculty');
    const [userPic, setUserPic] = useState('');

    useEffect(() => {
        const storedName = localStorage.getItem('userName');
        if (storedName) setUserName(storedName);
        const storedRole = localStorage.getItem('userRole');
        if (storedRole) setUserRole(storedRole);
        const storedPic = localStorage.getItem('userPic');
        if (storedPic) setUserPic(storedPic);

        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('userToken');
            const res = await axios.get('http://localhost:5000/api/dashboard-data/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('userToken');
            await axios.put(`http://localhost:5000/api/dashboard-data/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n =>
                n._id === id ? { ...n, isRead: true } : n
            ));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleLogout = () => {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userName');
        localStorage.removeItem('userPic');
        navigate('/login');
    };

    return (
        <div className={`min-h-screen font-sans flex flex-col transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050811] text-white' : 'bg-[#f8fafc] text-gray-900'}`}>
            {/* TOP NAVBAR */}
            <header className={`border-b px-6 py-4 flex justify-between items-center z-10 relative transition-colors duration-500 ${theme === 'dark' ? 'bg-white/5 border-white/10 shadow-lg' : 'bg-white border-gray-100 shadow-sm'}`}>
                <div className="flex items-center space-x-3">
                    {/* Green Book Logo */}
                    <div className="w-10 h-10 bg-[#4ade80] rounded-xl flex items-center justify-center shadow-sm">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    </div>
                    <div>
                        <h1 className={`text-[17px] font-bold tracking-tight leading-tight ${theme === 'dark' ? 'text-white' : 'text-[#0f172a]'}`}>EduManage</h1>
                        <p className={`text-[11px] font-medium tracking-wide ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Faculty Portal</p>
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

                    {/* Bell Icon & Dropdown */}
                    <div className="relative">
                        <div
                            className={`relative cursor-pointer p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-50 text-gray-600'}`}
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                            )}
                        </div>

                        {/* Notification Dropdown Menu */}
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="px-4 py-2 border-b border-gray-50 flex justify-between items-center">
                                    <h3 className="font-bold text-[#0f172a]">Notifications</h3>
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">{unreadCount} New</span>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="px-4 py-6 text-center text-gray-500 text-sm">No new notifications</div>
                                    ) : (
                                        notifications.map((notif) => (
                                            <div
                                                key={notif._id}
                                                onClick={() => !notif.isRead && markAsRead(notif._id)}
                                                className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notif.isRead ? 'bg-[#4ade80]' : 'bg-transparent'}`}></div>
                                                    <div>
                                                        <p className={`text-sm ${!notif.isRead ? 'font-bold text-[#0f172a]' : 'font-medium text-gray-600'}`}>
                                                            {notif.message}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {new Date(notif.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="px-4 py-2 border-t border-gray-50 text-center">
                                    <button className="text-sm font-bold text-[#4ade80] hover:text-[#22c55e] transition-colors" onClick={() => setShowNotifications(false)}>
                                        Close Menu
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile */}
                    <div className="flex items-center space-x-3 cursor-pointer group" onClick={handleLogout} title="Click to logout">
                        <div className="w-10 h-10 bg-gray-100 group-hover:bg-gray-200 transition-colors rounded-full flex items-center justify-center overflow-hidden">
                            {userPic ? (
                                <img src={userPic} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <svg className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            )}
                        </div>
                        <div className="hidden sm:block text-left">
                            <p className={`text-sm font-bold leading-tight ${theme === 'dark' ? 'text-white' : 'text-[#0f172a]'}`}>{userName}</p>
                            <p className={`text-[11px] font-medium capitalize ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{userRole === 'admin' ? 'Administrator' : 'Faculty Member'}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto p-4 md:p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default FacultyLayout;
