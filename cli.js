#!/usr/bin/env node
const { NewmanRunner } = require('./runner')
const { Application } = require('./app')
const yargs = require("yargs");
const { hideBin } = require('yargs/helpers')

yargs(hideBin(process.argv))
.scriptName("newman-server")
.command({
    command: '*',
    describe: 'Start the server',
    builder: {
        port: {
            describe: 'Port the server will listen to',
            type: 'number',
            default: 8080
        },
        tempReportsFolder: {
          describe: 'The folder where the temporary reporter results will be created',
          type: 'string',
          default: './temp_reports'
      }
    },
    handler(argv) {
        serve(argv.port, argv.tempReportsFolder);
    }
}).parse();

function serve(port, tempReportsFolder){
    var runner = new NewmanRunner(tempReportsFolder);
    var app = new Application(runner);
    app.expressApp.listen(port, () => {
        console.log(`Server started on port ${port}`);
        runner.purgeOrCreateReportFolder();    
    });
}
