import * as newman from 'newman';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface FormattedErrors {
  errors: { code?: number; message: string }[];
}

/**
 * When a request is made the run a Postman collection, newman, the underlying NPM package that will run the collection,
 * will write a report as a file on the disk, the content of this file will then be read in order to respond to the call.
 * We need to make sure that the program has read/write access to the file system and that newman has been properly installed.
 */
export function runHealthChecks(
  folderPath: string,
  callback: (error?: FormattedErrors) => void,
) {
  return tryReadReportFolder(folderPath)
    .then(() => tryWriteFileInReportFolder(folderPath))
    .then(() => tryRunNewman())
    .then(() => callback())
    .catch((error) => callback(formatError(error)));
}

function tryReadReportFolder(folderPath: string) {
  return new Promise<void>((resolve, reject) =>
    fs.readdir(folderPath, (error) => (error ? reject(error) : resolve())),
  );
}

function tryWriteFileInReportFolder(folderPath: string) {
  const filePath = path.join(folderPath, 'tests');

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return new Promise<void>((resolve, reject) =>
    fs.writeFile(filePath, '', (error) => {
      if (error) return reject(error);

      fs.unlinkSync(filePath);
      return resolve();
    }),
  );
}

function tryRunNewman() {
  return new Promise<void>((resolve, reject) =>
    newman.run({ collection: {} }, (error) => {
      if (error && error.message !== 'expecting a collection to run') {
        return reject(error);
      }

      return resolve();
    }),
  );
}

function formatError(error: Error & { code?: number }): FormattedErrors {
  return {
    errors: [
      {
        code: error.code,
        message: error.message,
      },
    ],
  };
}
