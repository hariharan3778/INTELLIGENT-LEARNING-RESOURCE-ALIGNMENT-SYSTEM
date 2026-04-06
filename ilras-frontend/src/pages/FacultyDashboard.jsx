import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

const FacultyDashboard = () => {
  const { theme, toggleTheme } = useTheme();
  const [userName, setUserName] = useState('Faculty');
  const [stats, setStats] = useState({ totalStudents: 0, averagePerformance: "0%", pendingFeedbacks: 0 });
  const [resources, setResources] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedSemester, setSelectedSemester] = useState('All Semesters');

  const [uploadData, setUploadData] = useState({ title: '', link: '', youtubeLink: '', subject: 'Web Development', difficulty: 'Beginner', file: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Messaging State
  const [inbox, setInbox] = useState([]);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState(null); // Used for both User object (Direct) OR Course object (Group)
  const [chatMessages, setChatMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [chatMode, setChatMode] = useState('direct'); // 'direct' or 'group'
  const [feedbacks, setFeedbacks] = useState([]);

  // New features state
  const [timetable, setTimetable] = useState([]);
  const [curriculum, setCurriculum] = useState([]);
  const [studentSearchName, setStudentSearchName] = useState('');
  const [searchedStudent, setSearchedStudent] = useState(null);
  const [isSearchingStudent, setIsSearchingStudent] = useState(false);
  const [activeTab, setActiveTab] = useState('courses'); // 'courses', 'students', 'timetable', 'curriculum'
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) setUserName(storedName);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [statsRes, resourcesRes, coursesRes, inboxRes, feedbackRes, timetableRes, curriculumRes, unreadRes] = await Promise.all([
        axios.get('http://localhost:5000/api/faculty/stats', config),
        axios.get('http://localhost:5000/api/faculty/resources', config),
        axios.get('http://localhost:5000/api/courses', config),
        axios.get('http://localhost:5000/api/messages/inbox/recent', config).catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/faculty/feedback', config).catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/faculty/timetable', config).catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/faculty/curriculum', config).catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/messages/unread/count', config).catch(() => ({ data: { count: 0 } }))
      ]);
      setStats(statsRes.data);
      setResources(resourcesRes.data);
      setCourses(coursesRes.data);
      if (inboxRes && inboxRes.data) setInbox(inboxRes.data);
      if (feedbackRes && feedbackRes.data) setFeedbacks(feedbackRes.data);
      setTimetable(timetableRes.data);
      setCurriculum(curriculumRes.data);
      if (unreadRes && unreadRes.data) setUnreadCount(unreadRes.data.count);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  // Poll inbox and active chat
  useEffect(() => {
    let intervalId;
    const pollMessages = async () => {
      try {
        const token = localStorage.getItem('userToken');

        // Poll inbox
        if (isInboxOpen) {
          const inboxRes = await axios.get('http://localhost:5000/api/messages/inbox/recent', { headers: { Authorization: `Bearer ${token}` } });
          if (inboxRes && inboxRes.data) setInbox(inboxRes.data);
        }

        // Poll active chat if open
        if (activeChatUser) {
          if (chatMode === 'direct') {
            const res = await axios.get(`http://localhost:5000/api/messages/${activeChatUser._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setChatMessages(res.data.messages);
          } else {
            const res = await axios.get(`http://localhost:5000/api/messages/group/${activeChatUser._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setChatMessages(res.data.messages || []);
          }
        }
      } catch (err) {
        console.error("Failed to poll messages", err);
      }
    };

    intervalId = setInterval(pollMessages, 2000); // Increased frequency for "instant" feel
    return () => clearInterval(intervalId);
  }, [activeChatUser, chatMode, isInboxOpen]);

  // Separate poll for Unread Count
  useEffect(() => {
    const pollUnread = async () => {
      try {
        const token = localStorage.getItem('userToken');
        const res = await axios.get('http://localhost:5000/api/messages/unread/count', { headers: { Authorization: `Bearer ${token}` } });
        setUnreadCount(res.data.count);
      } catch (err) { }
    };
    const id = setInterval(pollUnread, 4000);
    return () => clearInterval(id);
  }, []);

  const openChat = async (userOrCourse, mode = 'direct') => {
    setActiveChatUser(userOrCourse);
    setChatMode(mode);
    setChatMessages([]); // Reset array

    try {
      const token = localStorage.getItem('userToken');

      if (mode === 'direct') {
        const res = await axios.get(`http://localhost:5000/api/messages/${userOrCourse._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setChatMessages(res.data.messages);

        // Mark as read
        await axios.put(`http://localhost:5000/api/messages/mark-read/${userOrCourse._id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUnreadCount(prev => Math.max(0, prev - 1)); // Optimistic local update
      } else {
        // Group Chat
        const res = await axios.get(`http://localhost:5000/api/messages/group/${userOrCourse._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setChatMessages(res.data.messages || []);
      }
    } catch (err) {
      console.error("Failed to load chat", err);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !activeChatUser) return;
    try {
      const token = localStorage.getItem('userToken');

      const receiverId = chatMode === 'group' ? 'group' : activeChatUser._id;
      const courseId = chatMode === 'group' ? activeChatUser._id : undefined;

      const res = await axios.post('http://localhost:5000/api/messages/send', {
        receiverId: receiverId,
        courseId: courseId,
        content: replyText
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (chatMode === 'group') {
        const userPic = localStorage.getItem('userPic') || 'https://ui-avatars.com/api/?name=Faculty';
        setChatMessages([...chatMessages, { ...res.data.message, sender: { name: userName, role: 'faculty', picture: userPic } }]);
      } else {
        setChatMessages([...chatMessages, res.data.message]);
      }

      setReplyText('');
    } catch (err) {
      console.error("Failed to send reply", err);
    }
  };

  const handleStudentSearch = async () => {
    if (!studentSearchName.trim()) return;
    setIsSearchingStudent(true);
    setSearchedStudent(null);
    try {
      const token = localStorage.getItem('userToken');
      const res = await axios.get(`http://localhost:5000/api/faculty/search-student?name=${studentSearchName}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchedStudent(res.data);
    } catch (err) {
      console.error("Student search failed", err);
      alert('Student not found');
    } finally {
      setIsSearchingStudent(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadData.title) return alert('Please enter a title');
    setIsUploading(true);
    try {
      const token = localStorage.getItem('userToken');

      const formData = new FormData();
      formData.append('title', uploadData.title);
      formData.append('link', uploadData.link);
      formData.append('youtubeLink', uploadData.youtubeLink);
      formData.append('subject', uploadData.subject);
      formData.append('difficulty', uploadData.difficulty);

      if (selectedCourse) {
        formData.append('courseId', selectedCourse._id);
      }
      if (uploadData.file) {
        formData.append('file', uploadData.file);
      }

      const config = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } };

      const res = await axios.post('http://localhost:5000/api/faculty/add-resource', formData, config);
      if (res.data.success) {
        setResources([res.data.resource, ...resources]);
        setUploadData({ title: '', link: '', youtubeLink: '', subject: 'Web Development', difficulty: 'Beginner', file: null });
        setToastMessage('Resource added successfully! 🎉');
        setTimeout(() => setToastMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error uploading resource:', error);
    }
    setIsUploading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this resource?")) return;
    try {
      const token = localStorage.getItem('userToken');
      await axios.delete(`http://localhost:5000/api/faculty/resource/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResources(resources.filter(r => r._id !== id));
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  };

  const activeResources = selectedCourse
    ? resources.filter(r => r.courseId === selectedCourse._id)
    : resources;

  const filteredResources = activeResources.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredCoursesList = courses.filter(course => {
    const deptMatch = selectedDepartment === 'All Departments' || course.category === selectedDepartment || course.category === 'Common';
    const semMatch = selectedSemester === 'All Semesters' || course.semester === selectedSemester;
    return deptMatch && semMatch;
  });

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0b0f19] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0b0f19] to-black text-white' : 'bg-[#f8fafc] text-slate-800'}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 bg-[#4ade80] text-white px-6 py-3 rounded-xl shadow-lg font-bold z-50 animate-bounce">
          {toastMessage}
        </div>
      )}

      {!selectedCourse ? (
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 space-y-10 pb-20 pt-10">
          {/* Header Title */}
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2 tracking-tight drop-shadow-lg">Welcome, {userName}!</h1>
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-200/60' : 'text-slate-500'}`}>Manage educational resources, courses, and track class performance</p>
            </div>

            {/* Navigation Tabs */}
            <div className={`flex p-1 rounded-2xl shadow-inner mt-6 md:mt-0 ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-gray-100 border border-gray-200'}`}>
              {['courses', 'students', 'timetable', 'curriculum'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize ${activeTab === tab
                    ? (theme === 'dark' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-blue-600 shadow-sm')
                    : (theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-slate-800')
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'courses' ? (
            <>
              {/* --- STATS SECTION --- */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <div className={`p-6 rounded-3xl border shadow-xl flex items-center justify-between group transition-transform hover:-translate-y-1 ${theme === 'dark' ? 'bg-white/5 backdrop-blur-xl border-white/10' : 'bg-white border-gray-100'}`}>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`}>Total Students</p>
                    <h3 className={`text-4xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.totalStudents || 0}</h3>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${theme === 'dark' ? 'bg-blue-500/20 text-blue-400 shadow-blue-500/20' : 'bg-blue-100 text-blue-600'}`}>
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354v15.292M19.646 12H4.354" /></svg>
                  </div>
                </div>
                <div className={`p-6 rounded-3xl border shadow-xl flex items-center justify-between group transition-transform hover:-translate-y-1 ${theme === 'dark' ? 'bg-white/5 backdrop-blur-xl border-white/10' : 'bg-white border-gray-100'}`}>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-500'}`}>Avg Performance</p>
                    <h3 className={`text-4xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.averagePerformance || '0%'}</h3>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${theme === 'dark' ? 'bg-purple-500/20 text-purple-400 shadow-purple-500/20' : 'bg-purple-100 text-purple-600'}`}>
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                  </div>
                </div>
                <div className={`p-6 rounded-3xl border shadow-xl flex items-center justify-between group transition-transform hover:-translate-y-1 ${theme === 'dark' ? 'bg-white/5 backdrop-blur-xl border-white/10' : 'bg-white border-gray-100'}`}>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${theme === 'dark' ? 'text-pink-400' : 'text-pink-500'}`}>Feedbacks</p>
                    <h3 className={`text-4xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.pendingFeedbacks || 0}</h3>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${theme === 'dark' ? 'bg-pink-500/20 text-pink-400 shadow-pink-500/20' : 'bg-pink-100 text-pink-600'}`}>
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 relative z-20">
                <h2 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Assigned Courses</h2>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-black tracking-widest uppercase ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Dept:</span>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none pr-8 ${theme === 'dark'
                        ? 'bg-[#111625] border-white/10 text-white hover:bg-[#161b2e]'
                        : 'bg-white border-gray-200 text-slate-800 hover:bg-gray-50'
                        }`}
                    >
                      <option value="All Departments">All Departments</option>
                      <option value="CSE">CSE</option>
                      <option value="IT">IT</option>
                      <option value="AI & DS">AI & DS</option>
                      <option value="CSBS">CSBS</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-black tracking-widest uppercase ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Sem:</span>
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none pr-8 ${theme === 'dark'
                        ? 'bg-[#111625] border-white/10 text-white hover:bg-[#161b2e]'
                        : 'bg-white border-gray-200 text-slate-800 hover:bg-gray-50'
                        }`}
                    >
                      <option value="All Semesters">All Semesters</option>
                      <option value="SEM 1">Semester 1</option>
                      <option value="SEM 2">Semester 2</option>
                      <option value="SEM 3">Semester 3</option>
                      <option value="SEM 4">Semester 4</option>
                      <option value="SEM 5">Semester 5</option>
                      <option value="SEM 6">Semester 6</option>
                      <option value="SEM 7">Semester 7</option>
                      <option value="SEM 8">Semester 8</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      openChat({ _id: 'admin', name: 'ILRAS Admin' }, 'direct');
                      setIsInboxOpen(true);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-black shadow-lg transition-all flex items-center space-x-2 ${theme === 'dark' ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    <span>Contact Admin</span>
                  </button>
                </div>
              </div>

              {/* --- COURSES GRID --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCoursesList.length === 0 ? (
                  <div className="col-span-full p-20 text-center opacity-30 italic">No courses found matching criteria.</div>
                ) : (
                  filteredCoursesList.map(course => (
                    <div key={course._id} onClick={() => setSelectedCourse(course)} className={`cursor-pointer rounded-3xl border overflow-hidden shadow-xl group transition-all duration-300 hover:-translate-y-2 flex flex-col ${theme === 'dark' ? 'bg-[#111526] border-white/10 hover:border-blue-500/50' : 'bg-white border-gray-200 hover:border-blue-400'}`}>
                      <div className="relative h-40 w-full overflow-hidden">
                        <img src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80'} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <div className="absolute bottom-4 left-5 right-5">
                          <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-sm bg-blue-500 text-white inline-block">{course.category}</span>
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className={`font-bold text-lg leading-tight mb-2 group-hover:text-blue-500 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{course.title}</h3>
                          <p className={`text-xs font-medium line-clamp-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{course.semester || 'Academic Term'}</p>
                        </div>
                        <div className={`mt-5 pt-4 border-t flex justify-between items-center ${theme === 'dark' ? 'border-white/10' : 'border-gray-100'}`}>
                          <div className="text-xs font-black text-gray-500">{course.level}</div>
                          <div className="text-xs font-bold text-blue-500">Manage Content →</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Resources Quick Upload */}
              <div className={`p-8 rounded-3xl border shadow-xl ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Quick Resource Upload</h3>
                  <button onClick={handleUpload} disabled={isUploading} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                    {isUploading ? 'Uploading...' : 'Launch to Cloud'}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <input type="text" placeholder="Title" value={uploadData.title} onChange={e => setUploadData({ ...uploadData, title: e.target.value })} className={`w-full p-3 rounded-xl border ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'}`} />
                    <input type="text" placeholder="Link" value={uploadData.link} onChange={e => setUploadData({ ...uploadData, link: e.target.value })} className={`w-full p-3 rounded-xl border ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'}`} />
                  </div>
                  <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer ${theme === 'dark' ? 'border-white/10 bg-black/10' : 'border-gray-200 bg-gray-50'}`}>
                    <input type="file" id="dash-file" className="hidden" onChange={e => setUploadData({ ...uploadData, file: e.target.files[0] })} />
                    <label htmlFor="dash-file" className="text-center cursor-pointer">
                      <svg className="w-8 h-8 mx-auto mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                      <span className="text-xs font-bold text-gray-500">{uploadData.file ? uploadData.file.name : "Select File"}</span>
                    </label>
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'students' ? (
            <div className="space-y-8 animate-fadeIn">
              <div className={`p-8 rounded-3xl border shadow-xl ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                <h3 className="text-xl font-bold mb-6">Student Lookup</h3>
                <div className="flex space-x-4 mb-8">
                  <input type="text" placeholder="Student name..." value={studentSearchName} onChange={e => setStudentSearchName(e.target.value)} className={`flex-1 p-3.5 rounded-2xl border ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'}`} />
                  <button onClick={handleStudentSearch} disabled={isSearchingStudent} className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-bold">Search</button>
                </div>
                {searchedStudent && (
                  <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 flex items-center space-x-6">
                    <img src={searchedStudent.picture || "https://i.pravatar.cc/150"} className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-500/20" alt="" />
                    <div>
                      <h4 className="text-xl font-bold">{searchedStudent.name}</h4>
                      <p className="text-gray-500 text-sm mb-3">{searchedStudent.email}</p>
                      <div className="flex space-x-3">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase">Active Engagement</span>
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 text-[10px] font-black uppercase">92% Attendance</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'timetable' ? (
            <div className="space-y-8 animate-fadeIn">
              <div className={`p-8 rounded-3xl border shadow-xl ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                <h3 className="text-xl font-bold mb-8">Teaching Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                    <div key={day} className="space-y-3">
                      <h4 className="text-center font-black text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5 pb-2">{day}</h4>
                      {timetable.filter(s => s.day === day).map((slot, i) => (
                        <div key={i} className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                          <p className="font-bold text-xs">{slot.title}</p>
                          <p className="text-[10px] text-blue-500 font-bold mt-1">{slot.start}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-fadeIn">
              <div className={`rounded-3xl border overflow-hidden ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                <table className="w-full text-left">
                  <thead className={theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}>
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500">Code</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500">Name</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500">Dept</th>
                    </tr>
                  </thead>
                  <tbody>
                    {curriculum.map((c, i) => (
                      <tr key={i} className="border-t border-white/5">
                        <td className="px-6 py-4 text-xs font-bold text-blue-500">{c.courseCode}</td>
                        <td className="px-6 py-4 text-sm font-bold">{c.courseName}</td>
                        <td className="px-6 py-4 text-xs text-gray-500">{c.department}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 space-y-8 pb-20 pt-10">
          {/* Back Button & Course Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div>
              <button
                onClick={() => setSelectedCourse(null)}
                className={`flex items-center space-x-2 text-sm font-bold mb-4 transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-slate-900'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                <span>Back to Dashboard</span>
              </button>
              <h1 className={`text-4xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{selectedCourse.title}</h1>
              <div className="flex items-center space-x-3 mt-2">
                <span className={`text-xs font-black px-2.5 py-1 rounded-md uppercase tracking-widest ${theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>{selectedCourse.category}</span>
                <span className={`text-xs font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{selectedCourse.semester || 'Academic Term'}</span>
              </div>
            </div>

            <button
              onClick={() => openChat(selectedCourse, 'group')}
              className={`px-6 py-3 rounded-full font-bold shadow-lg transition-transform hover:scale-105 flex items-center space-x-2 ${theme === 'dark' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/20' : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-blue-500/30'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              <span>Course Group Chat</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Left Column: Course Actions & Upload */}
            <div className="lg:col-span-1 space-y-6">
              <div className={`p-6 rounded-3xl border shadow-xl ${theme === 'dark' ? 'bg-white/5 border-white/10 backdrop-blur-xl' : 'bg-white border-gray-100'}`}>
                <h3 className={`font-black text-lg mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Add Course Material</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Material Title"
                    value={uploadData.title}
                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                    className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm ${theme === 'dark' ? 'bg-[#111526] border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-slate-800 placeholder-gray-400'}`}
                  />
                  <input
                    type="text"
                    placeholder="Drive/Cloud Link"
                    value={uploadData.link}
                    onChange={(e) => setUploadData({ ...uploadData, link: e.target.value })}
                    className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm ${theme === 'dark' ? 'bg-[#111526] border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-slate-800 placeholder-gray-400'}`}
                  />
                  <input
                    type="text"
                    placeholder="YouTube Link"
                    value={uploadData.youtubeLink}
                    onChange={(e) => setUploadData({ ...uploadData, youtubeLink: e.target.value })}
                    className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm ${theme === 'dark' ? 'bg-[#111526] border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-slate-800 placeholder-gray-400'}`}
                  />
                  <div className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${theme === 'dark' ? 'border-white/20 bg-[#111526] hover:border-blue-500' : 'border-gray-300 bg-gray-50 hover:border-blue-400'}`}>
                    <input type="file" onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })} className="hidden" id="course-file-upload" />
                    <label htmlFor="course-file-upload" className="flex flex-col items-center cursor-pointer w-full text-center">
                      <svg className={`w-6 h-6 mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                      <span className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{uploadData.file ? uploadData.file.name : "Select File"}</span>
                    </label>
                  </div>
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className={`w-full py-3 rounded-xl font-bold shadow-md transition-all flex items-center justify-center space-x-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'} ${theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'}`}
                  >
                    {isUploading ? <span>Uploading...</span> : <span>Upload to Course</span>}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Course Resources */}
            <div className="lg:col-span-2">
              <div className={`p-6 rounded-3xl border shadow-xl min-h-[400px] ${theme === 'dark' ? 'bg-white/5 border-white/10 backdrop-blur-xl' : 'bg-white border-gray-100'}`}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`font-black text-xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Course Materials</h3>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${theme === 'dark' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-purple-100 text-purple-600 border-purple-200'}`}>{activeResources.length} Files</span>
                </div>

                {activeResources.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 opacity-50">
                    <svg className={`w-12 h-12 mb-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                    <p className={`text-sm font-bold tracking-widest uppercase ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No materials uploaded yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeResources.map(r => (
                      <div key={r._id} className={`p-4 rounded-xl border flex items-center justify-between group transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-blue-500/50' : 'bg-gray-50 border-gray-200 hover:border-blue-300'}`}>
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <div className={`p-2 rounded-lg shrink-0 ${theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                            {r.youtubeLink ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                              : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                            }
                          </div>
                          <div className="truncate">
                            <p className={`font-bold text-sm truncate ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{r.title}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{r.subject}</p>
                          </div>
                        </div>
                        <button onClick={() => handleDelete(r._id)} className="p-1.5 text-gray-400 hover:text-red-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Course Feedback Section (Requested below course) */}
          <div className={`p-8 rounded-3xl border shadow-xl mt-10 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Course Feedback</h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Student Sentiment</span>
            </div>
            <div className="space-y-4">
              {feedbacks.filter(f => f.courseName === selectedCourse.title).length > 0 ? (
                feedbacks.filter(f => f.courseName === selectedCourse.title).map((fb, i) => (
                  <div key={i} className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-bold text-sm tracking-tight">{fb.studentName || 'Student'}</h5>
                      <div className="flex space-x-0.5">
                        {Array.from({ length: 5 }).map((_, si) => (
                          <svg key={si} className={`w-3 h-3 ${si < (fb.stars || 5) ? 'text-yellow-500 fill-current' : 'text-gray-600'}`} viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed italic">"{fb.message}"</p>
                    <p className="text-[9px] text-gray-500 mt-2 font-bold">{new Date(fb.createdAt).toLocaleDateString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-10 italic">No feedback received for this course yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Inbox Button */}
      <div className="fixed bottom-8 right-8 z-40">
        <button
          onClick={() => setIsInboxOpen(!isInboxOpen)}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${isInboxOpen ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/30'} text-white`}
        >
          {isInboxOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          ) : (
            <div className="relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
              {unreadCount > 0 && (
                <span className={`absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 animate-pulse ${theme === 'dark' ? 'border-indigo-600' : 'border-white'}`}>
                  {unreadCount}
                </span>
              )}
            </div>
          )}
        </button>
      </div>

      {/* Slide-out Sidebar Inbox Panel (Direct Messaging) */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[450px] shadow-2xl z-30 transform transition-transform duration-500 ease-in-out flex flex-col ${isInboxOpen ? 'translate-x-0' : 'translate-x-full'} ${theme === 'dark' ? 'bg-[#0f172a] border-l border-white/10' : 'bg-white border-l border-gray-200'}`}>
        {/* Inbox Header */}
        <div className={`px-6 py-5 border-b flex items-center justify-between ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
            </div>
            <div>
              <h2 className={`font-black tracking-tight text-lg leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Student Inbox</h2>
              <p className={`text-[11px] font-bold uppercase tracking-widest mt-0.5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Direct Messages</p>
            </div>
          </div>
        </div>

        {/* View Selection: User List vs Active Direct Chat */}
        {!activeChatUser ? (
          <div className={`flex-1 overflow-y-auto p-4 space-y-2 ${theme === 'dark' ? 'bg-[#0b0f19]' : 'bg-white'}`}>
            <div className={`text-xs font-bold uppercase tracking-widest px-2 mb-4 mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Recent Conversations</div>

            {inbox.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 opacity-50 space-y-3">
                <svg className={`w-10 h-10 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                <p className={`text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>No direct messages</p>
              </div>
            ) : (
              inbox.map(contact => {
                const user = contact.user;
                const lastMsg = contact.lastMessage;
                const isUnread = false; // Could compute based on receiver/isRead if supported by backend

                return (
                  <div
                    key={user._id}
                    onClick={() => openChat(user, 'direct')}
                    className={`p-4 rounded-2xl cursor-pointer flex items-center justify-between group transition-colors ${theme === 'dark' ? 'hover:bg-white/5 border border-transparent hover:border-white/10' : 'hover:bg-gray-50 border border-transparent hover:border-gray-100'}`}
                  >
                    <div className="flex items-center space-x-4 overflow-hidden">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-bold text-lg ${theme === 'dark' ? 'bg-[#1e293b] text-white' : 'bg-gray-200 text-slate-700'}`}>
                          {user.picture ? (
                            <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user.name?.charAt(0) || 'U'
                          )}
                        </div>
                        {isUnread && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>}
                      </div>
                      <div className="truncate">
                        <h4 className={`font-bold text-sm ${theme === 'dark' ? 'text-white group-hover:text-blue-400' : 'text-slate-800 group-hover:text-blue-600'} transition-colors`}>{user.name || 'Unknown User'}</h4>
                        <p className={`text-xs truncate ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{lastMsg?.content || ''}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Active Chat Header */}
            <div className={`px-4 py-3 border-b flex items-center justify-between ${theme === 'dark' ? 'bg-[#161b2e] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setActiveChatUser(null)}
                  className={`p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-slate-900 hover:bg-gray-200'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${theme === 'dark' ? 'bg-[#1e293b] text-white' : 'bg-gray-200 text-slate-700'}`}>
                    {activeChatUser.name?.charAt(0) || activeChatUser.title?.charAt(0)}
                  </div>
                  <span className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{activeChatUser.name || activeChatUser.title}</span>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${theme === 'dark' ? 'bg-[#050811]' : 'bg-white'}`}>
              {chatMessages.map((msg, index) => {
                const isMe = msg.sender && msg.sender.role === 'faculty';
                return (
                  <div key={index} className={`flex flex-col space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : (theme === 'dark' ? 'bg-white/10 text-white rounded-tl-none' : 'bg-gray-100 text-slate-800 rounded-tl-none')}`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full space-y-3 opacity-50">
                  <svg className={`w-12 h-12 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                  <p className={`text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No messages yet</p>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className={`p-4 border-t flex items-center space-x-3 ${theme === 'dark' ? 'bg-[#0f172a] border-white/10' : 'bg-white border-gray-200'}`}>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleReply()}
                  placeholder="Message Student..."
                  className={`w-full rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${theme === 'dark' ? 'bg-white/5 text-white placeholder-gray-500 border border-white/10' : 'bg-gray-50 text-slate-800 placeholder-gray-400 border border-gray-200'}`}
                />
              </div>
              <button
                onClick={handleReply}
                className={`p-3 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 ${theme === 'dark' ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-blue-600 text-white shadow-blue-500/30'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div >
  );
};

export default FacultyDashboard;