const fs = require('fs');
const path = require('path');
const newman = require('newman');

/**
 * When a request is made the run a Postman collection, newman, the underlying NPM package that will run the collection,
 * will write a report as a file on the disk, the content of this file will then be read in order to respond to the call.
 * We need to make sure that the program has read/write access to the file system and that newman has been properly installed.
 */
function runHealthChecks(folderPath, callback) {
  return tryReadReportFolder(folderPath)
    .then(() => tryWriteFileInReportFolder(folderPath))
    .then(() => tryRunNewman())
    .then(() => callback())
    .catch((error) => callback(formatError(error)))
}

function tryReadReportFolder(folderPath) {
  return new Promise((resolve, reject) => fs.readdir(folderPath, (error) => error ? reject(error) : resolve()));
}

function tryWriteFileInReportFolder(folderPath) {
  const filePath = path.join(folderPath, 'tests');

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  
  return new Promise((resolve, reject) => fs.writeFile(filePath, '', (error) => {
    if (error) return reject(error);

    fs.unlinkSync(filePath);
    return resolve();
  }));
}

function tryRunNewman() {
  return new Promise((resolve, reject) => newman.run({}, (error) => {
    if (error && error.message !== 'expecting a collection to run') {
      return reject(error);
    }

    return resolve();
  }));
}

function formatError(error) {
  return { errors: [
    { 
      code: error.code,
      message: error.message,
    }
  ]};
}

module.exports = { runHealthChecks };
