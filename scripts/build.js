import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

console.log('🚀 Starting Flipcards ultra-lightweight static build...');
const startTime = Date.now();

// Ensure clean dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Helper to copy files and directories recursively
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Items to copy into dist for Cloudflare Pages
const itemsToCopy = [
  'index.html',
  'admin.html',
  'css',
  'js',
  'favicon.ico',
  'robots.txt',
  '_headers',
  '_redirects'
];

let copiedCount = 0;
let totalSizeBytes = 0;

for (const item of itemsToCopy) {
  const srcPath = path.resolve(rootDir, item);
  const destPath = path.resolve(distDir, item);
  if (fs.existsSync(srcPath)) {
    copyRecursiveSync(srcPath, destPath);
    copiedCount++;
  }
}

// Calculate total dist size
function calculateDirSize(dir) {
  let size = 0;
  if (!fs.existsSync(dir)) return 0;
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      size += calculateDirSize(fullPath);
    } else {
      size += fs.statSync(fullPath).size;
    }
  }
  return size;
}

totalSizeBytes = calculateDirSize(distDir);
const totalSizeKB = (totalSizeBytes / 1024).toFixed(2);
const durationMs = Date.now() - startTime;

console.log(`✅ Build completed successfully in ${durationMs}ms!`);
console.log(`📦 Output Directory: dist/`);
console.log(`⚡ Total payload size: ${totalSizeKB} KB (Ultra-low bandwidth footprint)`);
