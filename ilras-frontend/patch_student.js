const fs = require('fs');
let content = fs.readFileSync('src/pages/StudentDashboard.jsx', 'utf8');

// 1. Import useTheme
content = content.replace(
    /import React, \{ useState, useEffect \} from 'react';\r?\nimport axios from 'axios';/g,
    `import React, { useState, useEffect } from 'react';\nimport axios from 'axios';\nimport { useTheme } from '../context/ThemeContext';`
);

// 2. Add hook and wrapper
content = content.replace(
    /const StudentDashboard = \(\) => \{\r?\n  const \[userName/g,
    `const StudentDashboard = () => {\n  const { theme, toggleTheme } = useTheme();\n  const [userName`
);

content = content.replace(
    /  return \(\r?\n    <>\r?\n      \{\/\* TOP HEADER \*\/\}/g,
    `  return (\n    <div className={\`min-h-screen font-sans transition-colors duration-500 p-4 md:p-8 \${theme === 'dark' ? 'bg-[#0b0f19] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0b0f19] to-black text-white' : 'bg-[#f8fafc] text-slate-800'}\`}>\n      <div className=\"max-w-[1600px] mx-auto\">\n      {/* TOP HEADER */}`
);

// Close wrapper at the end
content = content.replace(
    /      \)\}\r?\n    <\/>\r?\n  \);\r?\n\};\r?\n\r?\nexport default/g,
    `      )}\n      </div>\n    </div>\n  );\n};\n\nexport default`
);

// 3. Update Header
content = content.replace(
    /<header className=\"flex justify-between items-center mb-8 border-b border-gray-800 pb-4\">/g,
    `<header className={\`flex justify-between items-center mb-8 border-b pb-4 \${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}\`}>`
);

// Add Theme Toggle button before Notification Bell
content = content.replace(
    /          \{\/\* Notification Bell with Dropdown \*\/\}/g,
    `          {/* Theme Toggle */}\n          <button onClick={toggleTheme} className={\`p-2 rounded-full transition-colors \${theme === 'dark' ? 'bg-white/10 text-yellow-400 hover:bg-white/20' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}\`}>\n            {theme === 'dark' ? (\n              <svg className=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2\" d=\"M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z\"></path></svg>\n            ) : (\n              <svg className=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2\" d=\"M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z\"></path></svg>\n            )}\n          </button>\n\n          {/* Notification Bell with Dropdown */}`
);

// 4. Update Header Search & Select styling dynamically
content = content.replace(
    /className=\"w-full pl-10 pr-4 py-2 border border-gray-800 rounded-xl bg-\[\#131825\] text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all\"/g,
    `className={\`w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all \${theme === 'dark' ? 'border-gray-800 bg-[#131825] text-white' : 'border-gray-300 bg-white text-slate-800 shadow-sm'}\`}`
);
content = content.replace(
    /className=\"w-48 appearance-none pl-4 pr-10 py-2 border border-gray-800 rounded-xl bg-\[\#131825\] text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer font-medium text-sm\"/g,
    `className={\`w-48 appearance-none pl-4 pr-10 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer font-medium text-sm \${theme === 'dark' ? 'border-gray-800 bg-[#131825] text-white' : 'border-gray-300 bg-white text-slate-800 shadow-sm'}\`}`
);

// 5. Update Notification & Profile backgrounds
content = content.replace(
    /className=\"p-2 bg-\[\#131825\] border border-gray-800 rounded-full cursor-pointer hover:bg-gray-800 transition-colors flex items-center justify-center h-10 w-10\"/g,
    `className={\`p-2 border rounded-full cursor-pointer transition-colors flex items-center justify-center h-10 w-10 \${theme === 'dark' ? 'bg-[#131825] border-gray-800 hover:bg-gray-800' : 'bg-white border-gray-300 hover:bg-gray-100 shadow-sm'}\`}`
);
content = content.replace(
    /className=\"flex items-center space-x-3 bg-\[\#131825\] border border-gray-800 px-3 py-1.5 rounded-full cursor-pointer hover:bg-gray-800 transition-colors\"/g,
    `className={\`flex items-center space-x-3 border px-3 py-1.5 rounded-full cursor-pointer transition-colors \${theme === 'dark' ? 'bg-[#131825] border-gray-800 hover:bg-gray-800' : 'bg-white border-gray-300 hover:bg-gray-50 shadow-sm'}\`}`
);
content = content.replace(
    /<p className=\"text-sm font-bold text-white leading-tight\">\{userName\}<\/p>/g,
    `<p className={\`text-sm font-bold leading-tight \${theme === 'dark' ? 'text-white' : 'text-slate-800'}\`}>{userName}</p>`
);

// 6. Update Cards and boxes
content = content.replace(
    /className=\"min-w-\[280px\] w-\[280px\] bg-\[\#131825\] rounded-xl border border-gray-800 overflow-hidden hover:border-blue-500 transition-colors group cursor-pointer shadow-lg shrink-0 flex flex-col\"/g,
    `className={\`min-w-[280px] w-[280px] rounded-xl border overflow-hidden hover:border-blue-500 transition-colors group cursor-pointer shadow-lg shrink-0 flex flex-col \${theme === 'dark' ? 'bg-[#131825] border-gray-800' : 'bg-white border-gray-200'}\`}`
);
content = content.replace(
    /className=\"bg-\[\#131825\] rounded-2xl p-6 border border-gray-800 shadow-xl\"/g,
    `className={\`rounded-2xl p-6 border shadow-xl \${theme === 'dark' ? 'bg-[#131825] border-gray-800' : 'bg-white border-gray-200'}\`}`
);
content = content.replace(
    /<h3 className=\"text-xl font-bold text-white mb-6\">/g,
    `<h3 className={\`text-xl font-bold mb-6 \${theme === 'dark' ? 'text-white' : 'text-slate-800'}\`}>`
);

// 7. Update Course Detailed View Container
content = content.replace(
    /className=\"bg-\[\#131825\] rounded-2xl p-8 border border-gray-800 shadow-xl flex flex-col md:flex-row gap-8\"/g,
    `className={\`rounded-2xl p-8 border shadow-xl flex flex-col md:flex-row gap-8 \${theme === 'dark' ? 'bg-[#131825] border-gray-800' : 'bg-white border-gray-200'}\`}`
);

fs.writeFileSync('src/pages/StudentDashboard.jsx', content);
console.log('Patch complete.');
