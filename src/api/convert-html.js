const { Collection, Item, Request, Response } = require('postman-collection');
const PostmanHTMLExtraReporter = require('newman-reporter-htmlextra');
const { logger } = require('../utils/logger');

function generateHTMLReport(summary) {
    try{
        logger.info(
            `Starting the conversion of JSON summary to HTML report for collection '${summary.collection.info.name}'.`
        );

        var collection = new Collection(summary.collection.toString());
        collection.name = summary.collection.info.name;
      
        summary.run.executions.forEach((exec) => {
          exec.item = new Item(exec.item);
          exec.item.setParent(collection);
          exec.request = new Request(exec.request);
          exec.response = new Response(exec.response);
        });
      
        summary.collection = collection;
      
        //newman uses an event emitter to communicate with the reporters
        var newmanEventEmitterMock = {
          on(event, action) {
            //the 'beforeDone' event is used by the reporters to build their report and add it to the 'exports' list.
            if (event == 'beforeDone') {
              this.action = action;
              this.action();
            }
          },
          summary: summary,
          exports: [],
        };
      
        PostmanHTMLExtraReporter(newmanEventEmitterMock, {}, {});
      
        var htmlReport = newmanEventEmitterMock.exports[0].content;
      
        return htmlReport;
    }
    catch(error){
        logger.error(
            `An error occured while converting JSON summary to HTML report.`,
            error
          );
    }
}

module.exports = { generateHTMLReport };
