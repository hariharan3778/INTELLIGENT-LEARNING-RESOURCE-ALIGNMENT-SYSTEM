const fs = require('fs');
let content = fs.readFileSync('src/pages/FacultyDashboard.jsx', 'utf8');

content = content.replace(
    /import React, \{ useState, useEffect \} from 'react';\r?\nimport axios from 'axios';/g,
    `import React, { useState, useEffect } from 'react';\nimport axios from 'axios';\nimport { useTheme } from '../context/ThemeContext';`
);

content = content.replace(
    /const FacultyDashboard = \(\) => \{\r?\n  const \[userName/g,
    `const FacultyDashboard = () => {\n  const { theme, toggleTheme } = useTheme();\n  const [userName`
);

content = content.replace(
    /<div className=\"min-h-screen p-4 md:p-8 bg-\[\#0b0f19\] bg-\[radial-gradient\(ellipse_at_top_right,_var\(--tw-gradient-stops\)\)\] from-indigo-900\/20 via-\[\#0b0f19\] to-black text-white space-y-10 font-sans\">/g,
    `<div className={\`min-h-screen font-sans transition-colors duration-500 \${theme === 'dark' ? 'bg-[#0b0f19] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0b0f19] to-black text-white' : 'bg-[#f8fafc] text-slate-800'}\`}>`
);

content = content.replace(
    /      \{\/\* Toast Notification \*\/\}/g,
    `      {/* Toast Notification */}`
);

content = content.replace(
    /      \{\!selectedCourse \? \(\r?\n        <>\r?\n          \{\/\* Header Title \*\/\}/g,
    `      {!selectedCourse ? (\n        <>\n          {/* ===== HEADER ===== */}\n          <header className={\`px-6 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-500 mb-10 \${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white/70 border-gray-200 shadow-sm'}\`}>\n            <div className=\"flex items-center space-x-4\">\n              <div className=\"bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/30\">\n                <svg className=\"w-6 h-6 text-white\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2\" d=\"M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253\"></path></svg>\n              </div>\n              <div>\n                <h1 className={\`font-extrabold text-xl leading-tight tracking-wide \${theme === 'dark' ? 'text-white' : 'text-slate-900'}\`}>ILRAS HUB</h1>\n                <p className=\"text-[11px] text-blue-500 font-bold tracking-widest uppercase\">Faculty Portal</p>\n              </div>\n            </div>\n\n            <div className=\"flex items-center space-x-6\">\n              <button onClick={toggleTheme} className={\`p-2 rounded-full transition-colors \${theme === 'dark' ? 'bg-white/10 text-yellow-400 hover:bg-white/20' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}\`}>\n                {theme === 'dark' ? (\n                  <svg className=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2\" d=\"M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z\"></path></svg>\n                ) : (\n                  <svg className=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2\" d=\"M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z\"></path></svg>\n                )}\n              </button>\n              \n              <div className=\"relative flex items-center justify-center cursor-pointer hover:scale-110 transition-transform\">\n                <svg className={\`w-6 h-6 transition-colors \${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}\`} fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2\" d=\"M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9\"></path></svg>\n                <span className={\`absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 shadow-sm \${theme === 'dark' ? 'border-[#161a2b]' : 'border-white'}\`}>3</span>\n              </div>\n              \n              <div className=\"flex items-center space-x-3 border-l pl-6 cursor-pointer group\" onClick={() => { localStorage.clear(); window.location.href = '/login'; }} style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>\n                <div className={\`bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border rounded-full p-2.5 group-hover:scale-105 transition-transform flex items-center justify-center \${theme === 'dark' ? 'border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'border-blue-200 shadow-sm'}\`}>\n                  <svg className=\"w-5 h-5 text-blue-500 transition-colors\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2\" d=\"M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1\"></path></svg>\n                </div>\n                <div>\n                  <p className={\`text-sm font-extrabold leading-none transition-colors \${theme === 'dark' ? 'text-white group-hover:text-blue-400' : 'text-slate-800 group-hover:text-blue-600'}\`}>{userName}</p>\n                  <p className=\"text-[10px] text-gray-500 font-bold mt-1 tracking-widest uppercase\">LOGOUT</p>\n                </div>\n              </div>\n            </div>\n          </header>\n\n          <div className=\"max-w-[1600px] mx-auto px-4 md:px-8 space-y-10\">\n            {/* Header Title */}`
);

content = content.replace(
    /<p className=\"text-blue-200\/60 text-sm font-medium\">Manage educational resources, courses, and track class performance<\/p>/g,
    `<p className={\`text-sm font-medium \${theme === 'dark' ? 'text-blue-200/60' : 'text-slate-500'}\`}>Manage educational resources, courses, and track class performance</p>`
);

content = content.replace(
    /        <>\r?\n          \{\/\* Course Detailed View \*\/\}/g,
    `        <div className=\"max-w-[1600px] mx-auto px-4 md:px-8 space-y-10\">\n        <>\n          {/* Course Detailed View */}`
);

content = content.replace(
    /        <\/>\r?\n      \)\}\r?\n\r?\n      \{\/\* FLOATING INBOX WIDGET \*\/\}/g,
    `        </>\n        </div>\n      )}\n\n      {/* FLOATING INBOX WIDGET */}`
);


fs.writeFileSync('src/pages/FacultyDashboard.jsx', content);
console.log('Patch complete.');
