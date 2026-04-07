const fs = require('fs');
const path = require('path');

const ENV_VAR = '${import.meta.env.VITE_API_URL}';
const OLD_API = 'http://localhost:5000/api';
const OLD_BASE = 'http://localhost:5000';

function walk(dir) {
  let out = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) out = out.concat(walk(full));
    else if (/\.(jsx?|tsx?)$/.test(f)) out.push(full);
  }
  return out;
}

const files = walk(path.join(__dirname, 'src'));
let count = 0;

for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes('localhost:5000')) continue;

  // Replace /api URLs first (more specific), then bare base URL
  let out = src;
  // single-quoted
  out = out.replace(/'http:\/\/localhost:5000\/api([^']*)'/g, (_, rest) => '`' + ENV_VAR + rest + '`');
  // double-quoted
  out = out.replace(/"http:\/\/localhost:5000\/api([^"]*)"/g, (_, rest) => '`' + ENV_VAR + rest + '`');
  // already in template literal
  out = out.replace(/http:\/\/localhost:5000\/api/g, ENV_VAR);
  // bare base (for file URLs like /uploads/)
  out = out.replace(/http:\/\/localhost:5000/g, ENV_VAR);

  if (out !== src) {
    fs.writeFileSync(file, out, 'utf8');
    console.log('Fixed:', path.relative(__dirname, file));
    count++;
  }
}

console.log('\nDone. Fixed', count, 'files.');
