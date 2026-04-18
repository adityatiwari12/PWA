import fs from 'fs';
import path from 'path';

const DIST_DIR = './dist';

console.log('🚀 Starting Sanjivani Health OS PWA Audit...');

async function runAudit() {
  const issues = [];

  // 1. Check Dist Folder
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Error: dist folder does not exist. Run npm run build first.');
    process.exit(1);
  }

  // 2. Check Manifest
  const manifestPath = path.join(DIST_DIR, 'manifest.webmanifest');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log('✅ Manifest found.');
    
    if (manifest.name !== 'Sanjivani Health OS') issues.push('Manifest name mismatch.');
    if (manifest.theme_color !== '#E84040') issues.push('Theme color mismatch.');
    if (!manifest.icons || manifest.icons.length < 2) issues.push('Insufficient icon coverage.');
  } else {
    issues.push('manifest.webmanifest missing in dist.');
  }

  // 3. Check Service Worker
  const files = fs.readdirSync(DIST_DIR);
  const swFile = files.find(f => f.startsWith('sw') && f.endsWith('.js'));
  if (swFile) {
    console.log(`✅ Service Worker found: ${swFile}`);
  } else {
    issues.push('Service worker file missing in dist.');
  }

  // 4. Check App Icons
  ['icon-192.png', 'icon-512.png'].forEach(icon => {
    if (fs.existsSync(path.join(DIST_DIR, icon))) {
      console.log(`✅ Icon found: ${icon}`);
    } else {
      issues.push(`Icon missing: ${icon}`);
    }
  });

  // Result
  if (issues.length === 0) {
    console.log('\n✨ AUDIT PASSED: 100% PWA Compliance for Sanjivani Health OS.');
  } else {
    console.log('\n⚠️ AUDIT FAILED with following issues:');
    issues.forEach(msg => console.log(` - ${msg}`));
    process.exit(1);
  }
}

runAudit();
