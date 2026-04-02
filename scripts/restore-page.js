const https = require('https');

const url = 'https://raw.githubusercontent.com/KevinOCG/v3holocube/main/app/page.tsx';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Output to stdout so we can see the content
    console.log('FILE_CONTENT_START');
    console.log(data);
    console.log('FILE_CONTENT_END');
    console.log('Length:', data.length);
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
