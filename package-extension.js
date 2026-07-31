/**
 * Extension Packaging Script for Production Zip Generation
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('[Build] Packaging Focus Dashboard Chrome Extension...');

const outputZip = path.join(__dirname, 'focus-dashboard-v1.0.0.zip');

if (fs.existsSync(outputZip)) {
  fs.unlinkSync(outputZip);
}

try {
  const filesToCompress = [
    'manifest.json',
    'index.html',
    'blocked.html',
    'offscreen.html',
    'offscreen.js',
    'background.js',
    'src',
    'styles'
  ];

  const psCommand = `Compress-Archive -Path ${filesToCompress.map(f => `'${f}'`).join(',')} -DestinationPath '${outputZip}' -Force`;
  execSync(`powershell -Command "${psCommand}"`, { cwd: __dirname });

  console.log(`[Build Success] Extension packaged successfully into: ${outputZip}`);
} catch (err) {
  console.error('[Build Error] Failed to package extension:', err);
}
