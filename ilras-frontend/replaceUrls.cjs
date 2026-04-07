const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function (file) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      results.push(fullPath);
    }
  });
  return results;
}

const srcPath = path.join(__dirname, 'src');
const files = walk(srcPath);
let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Replace ALL occurrences of the hardcoded URL with env var
  content = content.split('http://localhost:5000/api').join('${import.meta.env.VITE_API_URL}');
  content = content.split('http://localhost:5000').join(import_meta_env_BACKEND_URL);

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
    console.log('Updated:', path.relative(__dirname, file));
  }
});

console.log('\nDone! Modified', modifiedCount, 'files.');
