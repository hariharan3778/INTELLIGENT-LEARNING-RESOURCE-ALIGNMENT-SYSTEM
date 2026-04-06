import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import StudentHeader from './StudentHeader';
import AITutor from './AITutor';


const StudentLayout = () => {
    const { theme } = useTheme();
    // Lifting search state so Header can control it while Outlet consumes it if needed (optional via context, but we keep local for now)
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('All Departments');

    return (
        <div className={`min-h-screen font-sans flex transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0b0f19] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0b0f19] to-black text-white' : 'bg-[#f8fafc] text-slate-800'}`}>
            {/* SLIM SIDEBAR */}
            <aside className={`w-20 border-r flex flex-col items-center py-6 hidden md:flex sticky top-0 h-screen transition-colors ${theme === 'dark' ? 'bg-[#0a0d14] border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-10 shadow-lg shadow-blue-600/30">
                    L
                </div>

                <nav className="flex flex-col space-y-6 flex-1 w-full items-center">
                    <NavLink to="/student-dashboard" end className={({ isActive }) => `p-3 rounded-xl transition-colors ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : (theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-blue-600')}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                    </NavLink>
                    <NavLink to="/courses" className={({ isActive }) => `p-3 rounded-xl transition-colors ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : (theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-blue-600')}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    </NavLink>
                    <NavLink to="/saved" className={({ isActive }) => `p-3 rounded-xl transition-colors ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : (theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-blue-600')}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                    </NavLink>
                    <NavLink to="/schedule" className={({ isActive }) => `p-3 rounded-xl transition-colors ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : (theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-blue-600')}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </NavLink>
                    <NavLink to="/analytics" className={({ isActive }) => `p-3 rounded-xl transition-colors ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : (theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-blue-600')}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                    </NavLink>
                    <NavLink to="/settings" className={({ isActive }) => `p-3 rounded-xl transition-colors ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : (theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-blue-600')} mt-auto`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    </NavLink>
                </nav>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto">
                {/* GLOBAL STUDENT HEADER INJECTED HERE */}
                <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen flex flex-col">
                    <StudentHeader
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        selectedDepartment={selectedDepartment}
                        setSelectedDepartment={setSelectedDepartment}
                    />

                    {/* Render specific route children (Dashboard, Saved, Settings via Outlet) with prop context if needed */}
                    <Outlet context={{ searchTerm, selectedDepartment }} />
                </div>
            </main>
            {/* AI Tutor Floating Widget */}
            <AITutor />
        </div>
    );
};

export default StudentLayout;
