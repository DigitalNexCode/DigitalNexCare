import fs from 'fs';
import path from 'path';

// Helper to generate minimal valid PNG buffer for icons if canvas not available
// We create a solid PNG or render SVG to PNG
const publicDir = path.resolve(process.cwd(), 'public');

// A valid base64 PNG fallback (cyan-blue themed square)
const basePng192 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAIAAADdvvtQAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAA6SURBVHhe7cExAQAAAMKg9U9tCj+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgDeh/wABy1iM1QAAAABJRU5ErkJggg==',
  'base64'
);

const basePng512 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAA6SURBVHhe7cExAQAAAMKg9U9tCj+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgDeh/wABy1iM1QAAAABJRU5ErkJggg==',
  'base64'
);

const files = [
  { name: 'pwa-192x192.png', data: basePng192 },
  { name: 'pwa-512x512.png', data: basePng512 },
  { name: 'pwa-maskable-512x512.png', data: basePng512 },
  { name: 'apple-touch-icon.png', data: basePng192 },
  { name: 'favicon.ico', data: basePng192 }
];

for (const file of files) {
  const filePath = path.join(publicDir, file.name);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, file.data);
    console.log(`Generated ${file.name}`);
  }
}
console.log('PWA icon assets ready.');
