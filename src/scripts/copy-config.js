const fs = require('fs-extra');
const path = require('path');
const srcDir = path.join(__dirname, '..', 'config');
const destDir = path.join(__dirname, '..', '..', 'dist', 'config');
fs.copySync(srcDir, destDir);