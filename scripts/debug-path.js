const fs = require('fs');
const path = require('path');

console.log('CWD:', process.cwd());
console.log('Files in CWD:', fs.readdirSync(process.cwd()));

// Try to find app folder
try {
  console.log('Files in ./app:', fs.readdirSync('./app'));
} catch (e) {
  console.log('No ./app folder');
}

try {
  console.log('Files in ../app:', fs.readdirSync('../app'));
} catch (e) {
  console.log('No ../app folder');
}
