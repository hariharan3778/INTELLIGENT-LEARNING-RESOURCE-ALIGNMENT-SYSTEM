import React, { useState, useEffect } from 'react';

const Settings = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    // Toggle States
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(true);
    const [publicProfile, setPublicProfile] = useState(false);

    useEffect(() => {
        // In a real app, this would be fetched from the backend user profile endpoint
        // Fallback to localStorage dummy data for this mock UI
        const storedName = localStorage.getItem('userName') || 'Student User';
        // Mocks email since localStorage doesn't store it in our current flow
        const mockEmail = storedName.toLowerCase().replace(' ', '.') + '@bannari.edu.in';

        setName(storedName);
        setEmail(mockEmail);
    }, []);

    const handleSave = (e) => {
        e.preventDefault();
        alert('Settings saved successfully!');
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* HEADER */}
            <div className="mb-8 border-b border-gray-800 pb-6">
                <h1 className="text-3xl font-extrabold text-white mb-2">Account Settings</h1>
                <p className="text-gray-400">Manage your profile information and preferences.</p>
            </div>

            <div className="bg-[#131825] rounded-2xl border border-gray-800 shadow-xl overflow-hidden p-8">
                <form onSubmit={handleSave} className="space-y-8">

                    {/* SECTION: Profile Info */}
                    <div>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            Personal Information
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">These details are synced from your Google account and cannot be changed here.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Name Field (Disabled) */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-2">Full Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={name}
                                        disabled
                                        readOnly
                                        className="w-full bg-[#1a2035]/50 border border-gray-700/50 text-gray-500 py-3 px-4 rounded-xl cursor-not-allowed font-medium"
                                    />
                                    <div className="absolute right-3 top-3.5 text-gray-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                    </div>
                                </div>
                            </div>

                            {/* Email Field (Disabled) */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-2">Email Address</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={email}
                                        disabled
                                        readOnly
                                        className="w-full bg-[#1a2035]/50 border border-gray-700/50 text-gray-500 py-3 px-4 rounded-xl cursor-not-allowed font-medium"
                                    />
                                    <div className="absolute right-3 top-3.5 text-gray-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="border-t border-gray-800"></div>

                    {/* SECTION: Preferences */}
                    <div>
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>
                            Application Preferences
                        </h3>

                        <div className="space-y-6">

                            {/* Toggle 1: Email Notifications */}
                            <div className="flex items-center justify-between p-4 bg-[#1a2035] rounded-xl border border-gray-800">
                                <div>
                                    <h4 className="text-white font-semibold mb-1">Email Notifications</h4>
                                    <p className="text-sm text-gray-500">Receive weekly summaries and important course updates.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 shadow-inner"></div>
                                </label>
                            </div>

                            {/* Toggle 2: Dark Mode */}
                            <div className="flex items-center justify-between p-4 bg-[#1a2035] rounded-xl border border-gray-800">
                                <div>
                                    <h4 className="text-white font-semibold mb-1">Dark Mode Theme</h4>
                                    <p className="text-sm text-gray-500">Use abstract dark mode visuals across all dashboards.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500 shadow-inner"></div>
                                </label>
                            </div>

                            {/* Toggle 3: Public Profile */}
                            <div className="flex items-center justify-between p-4 bg-[#1a2035] rounded-xl border border-gray-800">
                                <div>
                                    <h4 className="text-white font-semibold mb-1">Make Profile Public</h4>
                                    <p className="text-sm text-gray-500">Allow other students and faculty to view your achievements.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={publicProfile} onChange={(e) => setPublicProfile(e.target.checked)} />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
                                </label>
                            </div>

                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-6 flex justify-end">
                        <button
                            type="submit"
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all border border-blue-500"
                        >
                            Save Changes
                        </button>
                    </div>

                </form>
            </div>

        </div>
    );
};

export default Settings;
