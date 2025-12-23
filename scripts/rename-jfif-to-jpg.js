const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

function renameJfifFiles() {
  if (!fs.existsSync(uploadsDir)) {
    console.error('Uploads directory not found:', uploadsDir);
    process.exit(1);
  }

  const files = fs.readdirSync(uploadsDir);
  let renamed = 0;

  files.forEach((file) => {
    if (file.toLowerCase().endsWith('.jfif')) {
      const oldPath = path.join(uploadsDir, file);
      const newFile = file.replace(/\.jfif$/i, '.jpg');
      const newPath = path.join(uploadsDir, newFile);

      if (fs.existsSync(newPath)) {
        console.warn('Skipping rename, target already exists:', newFile);
      } else {
        fs.renameSync(oldPath, newPath);
        console.log('Renamed:', file, '->', newFile);
        renamed++;
      }
    }
  });

  console.log(`Done. Renamed ${renamed} file(s).`);
}

renameJfifFiles();
