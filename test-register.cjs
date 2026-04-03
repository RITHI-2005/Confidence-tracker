const https = require('https');

const data = JSON.stringify({
  name: 'Rithi',
  email: 'rithi@gmail.com',
  password: 'student123',
  role: 'student'
});

const options = {
  hostname: 'confidence-tracker.onrender.com',
  port: 443,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Origin': 'https://confidence-tracker.vercel.app'
  }
};

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error('Error:', error);
});

req.write(data);
req.end();
