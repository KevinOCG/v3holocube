const fs = require('fs');

const filePath = '/vercel/share/v0-project/app/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Split into lines
const lines = content.split('\n');

// Find FILE_CONTENT_START and FILE_CONTENT_END
const startIndex = lines.findIndex(l => l.includes('FILE_CONTENT_START'));
const endIndex = lines.findIndex(l => l.includes('FILE_CONTENT_END'));

console.log('Start index:', startIndex);
console.log('End index:', endIndex);

// Extract content between markers
const contentLines = lines.slice(startIndex + 1, endIndex);

// Remove line number prefixes (format: "  123\t" at start)
const cleanLines = contentLines.map(line => {
  // Match pattern: spaces + numbers + tab
  const match = line.match(/^\s*\d+\t(.*)$/);
  return match ? match[1] : line;
});

const cleaned = cleanLines.join('\n');
fs.writeFileSync(filePath, cleaned, 'utf8');
console.log('Cleaned file written, length:', cleaned.length);
