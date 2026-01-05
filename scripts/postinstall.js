const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distIndex = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');

if (fs.existsSync(distIndex)) {
  console.log('[postinstall] frontend/dist موجودة — تخطي بناء الواجهة.');
  process.exit(0);
}

console.log('[postinstall] بناء الواجهة (frontend) ...');
execSync('npm --prefix frontend install --include=dev', { stdio: 'inherit' });
execSync('npm --prefix frontend run build', { stdio: 'inherit' });
