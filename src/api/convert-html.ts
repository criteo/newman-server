/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { NewmanRun } from 'newman';
import PostmanHTMLExtraReporter from 'newman-reporter-htmlextra';
import {
  Collection,
  Item,
  Request,
  Response,
  type CollectionDefinition,
} from 'postman-collection';

export function generateHTMLReport(summary: {
  collection: CollectionDefinition;
  run: NewmanRun;
}) {
  const collection = new Collection(summary.collection);

  summary.run.executions.forEach((exec) => {
    if (exec.item) {
      // @ts-ignore
      exec.item = new Item(exec.item);
      exec.item.setParent(collection);
    }
    // @ts-ignore
    exec.request = exec.request ? new Request(exec.request) : undefined;
    // @ts-ignore
    exec.response = exec.response ? new Response(exec.response) : undefined;
  });

  summary.collection = collection;

  // newman uses an event emitter to communicate with the reporters
  const newmanEventEmitterMock = {
    action: () => {},
    on(event: string, action: () => void) {
      //the 'beforeDone' event is used by the reporters to build their report and add it to the 'exports' list.
      if (event == 'beforeDone') {
        this.action = action;
        this.action();
      }
    },
    summary,
    exports: [] as { content: string }[],
  };

  PostmanHTMLExtraReporter(newmanEventEmitterMock, {}, {});

  const htmlReport = newmanEventEmitterMock.exports[0].content;

  return htmlReport;
}
