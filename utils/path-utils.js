const path = require('path');

function toAbsolutePath(relativePath) {
  if (path.isAbsolute(relativePath)) {
    return relativePath;
  }

  return path.join(process.cwd(), relativePath);
}

module.exports = { toAbsolutePath };