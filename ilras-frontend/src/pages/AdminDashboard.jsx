import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const AdminDashboard = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeStudents: 0,
    newResources: 0,
    systemHealth: "100%"
  });
  const [activities, setActivities] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminName, setAdminName] = useState('Admin User');
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [newCourse, setNewCourse] = useState({ title: '', instructor: '', level: 'Beginner', category: 'Common', thumbnail: '' });

  // CRUD State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'student', password: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);

  // Messaging State
  const [inbox, setInbox] = useState([]);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const res = await axios.get('http://localhost:5000/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
      setUsersList(res.data.users || []);
    } catch (error) { console.error('Failed to fetch users'); }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const res = await axios.get('http://localhost:5000/api/admin/courses', { headers: { Authorization: `Bearer ${token}` } });
      setCoursesList(res.data.courses || []);
    } catch (error) { console.error('Failed to fetch courses'); }
  };

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem('userToken');
        const name = localStorage.getItem('userName');
        if (name) setAdminName(name);

        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [statsRes, activityRes, unreadRes] = await Promise.all([
          axios.get('http://localhost:5000/api/admin/stats', config),
          axios.get('http://localhost:5000/api/admin/activity', config),
          axios.get('http://localhost:5000/api/messages/unread/count', config).catch(() => ({ data: { count: 0 } }))
        ]);

        setStats(statsRes.data);
        setActivities(activityRes.data);
        if (unreadRes && unreadRes.data) setUnreadCount(unreadRes.data.count);
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
        if (error.response && error.response.status === 403) {
          navigate('/login'); // Kick out if not admin
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
    fetchUsers();
    fetchCourses();
  }, [navigate]);

  const fetchInbox = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const res = await axios.get('http://localhost:5000/api/messages/inbox/recent', { headers: { Authorization: `Bearer ${token}` } });
      setInbox(res.data);
    } catch (error) { console.error('Failed to fetch inbox'); }
  };

  const fetchChatWithUser = async (userId) => {
    try {
      const token = localStorage.getItem('userToken');
      const res = await axios.get(`http://localhost:5000/api/messages/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      setChatMessages(res.data.messages);
      setSelectedChatUser(res.data.otherUser);

      // Mark as read
      await axios.put(`http://localhost:5000/api/messages/mark-read/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) { console.error('Failed to fetch chat'); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChatUser) return;
    setIsSending(true);
    try {
      const token = localStorage.getItem('userToken');
      const res = await axios.post('http://localhost:5000/api/messages/send', {
        receiverId: selectedChatUser._id,
        content: messageText
      }, { headers: { Authorization: `Bearer ${token}` } });

      setChatMessages([...chatMessages, res.data.message]);
      setMessageText('');
      fetchInbox(); // Refresh sidebar
    } catch (error) { console.error('Failed to send message'); }
    finally { setIsSending(false); }
  };

  useEffect(() => {
    let intervalId;
    if (activeTab === 'queries') {
      fetchInbox();

      const pollQueries = async () => {
        try {
          const token = localStorage.getItem('userToken');

          // Poll inbox list
          const inboxRes = await axios.get('http://localhost:5000/api/messages/inbox/recent', { headers: { Authorization: `Bearer ${token}` } });
          setInbox(inboxRes.data);

          // Poll active chat if someone is selected
          if (selectedChatUser) {
            const chatRes = await axios.get(`http://localhost:5000/api/messages/${selectedChatUser._id}`, { headers: { Authorization: `Bearer ${token}` } });
            setChatMessages(chatRes.data.messages);
          }
          // Poll unread count
          const unreadRes = await axios.get('http://localhost:5000/api/messages/unread/count', { headers: { Authorization: `Bearer ${token}` } });
          setUnreadCount(unreadRes.data.count);
        } catch (err) {
          console.error("Failed to poll queries", err);
        }
      };

      intervalId = setInterval(pollQueries, 2000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTab, selectedChatUser]);

  const handleBlockUser = async (id) => {
    try {
      const token = localStorage.getItem('userToken');
      await axios.put(`http://localhost:5000/api/admin/users/${id}/block`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchUsers();
    } catch (error) { console.error('Failed to toggle block'); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = localStorage.getItem('userToken');
      await axios.delete(`http://localhost:5000/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchUsers();
    } catch (error) { console.error('Failed to delete user'); }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('userToken');
      await axios.post('http://localhost:5000/api/admin/courses', newCourse, { headers: { Authorization: `Bearer ${token}` } });
      setNewCourse({ title: '', instructor: '', level: 'Beginner', category: 'Common', thumbnail: '' });
      fetchCourses();
    } catch (error) { console.error('Failed to add course'); }
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('userToken');
      await axios.put(`http://localhost:5000/api/admin/courses/${editingCourse._id}`, editingCourse, { headers: { Authorization: `Bearer ${token}` } });
      setEditingCourse(null);
      fetchCourses();
    } catch (error) { console.error('Failed to update course'); }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('userToken');
      await axios.post('http://localhost:5000/api/admin/users', newUser, { headers: { Authorization: `Bearer ${token}` } });
      setNewUser({ name: '', email: '', role: 'student', password: '' });
      setIsAddUserModalOpen(false);
      fetchUsers();
    } catch (error) { console.error('Failed to add user'); }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('userToken');
      await axios.put(`http://localhost:5000/api/admin/users/${editingUser._id}`, editingUser, { headers: { Authorization: `Bearer ${token}` } });
      setEditingUser(null);
      fetchUsers();
    } catch (error) { console.error('Failed to update user'); }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      const token = localStorage.getItem('userToken');
      await axios.delete(`http://localhost:5000/api/admin/courses/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchCourses();
    } catch (error) { console.error('Failed to delete course'); }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 text-white ${theme === 'dark' ? 'bg-[#0b0f19] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0b0f19] to-black text-white' : 'bg-gradient-to-br from-indigo-50 via-white to-blue-50 text-slate-900'}`}>

      {/* TOP HEADER NAVIGATION */}
      <header className={`backdrop-blur-xl border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white/70 border-gray-200 shadow-sm'}`}>
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
          </div>
          <div>
            <h1 className={`font-extrabold text-xl leading-tight tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>SYSTEM ADMIN</h1>
            <p className="text-[11px] text-blue-500 font-bold tracking-widest uppercase">CONTROL PANEL</p>
          </div>
        </div>

        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative group">
            <svg className="w-5 h-5 absolute left-4 top-3 text-gray-500 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input type="text" placeholder="Search users, logs, resources..." className={`w-full pl-12 pr-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-md text-sm font-medium transition-all shadow-lg ${theme === 'dark' ? 'border-white/10 bg-[#161a2b]/80 text-white placeholder-gray-500' : 'border-gray-200 bg-white/90 text-slate-800 placeholder-gray-400'}`} />
          </div>
        </div>

        <div className="flex items-center space-x-8">

          {/* Theme Toggle */}
          <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-white/10 text-yellow-400 hover:bg-white/20' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
            )}
          </button>

          <div className="relative cursor-pointer hover:scale-110 transition-transform">
            <svg className={`w-6 h-6 transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            {unreadCount > 0 && (
              <span className={`absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 shadow-sm animate-pulse ${theme === 'dark' ? 'border-[#161a2b]' : 'border-white'}`}>
                {unreadCount}
              </span>
            )}
          </div>
          <div className={`flex items-center space-x-3 border-l pl-8 cursor-pointer group ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`} onClick={handleLogout}>
            <div className={`border rounded-full p-2.5 group-hover:scale-105 transition-transform flex items-center justify-center ${theme === 'dark' ? 'bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-gradient-to-br from-indigo-50 to-blue-50 border-blue-200'}`}>
              <svg className="w-5 h-5 text-blue-500 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            </div>
            <div>
              <p className={`text-sm font-extrabold leading-none transition-colors ${theme === 'dark' ? 'text-white group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'}`}>{adminName}</p>
              <p className="text-[10px] text-gray-500 font-bold mt-1 tracking-widest uppercase">LOGOUT</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-8 max-w-[1600px] mx-auto space-y-8">

        {/* TABS NAVIGATION */}
        <div className={`flex space-x-6 border-b mb-8 relative z-10 ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
          <button onClick={() => setActiveTab('overview')} className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'overview' ? 'text-blue-500 border-b-2 border-blue-500' : (theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')}`}>Overview</button>
          <button onClick={() => setActiveTab('users')} className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'users' ? 'text-blue-500 border-b-2 border-blue-500' : (theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')}`}>Manage Users</button>
          <button onClick={() => setActiveTab('courses')} className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'courses' ? 'text-blue-500 border-b-2 border-blue-500' : (theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')}`}>Manage Courses</button>
          <button onClick={() => setActiveTab('queries')} className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'queries' ? 'text-blue-500 border-b-2 border-blue-500' : (theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')}`}>Support Queries</button>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* PAGE TITLE */}
            <div className="mb-8 relative z-10">
              <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600 tracking-tight drop-shadow-sm">ADMIN OVERVIEW</h2>
              <p className={`text-sm font-bold tracking-widest uppercase mt-2 ${theme === 'dark' ? 'text-blue-200/50' : 'text-blue-600/70'}`}>System Monitoring and Analytics Dashboard</p>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              {/* Card 1 */}
              <div className={`rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:-translate-y-1 hover:border-blue-500/50 transition-all duration-500 ${theme === 'dark' ? 'bg-white/5 backdrop-blur-xl border border-white/10' : 'bg-white border border-gray-100'}`}>
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 transition-all ${theme === 'dark' ? 'bg-blue-500/10 group-hover:bg-blue-500/20' : 'bg-blue-100 group-hover:bg-blue-200'}`}></div>
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="p-3.5 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 text-blue-500 rounded-2xl border border-blue-500/30">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                  </div>
                  <span className="bg-green-100 text-green-600 border border-green-200 text-xs font-bold px-2.5 py-1.5 rounded-full flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg> +12.5%
                  </span>
                </div>
                <p className={`text-xs font-bold tracking-widest uppercase relative z-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>TOTAL USERS</p>
                <h3 className={`text-4xl font-black mt-1 tracking-tight relative z-10 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{isLoading ? '...' : stats.totalUsers}</h3>
              </div>

              {/* Card 2 */}
              <div className={`rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:-translate-y-1 hover:border-indigo-500/50 transition-all duration-500 ${theme === 'dark' ? 'bg-white/5 backdrop-blur-xl border border-white/10' : 'bg-white border border-gray-100'}`}>
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 transition-all ${theme === 'dark' ? 'bg-indigo-500/10 group-hover:bg-indigo-500/20' : 'bg-indigo-100 group-hover:bg-indigo-200'}`}></div>
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="p-3.5 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 text-indigo-500 rounded-2xl border border-indigo-500/30">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path></svg>
                  </div>
                  <span className="bg-green-100 text-green-600 border border-green-200 text-xs font-bold px-2.5 py-1.5 rounded-full flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg> +8.2%
                  </span>
                </div>
                <p className={`text-xs font-bold tracking-widest uppercase relative z-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>ACTIVE STUDENTS</p>
                <h3 className={`text-4xl font-black mt-1 tracking-tight relative z-10 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{isLoading ? '...' : stats.activeStudents}</h3>
              </div>

              {/* Card 3 */}
              <div className={`rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:-translate-y-1 hover:border-cyan-500/50 transition-all duration-500 ${theme === 'dark' ? 'bg-white/5 backdrop-blur-xl border border-white/10' : 'bg-white border border-gray-100'}`}>
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 transition-all ${theme === 'dark' ? 'bg-cyan-500/10 group-hover:bg-cyan-500/20' : 'bg-cyan-100 group-hover:bg-cyan-200'}`}></div>
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="p-3.5 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-500 rounded-2xl border border-cyan-500/30">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  </div>
                  <span className="bg-green-100 text-green-600 border border-green-200 text-xs font-bold px-2.5 py-1.5 rounded-full flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg> +24.3%
                  </span>
                </div>
                <p className={`text-xs font-bold tracking-widest uppercase relative z-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>NEW RESOURCES</p>
                <h3 className={`text-4xl font-black mt-1 tracking-tight relative z-10 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{isLoading ? '...' : stats.newResources}</h3>
              </div>

              {/* Card 4 */}
              <div className={`rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:-translate-y-1 hover:border-purple-500/50 transition-all duration-500 ${theme === 'dark' ? 'bg-white/5 backdrop-blur-xl border border-white/10' : 'bg-white border border-gray-100'}`}>
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 transition-all ${theme === 'dark' ? 'bg-purple-500/10 group-hover:bg-purple-500/20' : 'bg-purple-100 group-hover:bg-purple-200'}`}></div>
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="p-3.5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-500 rounded-2xl border border-purple-500/30">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  </div>
                  <span className="bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-2.5 py-1.5 rounded-full flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"></path></svg> -0.1%
                  </span>
                </div>
                <p className={`text-xs font-bold tracking-widest uppercase relative z-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>SYSTEM HEALTH</p>
                <h3 className={`text-4xl font-black mt-1 tracking-tight relative z-10 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{isLoading ? '...' : stats.systemHealth}</h3>
              </div>
            </div>

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 mt-8">
              {/* Line Chart Area */}
              <div className={`rounded-3xl p-6 shadow-xl lg:col-span-2 flex flex-col relative overflow-hidden group ${theme === 'dark' ? 'bg-white/5 backdrop-blur-xl border border-white/10' : 'bg-white border border-gray-100'}`}>
                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-10 -mt-20 ${theme === 'dark' ? 'bg-blue-500/5' : 'bg-blue-50'}`}></div>
                <h3 className={`font-extrabold text-xl tracking-tight relative z-10 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>USER GROWTH</h3>
                <p className={`text-sm mb-6 font-medium relative z-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Last 6 months trend analysis</p>

                {/* Mock Chart Canvas */}
                <div className={`flex-1 relative border-l border-b min-h-[250px] flex items-end ml-4 mb-4 z-10 ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between">
                    {[0, 1, 2, 3].map((i) => <div key={i} className={`w-full border-b border-dashed flex-1 ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'}`}></div>)}
                  </div>
                  {/* Mock SVG Line */}
                  <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none">
                    <polyline points="0,150 150,130 300,110 450,90 600,70 750,50" fill="none" stroke="#3b82f6" strokeWidth="4" className={theme === 'dark' ? "drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]" : ""} />
                    <polyline points="0,200 150,180 300,170 450,160 600,150 750,130" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="5,5" className={theme === 'dark' ? "drop-shadow-[0_0_10px_rgba(167,139,250,0.3)]" : ""} />
                    {/* Data Points */}
                    <circle cx="750" cy="50" r="5" fill={theme === 'dark' ? '#1e1b4b' : '#ffffff'} stroke="#3b82f6" strokeWidth="3" />
                    <circle cx="750" cy="130" r="5" fill={theme === 'dark' ? '#1e1b4b' : '#ffffff'} stroke="#8b5cf6" strokeWidth="3" />
                  </svg>
                </div>
                <div className={`flex justify-center space-x-8 mt-4 text-sm font-bold relative z-10 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <div className="flex items-center"><span className={`w-3 h-3 rounded-full mr-2 ${theme === 'dark' ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]' : 'bg-blue-500'}`}></span>Total Users</div>
                  <div className="flex items-center"><span className={`w-3 h-3 rounded-full mr-2 ${theme === 'dark' ? 'bg-purple-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]' : 'bg-purple-500'}`}></span>Students</div>
                </div>
              </div>

              {/* Pie Chart Area */}
              <div className={`rounded-3xl p-6 shadow-xl flex flex-col relative overflow-hidden group ${theme === 'dark' ? 'bg-white/5 backdrop-blur-xl border border-white/10' : 'bg-white border border-gray-100'}`}>
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 ${theme === 'dark' ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}></div>
                <h3 className={`font-extrabold text-xl tracking-tight relative z-10 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>ROLE DISTRIBUTION</h3>
                <p className={`text-sm mb-8 font-medium relative z-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>User roles breakdown</p>

                <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                  {/* CSS Pie Chart */}
                  <div className={`relative w-52 h-52 rounded-full ${theme === 'dark' ? 'shadow-[0_0_30px_rgba(0,0,0,0.5)]' : 'shadow-lg'}`} style={{ background: 'conic-gradient(#3b82f6 0% 77.1%, #8b5cf6 77.1% 88.9%, #06b6d4 88.9% 100%)' }}>
                    {/* Labels inside pie */}
                    <span className="absolute top-1/2 left-8 text-white text-xs font-black drop-shadow-md">77.1%</span>
                    <span className="absolute bottom-8 right-12 text-white text-xs font-black drop-shadow-md">11.1%</span>
                    <span className="absolute top-1/2 right-4 text-white text-xs font-black drop-shadow-md">11.8%</span>
                    {/* Center cutout for donut effect */}
                    <div className={`absolute inset-0 m-auto w-24 h-24 rounded-full shadow-inner flex items-center justify-center ${theme === 'dark' ? 'bg-[#0d1326]' : 'bg-white'}`}>
                      <span className={`font-bold text-sm text-center leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Total<br />Roles</span>
                    </div>
                  </div>
                </div>

                <div className={`flex justify-between border-t pt-6 mt-6 relative z-10 ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                  <div className="text-center"><div className={`w-3 h-3 rounded-full bg-blue-500 mx-auto mb-1.5 ${theme === 'dark' ? 'shadow-[0_0_8px_rgba(59,130,246,0.8)]' : ''}`}></div><span className={`text-xs font-bold tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>STUDENTS</span></div>
                  <div className="text-center"><div className={`w-3 h-3 rounded-full bg-purple-500 mx-auto mb-1.5 ${theme === 'dark' ? 'shadow-[0_0_8px_rgba(139,92,246,0.8)]' : ''}`}></div><span className={`text-xs font-bold tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>FACULTY</span></div>
                  <div className="text-center"><div className={`w-3 h-3 rounded-full bg-cyan-500 mx-auto mb-1.5 ${theme === 'dark' ? 'shadow-[0_0_8px_rgba(6,182,212,0.8)]' : ''}`}></div><span className={`text-xs font-bold tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>ADMINS</span></div>
                </div>
              </div>
            </div>

            {/* RECENT ACTIVITY SECTION */}
            <div className={`rounded-3xl overflow-hidden shadow-2xl mt-8 relative z-10 ${theme === 'dark' ? 'bg-white/5 backdrop-blur-xl border border-blue-500/20' : 'bg-white border border-gray-200'}`}>
              <div className={`px-8 py-6 flex justify-between items-center border-b ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                <div>
                  <h3 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600 text-xl tracking-tight">RECENT SYSTEM ACTIVITY</h3>
                  <p className={`text-sm font-medium mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Real-time activity monitoring across all modules</p>
                </div>
                <button className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 shadow-md ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20 border border-white/10 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50 text-slate-800'}`}>
                  View All
                </button>
              </div>

              <div className={`divide-y ${theme === 'dark' ? 'divide-white/10' : 'divide-gray-100'}`}>
                {isLoading ? (
                  <div className="p-10 text-center text-gray-400 font-bold tracking-widest uppercase">Loading system activity...</div>
                ) : activities.length === 0 ? (
                  <div className="p-10 text-center text-gray-400 font-bold tracking-widest uppercase">No recent activity</div>
                ) : (
                  activities.map((act) => (
                    <div key={act._id} className="p-6 md:p-8 flex items-start hover:bg-white/5 transition-colors group">
                      <div className={`p-4 rounded-2xl mr-6 border transition-transform group-hover:scale-110 shadow-lg ${act.type === 'user' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-blue-500/10' : act.type === 'resource' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-purple-500/10' : 'bg-green-500/10 text-green-400 border-green-500/20 shadow-green-500/10'}`}>
                        {act.type === 'user' ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                        ) : act.type === 'resource' ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        ) : (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row justify-between md:items-center">
                          <h4 className="font-bold text-white text-lg tracking-tight group-hover:text-blue-300 transition-colors">{act.title}</h4>
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1 md:mt-0">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(act.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-400 text-sm mt-2 leading-relaxed">{act.description}</p>
                        <div className="mt-4 flex items-center">
                          <span className="text-[10px] font-black text-gray-500 mr-3 uppercase tracking-widest">{act.tag}</span>
                          <span className="bg-white/10 text-gray-300 border border-white/5 text-xs font-bold px-3 py-1 rounded-full shadow-sm">{act.actor}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className={`rounded-3xl shadow-2xl overflow-hidden relative z-10 ${theme === 'dark' ? 'bg-white/5 backdrop-blur-xl border border-white/10' : 'bg-white border border-gray-200'}`}>
            <div className={`px-8 py-6 border-b flex justify-between items-center ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center space-x-4">
                <h3 className={`font-black text-xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>User Management</h3>
                <button
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-500 transition-all shadow-lg"
                >
                  + Add User
                </button>
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${theme === 'dark' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-100 text-blue-600 border-blue-200'}`}>{usersList.length} Users</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`text-[11px] uppercase tracking-widest ${theme === 'dark' ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                    <th className={`p-6 font-bold border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>Name</th>
                    <th className={`p-6 font-bold border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>Email</th>
                    <th className={`p-6 font-bold border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>Role</th>
                    <th className={`p-6 font-bold border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>Status</th>
                    <th className={`p-6 font-bold border-b text-right ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-gray-100'}`}>
                  {usersList.map((u) => (
                    <tr key={u._id} className={`transition-colors group ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                      <td className={`p-6 font-bold tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{u.name}</td>
                      <td className={`p-6 font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{u.email}</td>
                      <td className="p-6">
                        <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${u.role === 'admin' ? (theme === 'dark' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'bg-purple-100 text-purple-600 border-purple-200') : u.role === 'faculty' ? (theme === 'dark' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'bg-blue-100 text-blue-600 border-blue-200') : (theme === 'dark' ? 'bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'bg-green-100 text-green-600 border-green-200')}`}>{u.role}</span>
                      </td>
                      <td className="p-6">
                        {u.isBlocked ? <span className={`font-bold text-sm px-3 py-1.5 rounded-full border ${theme === 'dark' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-red-600 bg-red-100 border-red-200'}`}>Blocked</span> : <span className={`font-bold text-sm px-3 py-1.5 rounded-full border ${theme === 'dark' ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-green-600 bg-green-100 border-green-200'}`}>Active</span>}
                      </td>
                      <td className="p-6 text-right space-x-3">
                        {u.role !== 'admin' && (
                          <>
                            <button onClick={() => setEditingUser(u)} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${theme === 'dark' ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/30' : 'bg-blue-100 text-blue-600 hover:bg-blue-200 border-blue-200'}`}>Edit</button>
                            <button onClick={() => handleBlockUser(u._id)} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${u.isBlocked ? (theme === 'dark' ? 'bg-white/10 text-white hover:bg-white/20 border-white/10' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 border-gray-300') : (theme === 'dark' ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border-orange-500/30' : 'bg-orange-100 text-orange-600 hover:bg-orange-200 border-orange-200')}`}>
                              {u.isBlocked ? 'Unblock' : 'Block'}
                            </button>
                            <button onClick={() => handleDeleteUser(u._id)} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${theme === 'dark' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200 border-red-200'}`}>Revoke</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {usersList.length === 0 && (
                    <tr><td colSpan="5" className="p-12 text-center text-gray-400 font-bold tracking-widest uppercase">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* COURSES TAB */}
        {activeTab === 'courses' && (
          <div className="space-y-8 relative z-10">
            <div className={`rounded-3xl shadow-2xl p-8 relative overflow-hidden ${theme === 'dark' ? 'bg-white/5 backdrop-blur-xl border border-white/10' : 'bg-white border border-gray-200'}`}>
              <div className={`absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl -ml-20 -mt-20 ${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-100'}`}></div>
              <h3 className={`font-extrabold text-xl mb-6 tracking-tight relative z-10 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Add New Course</h3>
              <form onSubmit={handleAddCourse} className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <input type="text" placeholder="Course Title" required value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} className={`border p-3.5 rounded-xl font-medium transition-all shadow-inner ${theme === 'dark' ? 'bg-[#161a2b]/80 border-white/10 text-white placeholder-gray-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50' : 'bg-white border-gray-300 text-slate-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`} />
                <input type="text" placeholder="Instructor Name" required value={newCourse.instructor} onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })} className={`border p-3.5 rounded-xl font-medium transition-all shadow-inner ${theme === 'dark' ? 'bg-[#161a2b]/80 border-white/10 text-white placeholder-gray-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50' : 'bg-white border-gray-300 text-slate-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`} />
                <select value={newCourse.level} onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })} className={`border p-3.5 rounded-xl font-medium shadow-inner appearance-none cursor-pointer ${theme === 'dark' ? 'bg-[#161a2b]/80 border-white/10 text-white focus:border-blue-500/50' : 'bg-white border-gray-300 text-slate-900 focus:border-blue-500'}`}>
                  <option className={theme === 'dark' ? 'bg-[#0f172a]' : 'bg-white'}>Beginner</option>
                  <option className={theme === 'dark' ? 'bg-[#0f172a]' : 'bg-white'}>Intermediate</option>
                  <option className={theme === 'dark' ? 'bg-[#0f172a]' : 'bg-white'}>Advanced</option>
                </select>
                <select value={newCourse.category} onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })} className={`border p-3.5 rounded-xl font-medium shadow-inner appearance-none cursor-pointer ${theme === 'dark' ? 'bg-[#161a2b]/80 border-white/10 text-white focus:border-blue-500/50' : 'bg-white border-gray-300 text-slate-900 focus:border-blue-500'}`}>
                  <option className={theme === 'dark' ? 'bg-[#0f172a]' : 'bg-white'}>Common</option>
                  <option className={theme === 'dark' ? 'bg-[#0f172a]' : 'bg-white'}>CSE</option>
                  <option className={theme === 'dark' ? 'bg-[#0f172a]' : 'bg-white'}>IT</option>
                  <option className={theme === 'dark' ? 'bg-[#0f172a]' : 'bg-white'}>CSBS</option>
                  <option className={theme === 'dark' ? 'bg-[#0f172a]' : 'bg-white'}>AI & DS</option>
                </select>
                <input type="url" placeholder="Thumbnail URL (Optional)" value={newCourse.thumbnail} onChange={(e) => setNewCourse({ ...newCourse, thumbnail: e.target.value })} className={`border p-3.5 rounded-xl font-medium transition-all shadow-inner md:col-span-2 ${theme === 'dark' ? 'bg-[#161a2b]/80 border-white/10 text-white placeholder-gray-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50' : 'bg-white border-gray-300 text-slate-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`} />
                <button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl md:col-span-3 transition-all transform hover:-translate-y-1 shadow-lg shadow-blue-500/25">Add Course to System</button>
              </form>
            </div>

            <div className={`rounded-3xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-white/5 backdrop-blur-xl border border-white/10' : 'bg-white border border-gray-200'}`}>
              <div className={`px-8 py-6 border-b flex justify-between items-center ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                <h3 className={`font-extrabold tracking-tight text-xl ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Total Courses Directory</h3>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${theme === 'dark' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-purple-100 text-purple-600 border-purple-200'}`}>{coursesList.length} Courses</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
                {coursesList.map(c => (
                  <div key={c._id} className={`border rounded-2xl p-5 flex items-center space-x-5 group transition-all duration-300 hover:shadow-[0_10px_30px_-15px_rgba(59,130,246,0.5)] hover:-translate-y-1 ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-blue-500/40' : 'bg-gray-50 border-gray-200 hover:border-blue-500'}`}>
                    <div className="relative">
                      <div className={`absolute inset-0 blur-xl rounded-full transition-colors ${theme === 'dark' ? 'bg-blue-500/20 group-hover:bg-blue-500/40' : 'bg-blue-200 group-hover:bg-blue-300'}`}></div>
                      <img src={c.thumbnail || 'https://via.placeholder.com/150'} alt={c.title} className={`w-20 h-20 rounded-xl object-cover border relative z-10 shadow-md ${theme === 'dark' ? 'border-white/10' : 'border-gray-300'}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-bold text-md leading-tight group-hover:text-blue-500 transition-colors ${theme === 'dark' ? 'text-white group-hover:text-blue-300' : 'text-slate-800 group-hover:text-blue-600'}`}>{c.title}</h4>
                      <p className={`text-xs font-medium mt-1.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{c.instructor} • <span className="text-blue-500">{c.category}</span></p>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button onClick={() => setEditingCourse(c)} className="p-2.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-blue-500/20">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                      </button>
                      <button onClick={() => handleDeleteCourse(c._id)} className="p-2.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-red-500/20">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* QUERIES TAB */}
        {activeTab === 'queries' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[700px] relative z-10">
            {/* Sidebar Inbox */}
            <div className={`lg:col-span-1 rounded-3xl p-6 shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-white/5 backdrop-blur-xl border border-white/10' : 'bg-white border border-gray-200'}`}>
              <h3 className={`font-black text-xl mb-6 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Open Queries</h3>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {inbox.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 italic text-sm">No active queries</div>
                ) : inbox.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => fetchChatWithUser(item.user._id)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all border ${selectedChatUser?._id === item.user._id ? (theme === 'dark' ? 'bg-blue-600/20 border-blue-500/50' : 'bg-blue-50 border-blue-200') : (theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-gray-50 border-gray-100 hover:bg-gray-100')}`}
                  >
                    <div className="flex items-center space-x-3">
                      <img src={item.user.picture || `https://ui-avatars.com/api/?name=${item.user.name}`} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-white/20" />
                      <div className="min-w-0 flex-1">
                        <p className={`font-bold text-sm truncate ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{item.user.name}</p>
                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter">{item.user.role}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2 truncate italic">"{item.lastMessage.content}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Box */}
            <div className={`lg:col-span-3 rounded-3xl shadow-2xl flex flex-col relative overflow-hidden ${theme === 'dark' ? 'bg-white/5 backdrop-blur-xl border border-white/10' : 'bg-white border border-gray-200'}`}>
              {!selectedChatUser ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-40">
                  <svg className="w-20 h-20 mb-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                  <h4 className="text-xl font-black">Admin Support Center</h4>
                  <p className="text-sm font-medium max-w-sm mt-2">Select a conversation from the sidebar to view details and respond to user queries.</p>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div className={`p-6 border-b flex justify-between items-center ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="flex items-center space-x-4">
                      <img src={selectedChatUser.picture || `https://ui-avatars.com/api/?name=${selectedChatUser.name}`} alt="pfp" className="w-12 h-12 rounded-full border-2 border-blue-500 shadow-lg shadow-blue-500/20" />
                      <div>
                        <h4 className="font-black text-lg leading-tight">{selectedChatUser.name}</h4>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{selectedChatUser.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border ${selectedChatUser.role === 'student' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>{selectedChatUser.role}</span>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.senderId === 'admin' || (msg.sender && msg.sender.role === 'admin') ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-4 rounded-2xl shadow-lg relative ${msg.senderId === 'admin' || (msg.sender && msg.sender.role === 'admin')
                          ? (theme === 'dark' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-blue-600 text-white rounded-tr-none')
                          : (theme === 'dark' ? 'bg-white/10 text-white border border-white/10 rounded-tl-none' : 'bg-gray-100 text-slate-800 border border-gray-200 rounded-tl-none')}`}>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <p className={`text-[9px] mt-2 font-bold opacity-60 uppercase tracking-widest ${msg.senderId === 'admin' || (msg.sender && msg.sender.role === 'admin') ? 'text-blue-100' : 'text-gray-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input Area */}
                  <form onSubmit={handleSendMessage} className={`p-6 border-t ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="flex items-center space-x-4">
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder={`Reply to ${selectedChatUser.name.split(' ')[0]}...`}
                        className={`flex-1 p-4 rounded-2xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${theme === 'dark' ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-white border-gray-300 text-slate-900 shadow-inner'}`}
                      />
                      <button
                        type="submit"
                        disabled={isSending || !messageText.trim()}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white p-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                      >
                        <svg className="w-6 h-6 rotate-90" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}

      </main>

      {/* MODALS */}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsAddUserModalOpen(false)}></div>
          <div className={`relative w-full max-w-md rounded-3xl p-8 shadow-2xl border ${theme === 'dark' ? 'bg-[#161a2b] border-white/10' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-2xl font-black mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Add New User</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <input type="text" placeholder="Full Name" required value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className={`w-full p-4 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${theme === 'dark' ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-slate-800'}`} />
              <input type="email" placeholder="Email Address" required value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className={`w-full p-4 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${theme === 'dark' ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-slate-800'}`} />
              <input type="password" placeholder="Password" required value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className={`w-full p-4 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${theme === 'dark' ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-slate-800'}`} />
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className={`w-full p-4 rounded-xl border appearance-none focus:ring-2 focus:ring-blue-500 outline-none ${theme === 'dark' ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-slate-800'}`}>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setIsAddUserModalOpen(false)} className={`flex-1 py-3.5 rounded-xl font-bold border ${theme === 'dark' ? 'border-white/10 text-gray-400 hover:bg-white/5' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>Cancel</button>
                <button type="submit" className="flex-1 py-3.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/25">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setEditingUser(null)}></div>
          <div className={`relative w-full max-w-md rounded-3xl p-8 shadow-2xl border ${theme === 'dark' ? 'bg-[#161a2b] border-white/10' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-2xl font-black mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Edit User</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <input type="text" placeholder="Full Name" required value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} className={`w-full p-4 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${theme === 'dark' ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-slate-800'}`} />
              <input type="email" placeholder="Email Address" required value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} className={`w-full p-4 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${theme === 'dark' ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-slate-800'}`} />
              <select value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })} className={`w-full p-4 rounded-xl border appearance-none focus:ring-2 focus:ring-blue-500 outline-none ${theme === 'dark' ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-slate-800'}`}>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setEditingUser(null)} className={`flex-1 py-3.5 rounded-xl font-bold border ${theme === 'dark' ? 'border-white/10 text-gray-400 hover:bg-white/5' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>Cancel</button>
                <button type="submit" className="flex-1 py-3.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/25">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {editingCourse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setEditingCourse(null)}></div>
          <div className={`relative w-full max-w-2xl rounded-3xl p-8 shadow-2xl border ${theme === 'dark' ? 'bg-[#161a2b] border-white/10' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-2xl font-black mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Edit Course</h3>
            <form onSubmit={handleUpdateCourse} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Course Title</label>
                <input type="text" required value={editingCourse.title} onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })} className={`w-full p-4 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${theme === 'dark' ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-slate-800'}`} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Instructor</label>
                <input type="text" required value={editingCourse.instructor} onChange={(e) => setEditingCourse({ ...editingCourse, instructor: e.target.value })} className={`w-full p-4 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${theme === 'dark' ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-slate-800'}`} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Level</label>
                <select value={editingCourse.level} onChange={(e) => setEditingCourse({ ...editingCourse, level: e.target.value })} className={`w-full p-4 rounded-xl border appearance-none focus:ring-2 focus:ring-blue-500 outline-none ${theme === 'dark' ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-slate-800'}`}>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Category</label>
                <select value={editingCourse.category} onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })} className={`w-full p-4 rounded-xl border appearance-none focus:ring-2 focus:ring-blue-500 outline-none ${theme === 'dark' ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-slate-800'}`}>
                  <option>Common</option>
                  <option>CSE</option>
                  <option>IT</option>
                  <option>CSBS</option>
                  <option>AI & DS</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Thumbnail URL</label>
                <input type="url" value={editingCourse.thumbnail} onChange={(e) => setEditingCourse({ ...editingCourse, thumbnail: e.target.value })} className={`w-full p-4 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${theme === 'dark' ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-slate-800'}`} />
              </div>
              <div className="md:col-span-2 flex space-x-3 pt-4">
                <button type="button" onClick={() => setEditingCourse(null)} className={`flex-1 py-3.5 rounded-xl font-bold border ${theme === 'dark' ? 'border-white/10 text-gray-400 hover:bg-white/5' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>Cancel</button>
                <button type="submit" className="flex-1 py-3.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/25">Update Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;