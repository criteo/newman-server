const express = require('express');
const fileUpload = require('express-fileupload');
const {
  param,
  validationResult,
  buildCheckFunction,
} = require('express-validator');
//express-fileupload will populate res.files with the form's file, so we need a custom validator to access it
const file = buildCheckFunction(['files']);
const healthCheck = require('express-healthcheck');
const swaggerUi = require('swagger-ui-express');
const morgan = require('morgan');
const path = require('path');
const { runHealthChecks } = require('./api/health-checks');
const { NewmanRunner } = require('./runner');
const { logger, LogLevel } = require('./utils/logger');

class Application {
  constructor(newmanRunner = new NewmanRunner()) {
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
      })
    );
    expressApp.use(express.static(path.join(__dirname, '../public')));
    expressApp.use(fileUpload());
    var options = {
      swaggerOptions: {
        url: '/openapi.yaml',
      },
    };
    expressApp.use(
      '/api/health',
      healthCheck({
        test: (callback) =>
          runHealthChecks(this.newmanRunner.reportsFolder, callback),
      })
    );
    expressApp.use(
      '/api/docs',
      swaggerUi.serve,
      swaggerUi.setup(null, options)
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
      file('iterationDataFile')
        .optional()
        .custom((file) => file.name && file.name.endsWith('.json'))
        .withMessage('The test iteration data must be a JSON file'),
      (req, res) => {
        if (!this.validateInput(req, res)) return;

        const collectionFileJSON = JSON.parse(
          req.files.collectionFile.data.toString()
        );
        const iterationDataFileJSON = req.files.iterationDataFile
          ? JSON.parse(req.files.iterationDataFile.data.toString())
          : null;

        const collectionName =
          collectionFileJSON &&
          collectionFileJSON.info &&
          collectionFileJSON.info.name;
        const reporterType = req.params && req.params.type;
        logger.info(
          `Running Postman collection: ${collectionName}. Using ${reporterType} reporter.`
        );

        this.newmanRunner.runCollection(
          res,
          reporterType,
          collectionFileJSON,
          iterationDataFileJSON
        );
      }
    );

    return expressApp;
  }

  validateInput(req, res) {
    const validationResults = validationResult(req);
    if (validationResults.isEmpty()) return true;

    var errors = validationResults
      .array()
      .map((result) => this.keepFileNameAsValue(result));
    res.status(400).json({ errors: errors });

    return false;
  }

  keepFileNameAsValue(result) {
    if (typeof result.value != 'object' || result.value.name === 'undefined')
      return result;

    result.value = result.value.name;
    return result;
  }
}

module.exports = { Application };
