import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

const Saved = () => {
    const { theme } = useTheme();
    const [savedResources, setSavedResources] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState('all'); // 'all', 'video', 'document'

    useEffect(() => {
        const fetchSavedResources = async () => {
            try {
                const token = localStorage.getItem('userToken');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                // Fetch actual bookmarks instead of generic global resources
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/dashboard-data/bookmarks`, config);
                // The API populates the savedResources array, so we get an array of Resource objects
                setSavedResources(res.data);
            } catch (error) {
                console.error("Failed to load bookmarks:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSavedResources();
    }, []);

    const removeBookmark = async (resourceId) => {
        try {
            const token = localStorage.getItem('userToken');
            await axios.delete(`${import.meta.env.VITE_API_URL}/dashboard-data/bookmarks/${resourceId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSavedResources(savedResources.filter(r => r._id !== resourceId));
        } catch (err) {
            console.error("Failed to remove bookmark", err);
        }
    };

    // Helper map to standard thumbnail icons if user doesn't upload image
    const getThumbnail = (type) => {
        if (type === 'video') return 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
        if (type === 'pdf') return 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
        return 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* HEADER */}
            <div className={`flex justify-between items-center mb-8 border-b pb-6 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                <div>
                    <h1 className={`text-3xl font-extrabold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Bookmarked Resources</h1>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Your collection of saved videos, articles, and documents.</p>
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={() => setFilterType('all')}
                        className={`px-4 py-2 rounded-lg border font-semibold text-sm transition-colors shadow-sm ${filterType === 'all' ? (theme === 'dark' ? 'bg-[#1a2035] text-white border-gray-700 hover:border-blue-500' : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700') : (theme === 'dark' ? 'bg-[#131825] text-gray-400 border-gray-800 hover:text-white' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50')}`}
                    >
                        All Types
                    </button>
                    <button
                        onClick={() => setFilterType('video')}
                        className={`px-4 py-2 rounded-lg border font-semibold text-sm transition-colors ${filterType === 'video' ? (theme === 'dark' ? 'bg-[#1a2035] text-white border-gray-700 hover:border-blue-500' : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700') : (theme === 'dark' ? 'bg-[#131825] text-gray-400 border-gray-800 hover:text-white' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50')}`}
                    >
                        Videos
                    </button>
                    <button
                        onClick={() => setFilterType('document')}
                        className={`px-4 py-2 rounded-lg border font-semibold text-sm transition-colors ${filterType === 'document' ? (theme === 'dark' ? 'bg-[#1a2035] text-white border-gray-700 hover:border-blue-500' : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700') : (theme === 'dark' ? 'bg-[#131825] text-gray-400 border-gray-800 hover:text-white' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50')}`}
                    >
                        Articles
                    </button>
                </div>
            </div>

            {/* GRID */}
            {isLoading ? (
                <div className={`p-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Loading resources...</div>
            ) : savedResources.filter(r => filterType === 'all' || (filterType === 'document' ? r.fileType === 'pdf' : r.fileType === 'video')).length === 0 ? (
                <div className={`p-4 border rounded-xl ${theme === 'dark' ? 'text-gray-400 border-gray-800 bg-[#131825]' : 'text-gray-500 border-gray-200 bg-white shadow-sm'}`}>No resources match this filter.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {savedResources.filter(r => filterType === 'all' || (filterType === 'document' ? r.fileType === 'pdf' : r.fileType === 'video')).map((resource) => (
                        <div key={resource._id} className={`rounded-2xl border overflow-hidden shadow-xl group transition-colors flex flex-col ${theme === 'dark' ? 'bg-[#131825] border-gray-800 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-400'}`}>

                            {/* THUMBNAIL AREA */}
                            <div className={`h-48 relative overflow-hidden border-b ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-200'}`}>
                                <img
                                    src={getThumbnail(resource.fileType)}
                                    alt={resource.title}
                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                />

                                {/* Type Badge */}
                                <div className="absolute top-4 left-4">
                                    <span className="bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-md border border-white/10 uppercase tracking-widest flex items-center">
                                        {resource.fileType === 'video' && <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>}
                                        {resource.fileType === 'pdf' && <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path></svg>}
                                        {resource.fileType !== 'video' && resource.fileType !== 'pdf' && <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v2H5V6zm6 6H5v2h6v-2z" clipRule="evenodd"></path></svg>}
                                        {resource.fileType}
                                    </span>
                                </div>

                                {/* Play Button Overlay for Videos */}
                                {resource.fileType === 'video' && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:bg-blue-500 group-hover:border-blue-400 group-hover:text-white text-white/80 transition-all duration-300">
                                            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* CONTENT AREA */}
                            <div className="p-6 flex-1 flex flex-col cursor-pointer">
                                <h3 className={`text-xl font-bold mb-2 leading-tight transition-colors ${theme === 'dark' ? 'text-white group-hover:text-blue-400' : 'text-slate-800 group-hover:text-blue-600'}`}>{resource.title}</h3>
                                <p className={`text-sm font-medium mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{resource.subject} • {resource.difficulty}</p>

                                <div className="mt-6 flex space-x-3 pt-6 border-t border-gray-800/50">
                                    <a
                                        href={resource.youtubeLink || (resource.fileUrl ? `${import.meta.env.VITE_API_URL}${resource.fileUrl}` : resource.link)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2.5 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-blue-500/20"
                                    >
                                        {resource.fileType === 'video' ? 'Watch Video' : 'Read Article'}
                                    </a>
                                    <button
                                        onClick={() => removeBookmark(resource._id)}
                                        className={`p-2.5 rounded-lg border transition-colors ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-800 text-gray-400 hover:text-white' : 'border-gray-300 hover:bg-gray-100 text-gray-500 hover:text-slate-800'}`}
                                        title="Remove Bookmark"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                                    </button>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            )}

        </div>
    );
};

export default Saved;
