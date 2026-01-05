const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// On backend-only hosts (e.g., Render), we don't want frontend builds to run during install.
// You can also force-skip by setting SKIP_FRONTEND_BUILD=1.
const isRender =
  process.env.RENDER === 'true' ||
  Boolean(process.env.RENDER_SERVICE_ID) ||
  Boolean(process.env.RENDER_EXTERNAL_URL);

const skipFrontendBuild =
  process.env.SKIP_FRONTEND_BUILD === '1' ||
  process.env.SKIP_FRONTEND_BUILD === 'true' ||
  isRender;

if (skipFrontendBuild) {
  console.log('[postinstall] تخطي بناء الواجهة (SKIP_FRONTEND_BUILD/Render).');
  process.exit(0);
}

const distIndex = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');

if (fs.existsSync(distIndex)) {
  console.log('[postinstall] frontend/dist موجودة — تخطي بناء الواجهة.');
  process.exit(0);
}

console.log('[postinstall] بناء الواجهة (frontend) ...');
try {
  execSync('npm --prefix frontend install --include=dev', { stdio: 'inherit' });
  execSync('npm --prefix frontend run build', { stdio: 'inherit' });
} catch (err) {
  console.error('[postinstall] فشل بناء الواجهة:', err?.message || err);
  process.exit(1);
}
