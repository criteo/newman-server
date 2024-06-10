import type { Response } from 'express';
import type { NewmanRunOptions, NewmanRunSummary } from 'newman';
import * as newman from 'newman';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { CollectionDefinition } from 'postman-collection';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './utils/logger';
import { toAbsolutePath } from './utils/path-utils';

export class NewmanRunner {
  reportsFolder: string;

  constructor(reportsFolder: string = './temp_reports') {
    this.reportsFolder = toAbsolutePath(reportsFolder);
  }

  runCollection(
    res: Response,
    type: string,
    collection: CollectionDefinition,
    iterationData: NewmanRunOptions['iterationData'],
    timeout: string,
  ) {
    const reporter = this.reporterFromType(type);
    const runSettings = this.buildRunSetting(
      reporter,
      collection,
      iterationData,
    );

    if (timeout) {
      runSettings.timeout = Number(timeout);
    }

    newman.run(runSettings, (err, summary) =>
      this.sendCollectionReport(reporter, res, err, summary, runSettings),
    );
  }

  reporterFromType(type: string) {
    return type == 'html' ? 'htmlextra' : type;
  }

  buildRunSetting(
    reporter: string,
    collection: CollectionDefinition,
    iterationData: NewmanRunOptions['iterationData'],
  ): NewmanRunOptions {
    switch (reporter) {
      case 'htmlextra': {
        const uniqueHtmlFileName = path.join(
          this.reportsFolder,
          '/htmlResults' + uuidv4() + '.html',
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
          'htmlResults' + uuidv4() + '.xml',
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

  sendCollectionReport(
    reporter: string,
    res: Response,
    err: Error | null,
    summary: NewmanRunSummary,
    runSettings: NewmanRunOptions,
  ) {
    let collectionName;
    if (
      typeof runSettings.collection !== 'string' &&
      'info' in runSettings.collection
    ) {
      collectionName = runSettings.collection.info?.name;
    }
    logger.info(`Run for Postman collection '${collectionName}' ended.`);

    if (!this.handleError(err, res)) return;

    switch (reporter) {
      case 'htmlextra':
      case 'junit': {
        const uniqueFileNamePath = '' + runSettings.reporter![reporter].export;
        let options = {};
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
        res.send(summary);
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
      logger.info(`Temporary report folder purged :${this.reportsFolder}`);
    } else {
      fs.mkdir(this.reportsFolder, (err) => {
        if (err) throw err;
        logger.info(`Temporary report folder created :${this.reportsFolder}`);
      });
    }
  }

  handleError(err: Error | null, res: Response) {
    if (err) {
      console.error(err);
      res.status(500);
      res.send({ error: '' + err });
      return false;
    }
    return true;
  }
}
