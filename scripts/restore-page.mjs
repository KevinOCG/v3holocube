import { writeFileSync } from 'fs';

const response = await fetch('https://api.github.com/repos/KevinOCG/v3holocube/git/blobs/cc1a0541999c408601056aea3e668264d0279448');
const data = await response.json();
const content = Buffer.from(data.content, 'base64').toString('utf-8');
writeFileSync('/vercel/share/v0-project/app/page.tsx', content);
console.log('File restored successfully!');
