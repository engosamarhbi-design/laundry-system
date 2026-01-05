const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

function tryRun(cmd) {
  try {
    run(cmd);
    return true;
  } catch {
    return false;
  }
}

const distIndex = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');

function ensureHostingerOutputDir() {
  const srcDist = path.join(__dirname, '..', 'frontend', 'dist');
  const outDist = path.join(__dirname, '..', 'dist');

  if (!fs.existsSync(srcDist)) return;

  try {
    if (fs.existsSync(outDist)) {
      fs.rmSync(outDist, { recursive: true, force: true });
    }
    fs.cpSync(srcDist, outDist, { recursive: true });
    console.log('[build:frontend] تم إنشاء dist/ في الجذر (لـ Hostinger).');
  } catch (err) {
    console.error('[build:frontend] فشل إنشاء dist/ في الجذر:', err?.message || err);
    process.exit(1);
  }
}

if (fs.existsSync(distIndex)) {
  console.log('[build:frontend] frontend/dist موجودة — تخطي البناء.');
  ensureHostingerOutputDir();
  process.exit(0);
}

console.log('[build:frontend] تثبيت وبناء الواجهة (frontend) ...');

// Some hosts run `npm install --production` or set NODE_ENV=production.
// Force-install devDependencies so Vite is available.
const installed =
  tryRun('npm --prefix frontend install --include=dev') ||
  tryRun('npm --prefix frontend install --production=false') ||
  tryRun('npm --prefix frontend install');

if (!installed) {
  console.error('[build:frontend] فشل تثبيت حزم الواجهة.');
  process.exit(1);
}

run('npm --prefix frontend run build');

// Hostinger Vite preset expects a root-level output directory (commonly "dist").
ensureHostingerOutputDir();
