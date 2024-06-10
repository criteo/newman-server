#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Application } from './app';
import { NewmanRunner } from './runner';
import { logger } from './utils/logger';

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

function serve(port: number, tempReportsFolder: string) {
  const runner = new NewmanRunner(tempReportsFolder);
  const app = new Application(runner);
  app.expressApp.listen(port, () => {
    logger.info(`Server started on port ${port}`);
    logger.info(`Access http://localhost:${port} to test the server`);
    runner.purgeOrCreateReportFolder();
  });
}
