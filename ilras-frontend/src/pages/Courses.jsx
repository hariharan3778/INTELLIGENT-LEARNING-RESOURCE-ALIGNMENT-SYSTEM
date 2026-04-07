import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Courses = () => {
    const [department, setDepartment] = useState('CSBS');
    const [semester, setSemester] = useState('5');
    const [curriculumData, setCurriculumData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const departments = ['CSBS', 'CSE', 'IT', 'ECE', 'EEE', 'MECH'];
    const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

    useEffect(() => {
        fetchCurriculum();
    }, [department, semester]);

    const fetchCurriculum = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('userToken');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/curriculum?department=${department}&semester=${semester}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCurriculumData(res.data);
        } catch (error) {
            console.error('Error fetching curriculum:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSeedData = async () => {
        try {
            const token = localStorage.getItem('userToken');
            await axios.post(`${import.meta.env.VITE_API_URL}/curriculum/seed`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Database seeded successfully! Refreshing data...');
            fetchCurriculum();
        } catch (error) {
            console.error('Error seeding data:', error);
            alert('Failed to seed database.');
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-800 pb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white mb-2">Curriculum Explorer</h1>
                    <p className="text-gray-400">Browse courses by department and semester.</p>
                </div>

                {/* DEV ONLY: Seed Button */}
                <button
                    onClick={handleSeedData}
                    className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded transition-colors border border-gray-700"
                >
                    Development: Seed Database
                </button>
            </div>

            {/* FILTERS */}
            <div className="bg-[#131825] p-6 rounded-2xl border border-gray-800 mb-8 flex flex-col sm:flex-row gap-6 items-center shadow-lg">
                <div className="w-full sm:w-1/2">
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Select Department</label>
                    <div className="relative">
                        <select
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full appearance-none bg-[#1a2035] border border-gray-700 text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer font-medium"
                        >
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept} Engineering</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                <div className="w-full sm:w-1/2">
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Select Semester</label>
                    <div className="relative">
                        <select
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            className="w-full appearance-none bg-[#1a2035] border border-gray-700 text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer font-medium"
                        >
                            {semesters.map(sem => (
                                <option key={sem} value={sem}>Semester {sem}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* RESULTS TABLE */}
            <div className="bg-[#131825] rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-[#1a2035] border-b border-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-bold tracking-wider">Course Code</th>
                                <th scope="col" className="px-6 py-4 font-bold tracking-wider">Course Name</th>
                                <th scope="col" className="px-6 py-4 font-bold tracking-wider">Type</th>
                                <th scope="col" className="px-6 py-4 font-bold tracking-wider text-center">Credits</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <svg className="animate-spin h-8 w-8 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Loading curriculum data...
                                        </div>
                                    </td>
                                </tr>
                            ) : curriculumData.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <svg className="w-12 h-12 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            <p className="text-lg font-medium text-gray-300">No courses found</p>
                                            <p className="text-sm mt-1">There are no courses assigned for {department} Semester {semester} yet.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                curriculumData.map((course, idx) => (
                                    <tr key={course._id} className={`border-b border-gray-800 hover:bg-[#1a2035] transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[#0f1423]'}`}>
                                        <td className="px-6 py-4 font-semibold text-blue-400">{course.courseCode}</td>
                                        <td className="px-6 py-4 font-bold text-white">{course.courseName}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${course.type === 'Core'
                                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                : 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                }`}>
                                                {course.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-center text-gray-300">{course.credits}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Courses;
