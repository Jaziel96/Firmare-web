const fs = require('fs');
const path = require('path');

const listFiles = (dir, fileList = [], excludeDirs = ['.next', 'node_modules']) => {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!excludeDirs.includes(file)) {
        fileList.push({ type: 'directory', name: filePath });
        listFiles(filePath, fileList, excludeDirs);
      }
    } else {
      fileList.push({ type: 'file', name: filePath });
    }
  });
  return fileList;
};

const dirPath = path.resolve('.');
const fileList = listFiles(dirPath);

fileList.forEach((file) => {
  console.log(`${file.type === 'directory' ? '📁' : '📄'} ${file.name}`);
});

// usar en terminal node listStructure.js