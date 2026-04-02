const https = require('https');
const fs = require('fs');

const url = 'https://raw.githubusercontent.com/KevinOCG/v3holocube/main/app/page.tsx';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('/vercel/share/v0-project/app/page.tsx', data);
    console.log('Restored page.tsx successfully, length:', data.length);
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
