import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

const Analytics = () => {
    const { theme } = useTheme();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState({
        summary: {
            totalStudyHours: 0,
            averageScore: 0,
            certificatesEarned: 0,
            studyHoursTrend: "+0%",
            scoreTrend: "+0%"
        },
        recentAssessments: [],
        chartData: []
    });

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem('userToken');
                const config = { headers: { Authorization: `Bearer ${token}` } };


                const res = await axios.get('http://localhost:5000/api/analytics/student', config);
                setData(res.data);
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    const chartColor = theme === 'dark' ? '#3b82f6' : '#2563eb';
    const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-0">
            {/* HEADER SECTION */}
            <div className={`mb-8 border-b pb-6 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                <h1 className={`text-3xl font-extrabold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Performance Analytics</h1>
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Track your learning progress, hours, and assessment scores.</p>
            </div>

            {/* STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Total Study Hours */}
                <div className={`p-6 rounded-2xl border shadow-xl relative overflow-hidden group transition-all ${theme === 'dark' ? 'bg-[#131825] border-gray-800 hover:border-blue-500' : 'bg-white border-gray-100 hover:border-blue-500'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-400 font-semibold mb-1">Total Study Hours</p>
                            <h3 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{isLoading ? '...' : data.summary.totalStudyHours}</h3>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                    </div>
                    <div className="flex items-center text-sm font-semibold">
                        <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                        <span className="text-green-500">{data.summary.studyHoursTrend}</span>
                        <span className="text-gray-500 ml-2 text-xs">from last month</span>
                    </div>
                </div>

                {/* Average Score */}
                <div className={`p-6 rounded-2xl border shadow-xl relative overflow-hidden group transition-all ${theme === 'dark' ? 'bg-[#131825] border-gray-800 hover:border-purple-500' : 'bg-white border-gray-100 hover:border-purple-500'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-400 font-semibold mb-1">Average Score</p>
                            <h3 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{isLoading ? '...' : data.summary.averageScore}%</h3>
                        </div>
                        <div className="p-3 bg-purple-500/10 rounded-xl">
                            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                        </div>
                    </div>
                    <div className="flex items-center text-sm font-semibold">
                        <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                        <span className="text-green-500">{data.summary.scoreTrend}</span>
                        <span className="text-gray-500 ml-2 text-xs">from last month</span>
                    </div>
                </div>

                {/* Certificates */}
                <div className={`p-6 rounded-2xl border shadow-xl relative overflow-hidden group transition-all ${theme === 'dark' ? 'bg-[#131825] border-gray-800 hover:border-pink-500' : 'bg-white border-gray-100 hover:border-pink-500'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-400 font-semibold mb-1">Certificates Earned</p>
                            <h3 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{isLoading ? '...' : data.summary.certificatesEarned}</h3>
                        </div>
                        <div className="p-3 bg-pink-500/10 rounded-xl">
                            <svg className="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>
                        </div>
                    </div>
                    <div className="flex items-center text-sm font-semibold">
                        <span className="text-gray-500 text-xs text-mono">Tracked across all courses</span>
                    </div>
                </div>
            </div>

            {/* CHART SECTION */}
            <div className={`p-8 rounded-2xl border shadow-xl mb-8 min-h-[400px] flex flex-col ${theme === 'dark' ? 'bg-[#131825] border-gray-800' : 'bg-white border-gray-100'}`}>
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Study Activity</h3>
                        <p className="text-gray-500 text-sm">Learning hours per day (Last 7 days)</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Hours</span>
                    </div>
                </div>

                <div className="flex-1 w-full h-[300px] relative">
                    {isLoading ? (
                        <div className="h-full w-full flex items-center justify-center text-gray-500 font-bold uppercase tracking-widest animate-pulse italic">
                            Collecting Data Points...
                        </div>
                    ) : (
                        <div className="w-full h-full pt-4">
                            {/* Custom SVG Chart */}
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 700 300" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="100%">
                                        <stop offset="0%" stopColor={chartColor} stopOpacity="0.4" />
                                        <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
                                    </linearGradient>
                                </defs>

                                {/* Grid Lines */}
                                {[0, 25, 50, 75, 100].map((tick) => (
                                    <g key={tick}>
                                        <line x1="0" y1={300 - (tick * 3)} x2="700" y2={300 - (tick * 3)} stroke={gridColor} strokeWidth="1" />
                                        <text x="-35" y={305 - (tick * 3)} className="text-[10px] fill-gray-500 font-bold">{tick / 10}h</text>
                                    </g>
                                ))}

                                {/* The Area Path */}
                                <path
                                    d={`M 0 300 ${data.chartData.map((d, i) => `L ${(i * 115)} ${300 - (d.hours * 30)}`).join(' ')} L 690 300 Z`}
                                    fill="url(#areaGradient)"
                                />

                                {/* The Line Path */}
                                <path
                                    d={`M 0 ${300 - (data.chartData[0]?.hours * 30 || 0)} ${data.chartData.map((d, i) => `L ${(i * 115)} ${300 - (d.hours * 30)}`).join(' ')}`}
                                    fill="none"
                                    stroke={chartColor}
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />

                                {/* Data Points */}
                                {data.chartData.map((d, i) => (
                                    <g key={i}>
                                        <circle cx={i * 115} cy={300 - (d.hours * 30)} r="6" fill={theme === 'dark' ? '#131825' : '#fff'} stroke={chartColor} strokeWidth="3" />
                                        <text x={i * 115} y="325" textAnchor="middle" className="text-[12px] fill-gray-500 font-bold uppercase">{d.day}</text>
                                        <text x={i * 115} y={300 - (d.hours * 30) - 15} textAnchor="middle" className={`text-[12px] font-black ${theme === 'dark' ? 'fill-blue-400' : 'fill-blue-600'}`}>{d.hours}h</text>
                                    </g>
                                ))}
                            </svg>
                        </div>
                    )}
                </div>
            </div>

            {/* RECENT ASSESSMENTS */}
            <div className={`rounded-2xl border shadow-xl overflow-hidden ${theme === 'dark' ? 'bg-[#131825] border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className={`p-6 border-b flex justify-between items-center ${theme === 'dark' ? 'border-gray-800 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                    <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Recent Assessment Scores</h3>
                </div>

                <div className={`divide-y ${theme === 'dark' ? 'divide-gray-800' : 'divide-gray-100'}`}>
                    {isLoading ? (
                        <div className="p-10 text-center text-gray-500 font-bold uppercase tracking-widest">Loading Assessments...</div>
                    ) : data.recentAssessments.length === 0 ? (
                        <div className="p-10 text-center text-gray-500 font-bold uppercase tracking-widest italic">No assessments submitted yet.</div>
                    ) : (
                        data.recentAssessments.map(assessment => (
                            <div key={assessment._id} className={`p-6 flex items-center justify-between transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                                <div className="flex items-center space-x-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${assessment.color}-500/10 text-${assessment.color}-500 border border-${assessment.color}-500/20`}>
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className={`text-lg font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{assessment.name}</h4>
                                        <p className="text-sm text-gray-500">Completed on {new Date(assessment.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{assessment.score}%</div>
                                    <div className={`text-xs font-black uppercase tracking-wider mt-1 text-${assessment.color}-500`}>{assessment.status}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
