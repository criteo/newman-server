const newman = require('newman');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const { toAbsolutePath } = require('./utils/path-utils');

class NewmanRunner {
  constructor(reportsFolder = './temp_reports') {
    this.reportsFolder = toAbsolutePath(reportsFolder);
  }

  runCollection(res, type, collection, iterationData) {
    const reporter = this.reporterFromType(type);
    const runSettings = this.buildRunSetting(
      reporter,
      collection,
      iterationData
    );
    newman.run(runSettings, (err, summary) =>
      this.sendCollectionReport(reporter, res, err, summary, runSettings)
    );
  }

  reporterFromType(type) {
    return type == 'html' ? 'htmlextra' : type;
  }

  buildRunSetting(reporter, collection, iterationData) {
    switch (reporter) {
      case 'htmlextra': {
        const uniqueHtmlFileName = path.join(
          this.reportsFolder,
          '/htmlResults' + uuidv4() + '.html'
        );
        return {
          collection: collection,
          iterationData: iterationData,
          reporters: 'htmlextra',
          reporter: { htmlextra: { export: uniqueHtmlFileName } },
        };
      }
      case 'json':
        return {
          collection: collection,
          iterationData: iterationData,
        };
      case 'junit': {
        const uniqueXmlFileName = path.join(
          this.reportsFolder,
          'htmlResults' + uuidv4() + '.xml'
        );
        return {
          collection: collection,
          iterationData: iterationData,
          reporters: 'junit',
          reporter: { junit: { export: uniqueXmlFileName } },
        };
      }
      default:
        throw (
          'Reporter type is unknown: ' +
          reporter +
          '. Only html and json are supported'
        );
    }
  }

  sendCollectionReport(reporter, res, err, summary, runSettings) {
    if (!this.handleError(err, res)) return;

    switch (reporter) {
      case 'htmlextra':
      case 'junit': {
        const uniqueFileNamePath = '' + runSettings.reporter[reporter].export;
        var options = {};
        if (!path.isAbsolute(uniqueFileNamePath)) {
          options = {
            root: path.join('.'),
          };
        }
        res.sendFile(uniqueFileNamePath, options, (err) => {
          this.handleError(err, res);
          fs.unlinkSync(uniqueFileNamePath);
        });
        break;
      }
      case 'json':
        res.send(summary.run);
        break;
      default:
        throw (
          'Reporter type is unknown: ' +
          reporter +
          '. Only htmlextra, json and junit are supported'
        );
    }
  }

  purgeOrCreateReportFolder() {
    if (fs.existsSync(this.reportsFolder)) {
      fs.readdir(this.reportsFolder, (err, files) => {
        if (err) throw err;

        for (const file of files) {
          fs.unlinkSync(path.join(this.reportsFolder, file));
        }
      });
      console.log(`Temporary report folder purged :${this.reportsFolder}`);
    } else {
      fs.mkdir(this.reportsFolder, (err) => {
        if (err) throw err;
        console.log(`Temporary report folder created :${this.reportsFolder}`);
      });
    }
  }

  handleError(err, res) {
    if (err) {
      console.error(err);
      res.status(500);
      res.send({ error: '' + err });
      return false;
    }
    return true;
  }
}

module.exports = { NewmanRunner };
