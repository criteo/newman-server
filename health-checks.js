const fs = require('fs');
const path = require('path');
const newman = require('newman');


const testFolderPath = path.join(__dirname, 'health_check_test_folder');

function runHealthChecks(callback) {
  tryReadFileSystem((error) => {
    if (error) callback(formatError(error));
    else tryWriteFileSystem((error) => {
        if (error) callback(formatError(error));
        else tryRunNewman((error) => {
          if (error) callback(formatError(error));
          else callback();
        })
      })
  });
}

function tryReadFileSystem(callback) {
  fs.readdir(__dirname, (error) => callback(error));
}

function tryWriteFileSystem(callback) {
 if (fs.existsSync(testFolderPath)) {
    fs.rmdirSync(testFolderPath);
  }

  fs.mkdir(testFolderPath, (error) => {
    if (error) return callback(error);

    fs.rmdirSync(testFolderPath);
    callback();
  });
}

function tryRunNewman(callback) {
  newman.run({}, (error) => {
    if (error && error.message !== 'expecting a collection to run') return callback(error);
    callback();
  });
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
