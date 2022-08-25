const path = require('path');

function toAbsolutePath(relativePath) {
  if (path.isAbsolute(relativePath)) {
    return relativePath;
  }

  return path.join(__dirname, relativePath);
}

module.exports = { toAbsolutePath };