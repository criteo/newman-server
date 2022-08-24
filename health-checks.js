const fs = require('fs');
const path = require('path');
const newman = require('newman');


const testFolderPath = path.join(__dirname, 'health_check_test_folder');

/**
 * When a request is made the run a Postman collection, newman, the underlying NPM package that will run the collection,
 * will write a report as a file on the disk, the content of this file will then be read in order to respond to the call.
 * We need to make sure that the program has read/write access to the file system and that newman has been properly installed.
 */
function runHealthChecks(callback) {
  return tryReadFileSystem()
    .then(() => tryWriteFileSystem())
    .then(() => tryRunNewman())
    .then(() => callback())
    .catch((error) => callback(formatError(error)))
}

function tryReadFileSystem() {
  return new Promise((resolve, reject) => fs.readdir(__dirname, (error) => error ? reject(error) : resolve()))
}

function tryWriteFileSystem() {
 if (fs.existsSync(testFolderPath)) {
    fs.rmdirSync(testFolderPath);
  }

  return new Promise((resolve, reject) => fs.mkdir(testFolderPath, (error) => {
    if (error) return reject(error);

    fs.rmdirSync(testFolderPath);
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
