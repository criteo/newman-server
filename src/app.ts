import type { Express, Request, Response } from 'express';
import express from 'express';
import fileUpload, { type UploadedFile } from 'express-fileupload';
import healthCheck from 'express-healthcheck';
import {
  buildCheckFunction,
  param,
  query,
  validationResult,
  type ValidationError,
} from 'express-validator';
import morgan from 'morgan';
import * as path from 'node:path';
import swaggerUi from 'swagger-ui-express';
import { generateHTMLReport } from './api/convert-html';
import { runHealthChecks } from './api/health-checks';
import { NewmanRunner } from './runner';
import { LogLevel, logger } from './utils/logger';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error: express-fileupload will populate res.files with the form's file, so we need a custom validator to access it
const file = buildCheckFunction(['files']);

export class Application {
  newmanRunner: NewmanRunner;
  expressApp: Express;

  constructor(newmanRunner: NewmanRunner = new NewmanRunner()) {
    this.newmanRunner = newmanRunner;
    this.expressApp = this.setupExpressApp();
  }

  setupExpressApp() {
    const expressApp = express();
    expressApp.use(
      morgan((tokens, req, res) => {
        const httpVersion = tokens['http-version'](req, res);
        const method = tokens.method(req, res);
        const url = tokens.url(req, res);
        const status = tokens.status(req, res);
        const contentType = tokens.res(req, res, 'content-type');
        const remoteAddr = tokens['remote-addr'](req, res);
        return logger.format({
          level: LogLevel.info,
          message: `Request finished HTTP/${httpVersion} ${method} ${url} ${status} ${contentType}`,
          duration: tokens['response-time'](req, res),
          caller: remoteAddr,
        });
      }),
    );
    expressApp.use(express.static(path.join(__dirname, '../public')));
    expressApp.use(fileUpload());
    const options = {
      swaggerOptions: {
        url: '/openapi.yaml',
      },
    };
    expressApp.use(
      '/api/health',
      healthCheck({
        test: (callback) =>
          runHealthChecks(this.newmanRunner.reportsFolder, callback),
      }),
    );
    expressApp.use(
      '/api/docs',
      swaggerUi.serve,
      swaggerUi.setup(undefined, options),
    );
    expressApp.use(express.json());

    expressApp.post(
      '/run/:type',
      param('type')
        .isIn(['html', 'json', 'junit'])
        .withMessage('Only the json, html and junit reports are supported'),
      file('collectionFile')
        .exists()
        .bail()
        .withMessage('The test collection file is mandatory')
        .custom((file) => file.name && file.name.endsWith('.json'))
        .withMessage('The test collection file must be a JSON file'),
      file('environmentFile')
        .optional()
        .custom((file) => file.name && file.name.endsWith('.json'))
        .withMessage('The test environment must be a JSON file'),
      file('iterationDataFile')
        .optional()
        .custom((file) => file.name && file.name.endsWith('.json'))
        .withMessage('The test iteration data must be a JSON file'),
      query('timeout').optional().isInt(),
      (req, res) => {
        if (!this.validateInput(req as Request, res)) return;

        const files = req.files!;
        const collectionFile = files.collectionFile as UploadedFile;
        const environmentFile = files.environmentFile as
          | UploadedFile
          | undefined;
        const iterationDataFile = files.iterationDataFile as
          | UploadedFile
          | undefined;

        const collectionFileJSON = JSON.parse(collectionFile.data.toString());
        const environmentFileJSON = environmentFile
          ? JSON.parse(environmentFile.data.toString())
          : null;
        const iterationDataFileJSON = iterationDataFile
          ? JSON.parse(iterationDataFile.data.toString())
          : null;

        const collectionName =
          collectionFileJSON &&
          collectionFileJSON.info &&
          collectionFileJSON.info.name;
        const reporterType = req.params && req.params.type;
        logger.info(
          `Run for Postman collection '${collectionName}' started. Using '${reporterType}' reporter.`,
        );

        const timeout = req.query?.timeout;
        if (timeout) {
          logger.info(`Timeout has been explicitly set: ${timeout}ms`);
        }

        try {
          this.newmanRunner.runCollection(
            res,
            reporterType,
            collectionFileJSON,
            environmentFileJSON,
            iterationDataFileJSON,
            timeout,
          );
          logger.info(
            `Run for Postman collection '${collectionName}' started succesfully.`,
          );
        } catch (error) {
          logger.error(
            `An error occured while running Postman collection '${collectionName}'.`,
            error as Error,
          );
          res.status(500).send(`An error occured while running the collection`);
        }
      },
    );

    expressApp.post(
      '/convert/html',
      file('summaryFile')
        .exists()
        .bail()
        .withMessage('The test summary file is mandatory')
        .custom((file) => file.name && file.name.endsWith('.json'))
        .withMessage('The test collection file must be a JSON file')
        .custom((file) => {
          const parsedFile = JSON.parse(file.data.toString());
          return (
            parsedFile.collection != null &&
            parsedFile.run != null &&
            parsedFile.run.executions != null
          );
        })
        .withMessage(
          'The test summary file is not valid. Please use the summary generated using Newman.',
        ),
      (req, res) => {
        if (!this.validateInput(req as Request, res)) return;

        const files = req.files!;
        const summaryFile = files.summaryFile as UploadedFile;

        const summary = JSON.parse(summaryFile.data.toString());
        const collectionName =
          summary &&
          summary.collection &&
          summary.collection.info &&
          summary.collection.info.name;

        logger.info(
          `Starting the conversion of JSON summary to HTML report for collection '${collectionName}'.`,
        );

        try {
          const htmlReport = generateHTMLReport(summary);
          res.set('Content-Type', 'text/html');
          res.send(Buffer.from(htmlReport));
        } catch (error) {
          const error_ = error as Error;
          logger.error(
            `An error occured while converting JSON summary to HTML report.`,
            error_,
            error_ && error_.stack,
          );
          res
            .status(500)
            .send(
              `An error occured while converting JSON summary to HTML report`,
            );
        }
      },
    );

    return expressApp;
  }

  validateInput(req: Request, res: Response) {
    const validationResults = validationResult(req);
    if (validationResults.isEmpty()) return true;

    const errors = validationResults
      .array()
      .map((result) => this.keepFileNameAsValue(result));
    res.status(400).json({ errors: errors });

    return false;
  }

  keepFileNameAsValue(result: ValidationError) {
    if (!('value' in result)) return result;

    if (typeof result.value != 'object' || result.value.name === 'undefined')
      return result;

    result.value = result.value.name;
    return result;
  }
}
