const { Collection, Item, Request, Response } = require('postman-collection');
const PostmanHTMLExtraReporter = require('newman-reporter-htmlextra');

function generateHTMLReport(summary) {
  var collection = new Collection(summary.collection.toString());
  collection.name = summary.collection.info.name;

  summary.run.executions.forEach((exec) => {
    exec.item = exec.item ? new Item(exec.item) : undefined;
    if (exec.item) exec.item.setParent(collection);
    exec.request = exec.request ? new Request(exec.request) : undefined;
    exec.response = exec.response ? new Response(exec.response) : undefined;
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

module.exports = { generateHTMLReport };
