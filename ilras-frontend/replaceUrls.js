const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const frontendSrcPath = path.join(__dirname, 'src');
const files = walk(frontendSrcPath);

let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace single quote strings
  content = content.replace(/'http:\/\/localhost:5000\/api(.*?)'/g, '`${import.meta.env.VITE_API_URL}$1`');
  
  // Replace double quote strings
  content = content.replace(/"http:\/\/localhost:5000\/api(.*?)"/g, '`${import.meta.env.VITE_API_URL}$1`');

  // Replace inside template literals
  content = content.replace(/http:\/\/localhost:5000\/api/g, '${import.meta.env.VITE_API_URL}');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
    console.log(`Updated: ${file}`);
  }
});

console.log(`Done! Modified ${modifiedCount} files.`);
