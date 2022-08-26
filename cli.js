#!/usr/bin/env node
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const { NewmanRunner } = require('./src/runner');
const { Application } = require('./src/app');
const { logger } = require('./src/utils/logger');

yargs(hideBin(process.argv))
  .scriptName('newman-server')
  .command({
    command: '*',
    describe: 'Start the server',
    builder: {
      port: {
        describe: 'Port the server will listen to',
        type: 'number',
        default: 8080,
      },
      tempReportsFolder: {
        describe:
          'The folder where the temporary reporter results will be created',
        type: 'string',
        default: './temp_reports',
      },
    },
    handler(argv) {
      serve(argv.port, argv.tempReportsFolder);
    },
  })
  .parse();

function serve(port, tempReportsFolder) {
  var runner = new NewmanRunner(tempReportsFolder);
  var app = new Application(runner);
  app.expressApp.listen(port, () => {
    logger.info(`Server started on port ${port}`);
    logger.info(`Access http://localhost:${port} to test the server`);
    runner.purgeOrCreateReportFolder();
  });
}
