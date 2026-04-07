import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTheme } from '../context/ThemeContext';

const AITutor = () => {
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'ai', text: "Hi! I'm your AI Study Assistant ✨. How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Chat History State
    const [currentChatId, setCurrentChatId] = useState(null);
    const [chats, setChats] = useState([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen && !isHistoryOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, isHistoryOpen]);

    useEffect(() => {
        if (isOpen && isHistoryOpen) {
            fetchHistory();
        }
    }, [isOpen, isHistoryOpen]);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('userToken');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/ai/history`, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            if (res.data.success) {
                setChats(res.data.chats);
            }
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    };

    const loadChat = async (id) => {
        try {
            const token = localStorage.getItem('userToken');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/ai/history/${id}`, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            if (res.data.success) {
                setCurrentChatId(id);
                setMessages(res.data.chat.messages.map(m => ({
                    sender: m.role,
                    text: m.content
                })));
                setIsHistoryOpen(false);
            }
        } catch (error) {
            console.error("Failed to load chat", error);
        }
    };

    const deleteChat = async (id, e) => {
        e.stopPropagation();
        try {
            const token = localStorage.getItem('userToken');
            await axios.delete(`${import.meta.env.VITE_API_URL}/ai/history/${id}`, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            setChats(chats.filter(c => c._id !== id));
            if (currentChatId === id) {
                startNewChat();
            }
        } catch (error) {
            console.error("Failed to delete chat", error);
        }
    };

    const startNewChat = () => {
        setCurrentChatId(null);
        setMessages([{ sender: 'ai', text: "Hi! I'm your AI Study Assistant ✨. How can I help you today?" }]);
        setIsHistoryOpen(false);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userText = input.trim();
        const newMessages = [...messages, { sender: 'user', text: userText }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem('userToken');
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/ai/ask`, 
                { prompt: userText, chatId: currentChatId }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setMessages([...newMessages, { sender: 'ai', text: response.data.answer }]);
                if (!currentChatId && response.data.chatId) {
                    setCurrentChatId(response.data.chatId);
                }
            } else {
                setMessages([...newMessages, { sender: 'ai', text: "Sorry, I couldn't process that request." }]);
            }
        } catch (error) {
            console.error("AI Error:", error);
            const errorMessage = error.response?.data?.message || "Error connecting to AI Assistant. Please try again later.";
            setMessages([...newMessages, { sender: 'ai', text: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    const isDark = theme === 'dark';

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className={`mb-4 w-80 sm:w-96 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${isDark ? 'bg-[#151c2c] border border-gray-700' : 'bg-white border border-gray-200'}`} style={{ height: '500px' }}>
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">✨</span>
                            <h3 className="font-semibold text-sm sm:text-base">AI Assistant</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} title="History" className={`p-1.5 rounded-md transition-colors ${isHistoryOpen ? 'bg-white/20' : 'hover:bg-white/10'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </button>
                            <button onClick={startNewChat} title="New Chat" className="p-1.5 rounded-md hover:bg-white/10 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                            </button>
                            <button onClick={() => setIsOpen(false)} title="Close" className="p-1.5 rounded-md hover:bg-white/10 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                    </div>

                    {isHistoryOpen ? (
                        // History Area
                        <div className={`flex-1 p-4 overflow-y-auto ${isDark ? 'bg-[#0f141e]' : 'bg-slate-50'}`}>
                            <h4 className={`text-sm font-semibold mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Chat History</h4>
                            {chats.length === 0 ? (
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No previous chats.</p>
                            ) : (
                                <div className="space-y-2">
                                    {chats.map(chat => (
                                        <div key={chat._id} className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-white hover:bg-gray-100 border border-gray-200 text-gray-800'} ${currentChatId === chat._id ? 'border-l-4 border-l-blue-500' : ''}`} onClick={() => loadChat(chat._id)}>
                                            <div className="truncate flex-1 mr-2 text-sm font-medium">
                                                {chat.title}
                                            </div>
                                            <button onClick={(e) => deleteChat(chat._id, e)} className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors" title="Delete Chat">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        // Messages Area
                        <>
                            <div className={`flex-1 p-4 overflow-y-auto space-y-4 ${isDark ? 'bg-[#0f141e]' : 'bg-slate-50'}`}>
                                {messages.map((msg, index) => (
                                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                                            msg.sender === 'user' 
                                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                                : isDark 
                                                    ? 'bg-gray-800 text-gray-200 rounded-tl-none' 
                                                    : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-sm'
                                        }`}>
                                            {msg.sender === 'ai' ? (
                                                <div className={`space-y-2 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_a]:underline hover:[&_a]:opacity-80 transition-opacity [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto ${isDark ? '[&_a]:text-blue-400 [&_code]:bg-gray-700' : '[&_a]:text-blue-600 [&_code]:bg-gray-100'}`}>
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {msg.text}
                                                    </ReactMarkdown>
                                                </div>
                                            ) : (
                                                msg.text
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className={`max-w-[80%] p-3 rounded-2xl rounded-tl-none ${isDark ? 'bg-gray-800' : 'bg-white border border-gray-200 shadow-sm'}`}>
                                            <div className="flex gap-1.5 items-center h-5">
                                                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                                                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className={`p-3 border-t ${isDark ? 'bg-[#151c2c] border-gray-700' : 'bg-white border-gray-200'}`}>
                                <form onSubmit={sendMessage} className="flex gap-2 relative">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask a question..."
                                        className={`flex-1 py-2 px-4 rounded-full text-sm outline-none transition-colors pr-10 ${
                                            isDark 
                                                ? 'bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:border-blue-500' 
                                                : 'bg-gray-100 text-gray-800 placeholder-gray-500 border border-transparent focus:border-blue-500 focus:bg-white'
                                        }`}
                                        disabled={isLoading}
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={isLoading || !input.trim()}
                                        className={`absolute right-1 top-1 bottom-1 w-8 flex items-center justify-center rounded-full text-white transition-colors ${
                                            isLoading || !input.trim() 
                                                ? 'bg-blue-400 cursor-not-allowed' 
                                                : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-transform hover:scale-105 ${
                    isOpen ? 'bg-gray-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                }`}
            >
                {isOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                ) : (
                    <span className="text-2xl">✨</span>
                )}
            </button>
        </div>
    );
};

export default AITutor;
