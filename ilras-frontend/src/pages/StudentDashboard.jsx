import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { useOutletContext } from 'react-router-dom';

const StudentDashboard = () => {
  const { theme } = useTheme();

  // Consume global layout context for Top Navigation interactions
  const { searchTerm, selectedDepartment } = useOutletContext();

  const [userName, setUserName] = useState('Student');
  const [userPic, setUserPic] = useState('https://i.pravatar.cc/150');

  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activityData, setActivityData] = useState([]);
  const [feedbackData, setFeedbackData] = useState([]);
  const [bookmarkedResources, setBookmarkedResources] = useState([]);

  // Dynamic Course View State
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseResources, setCourseResources] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isMessageSent, setIsMessageSent] = useState(false);

  const [chatMode, setChatMode] = useState('direct'); // 'direct' or 'group'
  const [groupMessages, setGroupMessages] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [instructorUser, setInstructorUser] = useState(null);

  // Video Player Modal State
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);

  // Support State
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [adminMessages, setAdminMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    const storedPic = localStorage.getItem('userPic');
    if (storedName) setUserName(storedName);
    if (storedPic) setUserPic(storedPic);

    // Fetch courses
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem('userToken');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get('http://localhost:5000/api/courses', config);
        setCourses(res.data);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('userToken');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [activityRes, feedbackRes] = await Promise.all([
          axios.get('http://localhost:5000/api/dashboard/activity', config),
          axios.get('http://localhost:5000/api/dashboard/feedback', config)
        ]);
        setActivityData(activityRes.data);
        setFeedbackData(feedbackRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem('userToken');
        const res = await axios.get('http://localhost:5000/api/messages/unread/count', { headers: { Authorization: `Bearer ${token}` } });
        setUnreadCount(res.data.count);
      } catch (err) { }
    };

    fetchCourses();
    fetchDashboardData();
    fetchUnread();

    const unreadId = setInterval(fetchUnread, 4000);
    return () => clearInterval(unreadId);
  }, []);

  // Fetch admin messages when activeChatUser is 'admin' with polling
  useEffect(() => {
    let intervalId;
    const fetchAdminChat = async () => {
      if (activeChatUser?._id === 'admin') {
        try {
          const token = localStorage.getItem('userToken');
          const res = await axios.get('http://localhost:5000/api/messages/admin', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setAdminMessages(res.data.messages || []);
        } catch (err) { console.error("Failed to fetch admin messages", err); }
      }
    };

    if (activeChatUser?._id === 'admin') {
      fetchAdminChat();
      intervalId = setInterval(fetchAdminChat, 2000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeChatUser]);

  // Poll course group and direct messages when a course is selected
  useEffect(() => {
    let intervalId;
    const pollCourseMessages = async () => {
      if (!selectedCourse) return;
      try {
        const token = localStorage.getItem('userToken');

        const groupRes = await axios.get(`http://localhost:5000/api/messages/group/${selectedCourse._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGroupMessages(groupRes.data.messages || []);

        const instructorRef = selectedCourse.instructorId || selectedCourse.instructor;
        if (instructorRef) {
          const directRes = await axios.get(`http://localhost:5000/api/messages/${instructorRef}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setDirectMessages(directRes.data.messages || []);
        }
      } catch (err) {
        console.error("Failed to poll course messages", err);
      }
    };

    if (selectedCourse) {
      intervalId = setInterval(pollCourseMessages, 2000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedCourse]);

  const handleSendAdminMessage = async () => {
    if (!messageText.trim()) return;
    setIsSendingMessage(true);
    try {
      const token = localStorage.getItem('userToken');
      const res = await axios.post('http://localhost:5000/api/messages/send', {
        receiverId: 'admin',
        content: messageText
      }, { headers: { Authorization: `Bearer ${token}` } });

      setAdminMessages([...adminMessages, res.data.message]);
      setMessageText('');
    } catch (err) {
      console.error("Failed to send admin message", err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const overallProgress = courses.length > 0
    ? Math.round(courses.reduce((sum, course) => sum + course.progress, 0) / courses.length)
    : 0;

  const circleCircumference = 339.29;
  const strokeDashoffset = circleCircumference - (overallProgress / 100) * circleCircumference;

  const filteredCourses = courses.filter(course => {
    const title = course.title || '';
    const category = course.category || 'Common';
    const search = searchTerm || '';

    const matchesSearch = title.toLowerCase().includes(search.toLowerCase()) ||
      category.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDepartment === 'All Departments' || category === selectedDepartment || category === 'Common';
    return matchesSearch && matchesDept;
  });

  const handleCourseClick = async (course) => {
    setSelectedCourse(course);
    setCourseResources([]);
    setGroupMessages([]);
    setDirectMessages([]);
    setInstructorUser(null);
    setChatMode('direct');
    try {
      const token = localStorage.getItem('userToken');

      const res = await axios.get(`http://localhost:5000/api/courses/${course._id}/resources`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourseResources(res.data);

      const groupRes = await axios.get(`http://localhost:5000/api/messages/group/${course._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroupMessages(groupRes.data.messages || []);

      const instructorRef = course.instructorId || course.instructor;
      if (instructorRef) {
        const directRes = await axios.get(`http://localhost:5000/api/messages/${instructorRef}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDirectMessages(directRes.data.messages || []);
        setInstructorUser(directRes.data.otherUser);

        // Mark as read
        await axios.put(`http://localhost:5000/api/messages/mark-read/${instructorRef}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

    } catch (err) {
      console.error("Failed to load course details", err);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    setIsSendingMessage(true);
    try {
      const token = localStorage.getItem('userToken');
      const receiverId = chatMode === 'group' ? 'group' : (selectedCourse.instructorId || selectedCourse.instructor);

      const res = await axios.post('http://localhost:5000/api/messages/send', {
        receiverId: receiverId,
        courseId: selectedCourse._id,
        content: messageText
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (chatMode === 'group') {
        const userPic = localStorage.getItem('userPic') || 'https://i.pravatar.cc/150';
        setGroupMessages([...groupMessages, { ...res.data.message, sender: { name: userName, picture: userPic } }]);
      } else {
        setDirectMessages([...directMessages, res.data.message]);
      }

      setIsMessageSent(true);
      setMessageText('');
      setTimeout(() => setIsMessageSent(false), 3000);
    } catch (err) {
      console.error("Failed to send message", err);
      alert('Failed to send message.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleToggleBookmark = async (resourceId) => {
    try {
      const token = localStorage.getItem('userToken');
      const isBookmarked = bookmarkedResources.includes(resourceId);

      if (isBookmarked) {
        await axios.delete(`http://localhost:5000/api/dashboard-data/bookmarks/${resourceId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBookmarkedResources(bookmarkedResources.filter(id => id !== resourceId));
      } else {
        await axios.post(`http://localhost:5000/api/dashboard-data/bookmarks/${resourceId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBookmarkedResources([...bookmarkedResources, resourceId]);
      }
    } catch (err) {
      console.error("Failed to toggle bookmark", err);
    }
  };

  return (
    <>
      {!selectedCourse ? (
        <div className="space-y-8">
          {/* Section 1: Welcome Banner (Full Width) */}
          <div className={`rounded-3xl p-8 lg:p-10 flex flex-col md:flex-row justify-between items-center border relative overflow-hidden shadow-2xl ${theme === 'dark' ? 'bg-gradient-to-r from-gray-900 via-[#1e1b4b] to-gray-900 border-white/10 shadow-black/50' : 'bg-gradient-to-tl from-indigo-500 via-purple-500 to-blue-500 border-white shadow-blue-500/20'}`}>
            <div className="z-10 text-center md:text-left mb-6 md:mb-0">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-white flex items-center justify-center md:justify-start">
                Welcome back, {userName}! <span className="ml-2 text-2xl">👋</span>
              </h1>
              <p className={`mb-6 font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-blue-100'}`}>You're making great progress. Keep it up!</p>
              <button className={`px-6 py-2.5 rounded-lg font-bold transition-colors shadow-lg shadow-blue-500/30 flex items-center mx-auto md:mx-0 ${theme === 'dark' ? 'bg-[#007BFF] hover:bg-blue-500 text-white' : 'bg-white text-indigo-600 hover:bg-gray-50'}`}>
                Continue Learning
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </div>

            <div className="relative w-36 h-36 flex justify-center items-center z-10">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="72" cy="72" r="54" stroke="currentColor" strokeWidth="12" fill="transparent" className={`opacity-50 ${theme === 'dark' ? 'text-gray-800' : 'text-white/20'}`} />
                <circle cx="72" cy="72" r="54" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={circleCircumference} strokeDashoffset={strokeDashoffset} className={`transition-all duration-1000 ${theme === 'dark' ? 'text-blue-500' : 'text-white'}`} strokeLinecap="round" />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-white">{overallProgress}%</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-white/80'}`}>Complete</span>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          </div>

          {/* Section 2: Recommended for You (Full Width) */}
          <div>
            <div className="flex justify-between items-end mb-4">
              <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Recommended for You</h3>
              <a href="#" className="text-blue-500 hover:text-blue-400 text-sm font-semibold transition-colors">View All</a>
            </div>

            <div className="flex space-x-6 overflow-x-auto pb-6 scrollbar-hide">
              {isLoading ? (
                <div className="text-gray-400 p-4">Loading courses...</div>
              ) : filteredCourses.length === 0 ? (
                <div className="text-gray-400 p-4">No courses matched your search.</div>
              ) : (
                filteredCourses.map((course) => (
                  <div key={course._id} onClick={() => handleCourseClick(course)} className={`min-w-[280px] w-[280px] rounded-2xl border overflow-hidden transition-all duration-300 group cursor-pointer shadow-lg hover:shadow-2xl hover:-translate-y-1 shrink-0 flex flex-col ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-blue-500/50 backdrop-blur-xl' : 'bg-white/80 border-white hover:border-blue-300 backdrop-blur-md'}`}>
                    <div className="h-40 relative bg-gray-900 overflow-hidden shrink-0">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                      />
                      <div className={`absolute top-3 right-3 border text-xs font-bold px-2 py-1 rounded ${course.level === 'Beginner' ? 'bg-green-500/20 text-green-500 border-green-500/30' :
                        course.level === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' :
                          'bg-red-500/20 text-red-500 border-red-500/30'
                        }`}>
                        {course.level}
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h4 className={`font-bold text-lg mb-2 leading-tight group-hover:text-blue-400 transition-colors line-clamp-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{course.title}</h4>
                      <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>{course.instructor} • {course.category}</p>

                      <div className="mt-auto">
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-gray-400">Progress</span>
                          <span className="text-blue-500">{course.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: `${course.progress}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 3: Weekly Activity (Full Width Stacked) */}
          <div className={`rounded-3xl p-7 border shadow-xl backdrop-blur-xl transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 shadow-black/50 hover:bg-white/10' : 'bg-white/80 border-white shadow-indigo-900/5 hover:bg-white'}`}>
            <h3 className={`text-xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Weekly Activity</h3>
            <div className="relative h-48 border-l border-b border-gray-800 flex items-end justify-between px-2 pt-4 pb-0 mb-4">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0">
                <div className="border-b border-dashed border-gray-800 w-full h-0"></div>
                <div className="border-b border-dashed border-gray-800 w-full h-0"></div>
                <div className="border-b border-dashed border-gray-800 w-full h-0"></div>
                <div className="border-b border-dashed border-gray-800 w-full h-0"></div>
              </div>
              <div className="absolute -left-6 inset-y-0 flex flex-col justify-between text-[10px] text-gray-500 font-bold py-1">
                <span>8</span><span>6</span><span>4</span><span>2</span><span>0</span>
              </div>
              {activityData.length > 0 ? (
                activityData.map((activity, index) => (
                  <div key={index} className="w-8 bg-blue-500 rounded-t-sm relative group z-10 hover:bg-blue-400 transition-colors" style={{ height: `${Math.min(100, (activity.hours / 8) * 100)}%` }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {activity.hours}h
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-sm absolute inset-0 flex items-center justify-center">No activity data</div>
              )}
            </div>
            <div className="flex justify-between px-2 text-[11px] text-gray-400 font-bold mb-6">
              {activityData.length > 0 ? (
                activityData.map((activity, index) => <span key={index}>{activity.day}</span>)
              ) : (
                <><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></>
              )}
            </div>
            <div className="flex justify-between items-center border-t border-gray-800 pt-4">
              <span className="text-sm text-gray-400">Total this week</span>
              <span className="text-xl font-bold text-white">
                {activityData.reduce((sum, item) => sum + item.hours, 0)} hrs
              </span>
            </div>
          </div>

          {/* Section 4: Recent Feedback (Full Width Stacked) */}
          <div className={`rounded-3xl p-7 border shadow-xl backdrop-blur-xl transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 shadow-black/50 hover:bg-white/10' : 'bg-white/80 border-white shadow-indigo-900/5 hover:bg-white'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Recent Feedback</h3>
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
            </div>
            <div className="space-y-4">
              {feedbackData.length > 0 ? (
                feedbackData.map((feedback) => (
                  <div key={feedback._id} className={`p-4 rounded-xl border transition-colors ${theme === 'dark' ? 'bg-[#1a1f2e] border-gray-800 hover:border-gray-700' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{feedback.instructorName || 'Instructor'}</h4>
                      <span className="text-[10px] text-gray-500">{feedback.timeAgo || new Date(feedback.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className={`text-[10px] mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>{feedback.courseName || 'Course Feedback'}</p>
                    <p className={`text-xs mb-3 leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}`}>{feedback.message}</p>
                    <div className="flex space-x-1 text-blue-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} className={`w-4 h-4 fill-current ${i < (feedback.stars || 5) ? 'text-blue-500' : 'text-gray-600'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-sm p-4 text-center">No feedback</div>
              )}
            </div>
          </div>

          {/* Section 5: Admin Support */}
          <div className={`rounded-2xl p-6 border shadow-xl flex flex-col justify-center items-center text-center ${theme === 'dark' ? 'bg-[#131825] border-gray-800' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Need Help?</h3>
            <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>Having issues or need guidance? Message our admin team directly.</p>
            <button
              onClick={() => setActiveChatUser({ _id: 'admin', name: 'ILRAS Admin' })}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
              <span>Contact Admin</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <button onClick={() => setSelectedCourse(null)} className={`flex items-center transition-colors mb-4 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Back to Dashboard
          </button>

          <div className={`rounded-2xl p-8 border shadow-xl flex flex-col md:flex-row gap-8 ${theme === 'dark' ? 'bg-[#131825] border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="md:w-1/3">
              <img src={selectedCourse.thumbnail} alt={selectedCourse.title} className={`w-full rounded-xl shadow-lg border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`} />

              <div className={`mt-6 p-4 rounded-xl border flex flex-col h-[400px] ${theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`flex rounded-lg p-1 mb-4 shrink-0 ${theme === 'dark' ? 'bg-black/40' : 'bg-gray-200'}`}>
                  <button
                    onClick={() => setChatMode('direct')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${chatMode === 'direct' ? 'bg-blue-600 text-white' : (theme === 'dark' ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-white')}`}
                  >
                    Direct Faculty
                  </button>
                  <button
                    onClick={() => setChatMode('group')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${chatMode === 'group' ? 'bg-indigo-600 text-white' : (theme === 'dark' ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-white')}`}
                  >
                    Course Group
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto mb-3 space-y-3 pr-2 custom-scrollbar">
                  {chatMode === 'direct' ? (
                    directMessages.length === 0 ? (
                      <div className="text-center mt-10">
                        <p className="text-sm text-gray-400">Your direct messages with the instructor are private.</p>
                        <svg className="w-10 h-10 text-gray-700 mx-auto mt-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                      </div>
                    ) : (
                      directMessages.map((msg, idx) => {
                        const isMe = instructorUser ? msg.senderId !== instructorUser._id : (msg.sender && msg.sender.role === 'student') || !msg.receiverId || msg.receiverId === (selectedCourse.instructorId || selectedCourse.instructor) || msg.receiverId === 'group';
                        return (
                          <div key={idx} className={`flex flex-col space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-xl text-xs ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : (theme === 'dark' ? 'bg-white/10 text-white rounded-tl-none' : 'bg-gray-200 text-gray-800 rounded-tl-none')}`}>
                              {msg.content}
                            </div>
                          </div>
                        );
                      })
                    )
                  ) : (
                    groupMessages.length === 0 ? (
                      <div className="text-center mt-10 text-xs text-gray-500 font-medium">No messages in this group yet.</div>
                    ) : (
                      groupMessages.map((msg, idx) => (
                        <div key={idx} className="flex space-x-2">
                          <img src={msg.sender?.picture || `https://ui-avatars.com/api/?name=${msg.sender?.name}`} alt="avatar" className={`w-6 h-6 rounded-full shrink-0 border mt-1 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`} />
                          <div>
                            <p className={`text-[10px] font-bold mb-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{msg.sender?.name} {msg.sender?.role === 'faculty' && <span className="bg-indigo-500/20 text-indigo-400 text-[9px] px-1 rounded ml-1 border border-indigo-500/30">Faculty</span>}</p>
                            <div className={`text-xs px-3 py-2 rounded-lg ${msg.sender?.role === 'faculty' ? 'bg-indigo-600 text-white rounded-tl-none' : (theme === 'dark' ? 'bg-gray-800 text-gray-200 rounded-tl-none' : 'bg-white border text-gray-800 rounded-tl-none')}`}>
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      ))
                    )
                  )}
                </div>

                <div className="shrink-0 space-y-2 mt-auto">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={chatMode === 'group' ? "Message everyone..." : "Message instructor..."}
                    className={`w-full border rounded-lg p-2.5 text-xs focus:border-blue-500 focus:outline-none resize-none h-16 ${theme === 'dark' ? 'bg-[#1a2035] border-gray-700 text-white' : 'bg-white border-gray-300'}`}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isSendingMessage}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition-colors text-xs"
                  >
                    {isSendingMessage ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </div>
            </div>

            <div className="md:w-2/3 flex flex-col">
              <h1 className="text-3xl font-extrabold mb-2">{selectedCourse.title}</h1>
              <p className="text-gray-500 mb-6 font-medium">Instructor: {selectedCourse.instructor}</p>

              <div className="flex-1">
                <h2 className="text-xl font-bold mb-4 border-b pb-2">Course Resources</h2>
                {courseResources.length === 0 ? (
                  <div className="border rounded-xl p-8 text-center text-gray-400">
                    <p>No resources uploaded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {courseResources.map((resource, i) => (
                      <div key={i} className="p-4 rounded-xl border flex items-center justify-between group transition-all hover:shadow-md">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-lg ${resource.fileType === 'pdf' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                            {resource.fileType === 'pdf' ? (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                            ) : (
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm10 8l-6-4v8l6-4z"></path></svg>
                            )}
                          </div>
                          <div>
                            <h5 className="font-bold text-sm">{resource.title}</h5>
                            <p className="text-[10px] text-gray-500 mt-1">{resource.fileType.toUpperCase()}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleToggleBookmark(resource._id)}
                            className={`p-2 rounded-full ${bookmarkedResources.includes(resource._id) ? 'text-yellow-500 bg-yellow-500/10' : 'text-gray-400'}`}
                          >
                            <svg className="w-5 h-5" fill={bookmarkedResources.includes(resource._id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                            </svg>
                          </button>
                          {resource.fileType === 'video' ? (
                            <button
                              onClick={() => {
                                let url = resource.youtubeLink;
                                if (url && url.includes('watch?v=')) {
                                  url = url.replace('watch?v=', 'embed/');
                                }
                                setActiveVideoUrl(url);
                              }}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded"
                            >
                              Watch Video
                            </button>
                          ) : (
                            <a href={resource.link || (resource.fileUrl ? `http://localhost:5000${resource.fileUrl}` : '#')} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded">
                              View Content
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="relative w-full max-w-4xl h-3/4 bg-gray-900 rounded-lg">
            <button onClick={() => setActiveVideoUrl(null)} className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-2 z-10">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <iframe src={activeVideoUrl} title="Video" allowFullScreen className="w-full h-full rounded-lg"></iframe>
          </div>
        </div>
      )}

      {activeChatUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[500px] ${theme === 'dark' ? 'bg-[#1a1f2e] border border-white/10' : 'bg-white border border-gray-200'}`}>
            <div className={`p-4 border-b flex justify-between items-center ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-600 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                </div>
                <div>
                  <h4 className="font-bold text-sm">ILRAS Admin Support</h4>
                  <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span> Online
                  </p>
                </div>
              </div>
              <button onClick={() => setActiveChatUser(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {adminMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.senderId === 'admin' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${msg.senderId === 'admin' ? (theme === 'dark' ? 'bg-gray-800 text-white rounded-tl-none' : 'bg-gray-100 text-slate-800 rounded-tl-none') : 'bg-indigo-600 text-white rounded-tr-none'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type message..."
                  className={`flex-1 p-2.5 rounded-xl text-xs border focus:ring-2 focus:ring-indigo-500 ${theme === 'dark' ? 'bg-gray-900 border-white/10 text-white' : 'bg-white border-gray-300'}`}
                />
                <button
                  onClick={handleSendAdminMessage}
                  disabled={isSendingMessage || !messageText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-all"
                >
                  <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentDashboard;