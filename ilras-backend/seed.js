const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/courses/seed',
    method: 'POST',
};

const req = http.request(options, res => {
    let data = '';
    res.on('data', chunk => {
        data += chunk;
    });
    res.on('end', () => {
        console.log(JSON.parse(data));
    });
});

req.on('error', error => {
    console.error(error);
});

req.end();
