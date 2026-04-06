import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

const Schedule = () => {
    const { theme } = useTheme();
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];

    const [classes, setClasses] = useState([]);
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Week Navigation State
    const [currentDate, setCurrentDate] = useState(() => {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to get Monday
        return new Date(today.setDate(diff));
    });

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState({ day: '', time: '' });

    // Form State
    const [formData, setFormData] = useState({
        courseId: '',
        duration: 1,
        type: 'Lecture',
        color: 'from-blue-600 to-blue-800'
    });

    useEffect(() => {
        const fetchScheduleData = async () => {
            try {
                const token = localStorage.getItem('userToken');
                const config = { headers: { Authorization: `Bearer ${token}` } };

                const [timetableRes, coursesRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/dashboard-data/timetable', config),
                    axios.get('http://localhost:5000/api/courses', config)
                ]);

                setClasses(timetableRes.data);
                setCourses(coursesRes.data);
            } catch (error) {
                console.error("Failed to fetch timetable data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchScheduleData();
    }, []);

    const handleSlotClick = (day, time) => {
        setSelectedSlot({ day, time });
        setIsModalOpen(true);
    };

    const handleAddClass = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('userToken');
            const selectedCourse = courses.find(c => c._id === formData.courseId);

            if (!selectedCourse) return alert('Please select a course');

            const newBlock = {
                courseId: selectedCourse._id,
                title: selectedCourse.title,
                day: selectedSlot.day,
                start: selectedSlot.time,
                duration: formData.duration,
                type: formData.type,
                color: formData.color
            };

            const res = await axios.post('http://localhost:5000/api/dashboard-data/timetable', newBlock, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setClasses(res.data.timetable);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving timetable block", error);
            
            // Show explicit error to user so they know WHY it failed
            const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
            alert(`Failed to add class to timetable: ${errorMsg}. Please try reloading the page or logging out and back in.`);
        }
    };

    const handleRemoveClass = async (blockId, e) => {
        e.stopPropagation();
        try {
            const token = localStorage.getItem('userToken');
            const res = await axios.delete(`http://localhost:5000/api/dashboard-data/timetable/${blockId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClasses(res.data.timetable);
        } catch (error) {
            console.error("Error removing timetable block", error);
        }
    };

    // Helper to check if a class exists at a specific day/time
    const getClass = (day, timeStr) => {
        return classes.find(c => c.day === day && c.start === timeStr);
    };

    // Helper to check if a slot is blocked by a multi-hour class
    const isBlocked = (day, timeIndex) => {
        for (const c of classes) {
            if (c.day !== day) continue;

            const startIdx = timeSlots.indexOf(c.start);
            if (startIdx === -1) continue;

            if (timeIndex > startIdx && timeIndex < startIdx + c.duration) {
                return true; // This slot is covered by a longer class
            }
        }
        return false;
    };

    // Week Navigation Helpers
    const handlePrevWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    const formatWeekRange = () => {
        const monday = new Date(currentDate);
        const friday = new Date(currentDate);
        friday.setDate(monday.getDate() + 4);

        const options = { month: 'short', day: 'numeric' };
        const monStr = monday.toLocaleDateString('en-US', options);
        const friStr = friday.toLocaleDateString('en-US', options);
        const year = friday.getFullYear();

        return `${monStr} - ${friStr}, ${year}`;
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-white mb-2">Weekly Timetable</h1>
                    <p className="text-gray-400">Plan your week and manage your scheduled classes.</p>
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={handlePrevWeek}
                        className={`p-2 rounded-lg transition-colors border shadow-sm ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700' : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <div className={`flex items-center px-4 border rounded-lg text-sm font-bold shadow-sm ${theme === 'dark' ? 'bg-[#131825] border-gray-800 text-white' : 'bg-white border-gray-200 text-slate-700'}`}>
                        {formatWeekRange()}
                    </div>
                    <button
                        onClick={handleNextWeek}
                        className={`p-2 rounded-lg transition-colors border shadow-sm ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700' : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                </div>
            </div>

            {/* CALENDAR GRID */}
            {isLoading ? (
                <div className={`text-center py-20 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Loading timetable...</div>
            ) : (
                <div className={`rounded-2xl border shadow-xl overflow-hidden overflow-x-auto ${theme === 'dark' ? 'bg-[#131825] border-gray-800' : 'bg-white border-gray-200'}`}>
                    <div className="min-w-[800px]">

                        {/* Header Row (Days) */}
                        <div className={`grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr] border-b ${theme === 'dark' ? 'bg-[#1a2035] border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                            <div className={`p-4 border-r ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}></div>
                            {days.map(day => (
                                <div key={day} className={`p-4 border-r text-center last:border-0 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                                    <span className={`text-sm font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}`}>{day}</span>
                                </div>
                            ))}
                        </div>

                        {/* Time Rows */}
                        <div className="divide-y divide-gray-800/50">
                            {timeSlots.map((time, timeIdx) => (
                                <div key={time} className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr]">

                                    {/* Time Column */}
                                    <div className="p-4 border-r border-gray-800 flex items-center justify-center bg-[#1a2035]/50">
                                        <span className="text-[10px] font-bold text-gray-500">{time}</span>
                                    </div>

                                    {/* Day Columns for this Time Slot */}
                                    {days.map(day => {
                                        const classInfo = getClass(day, time);
                                        const isSlotBlocked = isBlocked(day, timeIdx);

                                        // If slot is blocked by previous class spanning over, render nothing
                                        if (isSlotBlocked) return <div key={`${day}-${time}`} className={`border-r hidden ${theme === 'dark' ? 'border-gray-800 bg-[#0f1423]/30' : 'border-gray-200 bg-gray-50/50'}`} />;

                                        // If there is a class starting here
                                        if (classInfo) {
                                            return (
                                                <div
                                                    key={`${day}-${time}`}
                                                    className={`p-2 border-r relative z-10 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}
                                                    style={{ gridRowEnd: `span ${classInfo.duration}` }}
                                                >
                                                    <div className={`h-full w-full bg-gradient-to-br ${classInfo.color} rounded-xl p-3 shadow-lg flex flex-col justify-center border border-white/10 hover:scale-[1.02] transition-transform cursor-pointer relative overflow-hidden group`}>

                                                        {/* Decorative pattern mask for the block */}
                                                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')]"></div>

                                                        <div className="relative z-10">
                                                            <div className="flex justify-between items-start">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1 block">{classInfo.type}</span>
                                                                <button
                                                                    onClick={(e) => handleRemoveClass(classInfo._id, e)}
                                                                    className="opacity-0 group-hover:opacity-100 text-white/50 hover:text-white transition-opacity p-1"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                                </button>
                                                            </div>
                                                            <h4 className="text-sm md:text-md font-bold text-white leading-tight mb-2 pr-4">{classInfo.title}</h4>
                                                            <div className="flex items-center text-xs text-white/80 font-medium">
                                                                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                                {classInfo.duration} hr{classInfo.duration > 1 ? 's' : ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // Empty Slot
                                        return (
                                            <div
                                                key={`${day}-${time}`}
                                                onClick={() => handleSlotClick(day, time)}
                                                className={`p-4 border-r last:border-0 transition-colors cursor-pointer group flex items-center justify-center ${theme === 'dark' ? 'border-gray-800 hover:bg-[#1a2035]' : 'border-gray-200 hover:bg-gray-50'}`}
                                            >
                                                <span className={`opacity-0 group-hover:opacity-100 text-[10px] font-bold transition-opacity ${theme === 'dark' ? 'text-gray-500' : 'text-blue-500'}`}>+ Add</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            )}

            {/* ADD CLASS MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl relative ${theme === 'dark' ? 'bg-[#131825] border border-gray-800 text-white' : 'bg-white text-slate-800'}`}>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>

                        <h2 className="text-2xl font-bold mb-1">Add to Schedule</h2>
                        <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Scheduling for {selectedSlot.day} at {selectedSlot.time}</p>

                        <form onSubmit={handleAddClass} className="space-y-4">
                            <div>
                                <label className={`block text-xs font-bold mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>SELECT COURSE</label>
                                <select
                                    required
                                    value={formData.courseId}
                                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                                    className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-[#1a2035] border-gray-700 text-white' : 'bg-white border-gray-300'}`}
                                >
                                    <option value="" disabled>Choose a course...</option>
                                    {courses.map(c => (
                                        <option key={c._id} value={c._id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex space-x-4">
                                <div className="flex-1">
                                    <label className={`block text-xs font-bold mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>DURATION (HRS)</label>
                                    <input
                                        type="number"
                                        min="1" max="4" required
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                                        className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-[#1a2035] border-gray-700 text-white' : 'bg-white border-gray-300'}`}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className={`block text-xs font-bold mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>TYPE</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-[#1a2035] border-gray-700 text-white' : 'bg-white border-gray-300'}`}
                                    >
                                        <option value="Lecture">Lecture</option>
                                        <option value="Lab">Lab</option>
                                        <option value="Seminar">Seminar</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className={`block text-xs font-bold mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>COLOR THEME</label>
                                <div className="flex space-x-3">
                                    {[
                                        'from-blue-600 to-blue-800',
                                        'from-purple-600 to-purple-800',
                                        'from-green-600 to-green-800',
                                        'from-pink-600 to-pink-800',
                                        'from-yellow-500 to-orange-600'
                                    ].map(color => (
                                        <button
                                            key={color} type="button"
                                            onClick={() => setFormData({ ...formData, color })}
                                            className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} transition-transform ${formData.color === color ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-70 hover:opacity-100'}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors mt-6 shadow-lg shadow-blue-500/20">
                                Add to Timetable
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Schedule;
