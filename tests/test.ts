import * as fs from 'node:fs';
import type { Response } from 'supertest';
import supertest from 'supertest';
import { Application } from '../src/app';
import { NewmanRunner } from '../src/runner';

const app = new Application(new NewmanRunner());
const requestWithSupertest = supertest(app.expressApp);

describe('Run endpoints', () => {
  it('POST /run/xxx should return 400 because the xxx reporter is not supported', async () => {
    await requestWithSupertest
      .post('/run/xxx')
      .attach('collectionFile', CollectionFile.Standalone)
      .expect(400)
      .then((res) => {
        expectErrorOnField(res, 'type', 'xxx');
      });
  });

  it('POST /run/json should return 400 when no collection is provided', async () => {
    await requestWithSupertest
      .post('/run/json')
      .expect(400)
      .then((res) => {
        expectErrorOnField(res, 'collectionFile', undefined);
      });
  });

  it('POST /run/json should return 400 when provided collection is not a JSON string', async () => {
    await requestWithSupertest
      .post('/run/json')
      .attach('collectionFile', CollectionFile.InvalidType)
      .expect(400)
      .then((res) => {
        expectErrorOnField(
          res,
          'collectionFile',
          'collection-invalid-type.txt',
        );
      });
  });

  it('POST /run/json should return 400 when provided iterationData is not a JSON string', async () => {
    await requestWithSupertest
      .post('/run/json')
      .attach('collectionFile', CollectionFile.ValidButNeedIterationData)
      .attach('iterationDataFile', IterationFile.InvalidType)
      .expect(400)
      .then((res) => {
        expectErrorOnField(
          res,
          'iterationDataFile',
          'iteration-invalid-type.txt',
        );
      });
  });

  it('POST /run/json should test the Github API and return the JSON result when the collection is provided', async () => {
    await requestWithSupertest
      .post('/run/json')
      .attach('collectionFile', CollectionFile.Standalone)
      .expect(200)
      .then((res) => {
        //the sample collection should run sucessfully
        expect(res.type).toEqual(expect.stringContaining('json'));

        //the returned JSON should contains the iterations results (1 valid iteration)
        expect(res.body).toHaveProperty('run');
        expect(res.body.run).toHaveProperty('stats');
        expect(res.body.run.stats).toHaveProperty('iterations');
        expect(res.body.run.stats.iterations.total).toEqual(1);
        expect(res.body.run.stats.iterations.pending).toEqual(0);
        expect(res.body.run.stats.iterations.failed).toEqual(0);
      });
  });

  it('POST /run/json should test the Github API and return the JSON result when the collection and iteration data is provided', async () => {
    await requestWithSupertest
      .post('/run/json')
      .attach('collectionFile', CollectionFile.ValidButNeedIterationData)
      .attach('iterationDataFile', IterationFile.Valid)
      .expect(200)
      .then((res) => {
        //the sample collection should run sucessfully
        expect(res.type).toEqual(expect.stringContaining('json'));

        //the returned JSON should contains the iterations results (2 valid iteration, as specified in the iterations data file), so 6 assertions
        expect(res.body).toHaveProperty('run');
        expect(res.body.run).toHaveProperty('stats');

        expect(res.body.run.stats).toHaveProperty('iterations');
        expect(res.body.run.stats.iterations.total).toEqual(2);
        expect(res.body.run.stats.iterations.pending).toEqual(0);
        expect(res.body.run.stats.iterations.failed).toEqual(0);

        expect(res.body.run.stats).toHaveProperty('assertions');
        expect(res.body.run.stats.assertions.total).toEqual(6);
        expect(res.body.run.stats.assertions.pending).toEqual(0);
        expect(res.body.run.stats.assertions.failed).toEqual(0);
      });
  });

  it('POST /run/json return 400 when timeout is set but not a number', async () => {
    await requestWithSupertest
      .post('/run/json?timeout=invalid')
      .attach('collectionFile', CollectionFile.Standalone)
      .expect(400)
      .then((res) => {
        expectErrorOnField(res, 'timeout', 'invalid');
      });
  });

  it('POST /run/json should return 500 if newman is unable to run the collection', async () => {
    await requestWithSupertest
      .post('/run/json')
      .attach('collectionFile', CollectionFile.ValidButNeedIterationData)
      .attach('iterationDataFile', IterationFile.IncorrectStructure)
      .expect(500)
      .then((res) => {
        expect(res.type).toEqual(expect.stringContaining('json'));
        expect(res.body).toHaveProperty('error');
      });
  });

  it('POST /run/html should test the Github API and return the HTML result when the collection is provided', async () => {
    await requestWithSupertest
      .post('/run/html')
      .attach('collectionFile', CollectionFile.Standalone)
      .expect(200)
      .then((res) => {
        expect(res.type).toEqual(expect.stringContaining('html'));
      });
  });

  it('POST /run/html should purge the HTML file after sending it', async () => {
    await requestWithSupertest
      .post('/run/html')
      .attach('collectionFile', CollectionFile.Standalone)
      .expect(200)
      .then(() => {
        const reportsDir = './temp_reports';
        expect(fs.existsSync(reportsDir)).toBeTruthy();

        fs.readdir(reportsDir, (err, files) => {
          expect(err).toBeNull();
          expect(files.length).toEqual(0);
        });
      });
  });

  it('POST /run/junit should test the Github API and return the JUnit result when the collection is provided', async () => {
    await requestWithSupertest
      .post('/run/junit')
      .attach('collectionFile', CollectionFile.Standalone)
      .expect(200)
      .then((res) => {
        expect(res.type).toEqual(expect.stringContaining('xml'));
      });
  });

  it('POST /run/junit should purge the JUnit file after sending it', async () => {
    await requestWithSupertest
      .post('/run/junit')
      .attach('collectionFile', CollectionFile.Standalone)
      .expect(200)
      .then(() => {
        const reportsDir = './temp_reports';
        expect(fs.existsSync(reportsDir)).toBeTruthy();

        fs.readdir(reportsDir, (err, files) => {
          expect(err).toBeNull();
          expect(files.length).toEqual(0);
        });
      });
  });
});

describe('Run endpoints with timeout', () => {
  it('POST /run/json for collection with 5s request return error in about 100ms if 100ms timeout is set', async () => {
    const startTime = performance.now();

    await requestWithSupertest
      .post('/run/json?timeout=100')
      .attach('collectionFile', CollectionFile.LongRequest)
      .expect(500)
      .then(() => {
        expect(performance.now() - startTime).toBeLessThan(200); //less than ~100ms
      });
  });

  it('POST /run/json for collection with 5s script return error in about 100ms  if 100ms timeout is set', async () => {
    const startTime = performance.now();

    await requestWithSupertest
      .post('/run/json?timeout=100')
      .attach('collectionFile', CollectionFile.LongScript)
      .expect(500)
      .then(() => {
        expect(performance.now() - startTime).toBeLessThan(200); //less than ~100ms
      });
  });

  it('POST /run/json for collection with 5s request return success if 10s timeout is set', async () => {
    const startTime = performance.now();

    await requestWithSupertest
      .post('/run/json?timeout=10000')
      .attach('collectionFile', CollectionFile.LongRequest)
      .expect(200)
      .then(() => {
        expect(performance.now() - startTime).toBeLessThan(10000);
      });
  });

  it('POST /run/json for collection with 5s script return success if 10s timeout is set', async () => {
    const startTime = performance.now();

    await requestWithSupertest
      .post('/run/json?timeout=10000')
      .attach('collectionFile', CollectionFile.LongScript)
      .expect(200)
      .then(() => {
        expect(performance.now() - startTime).toBeLessThan(10000);
      });
  });

  it('POST /run/json should return 400 when provided environment is not a JSON string', async () => {
    await requestWithSupertest
      .post('/run/json')
      .attach('collectionFile', CollectionFile.ValidButNeedEnvironment)
      .attach('environmentFile', EnvironmentFile.InvalidType)
      .expect(400)
      .then((res) => {
        expectErrorOnField(
          res,
          'environmentFile',
          'environment-invalid-type.txt',
        );
      });
  });

  it('POST /run/json should return results when the collection and environment is provided', async () => {
    await requestWithSupertest
      .post('/run/json')
      .attach('collectionFile', CollectionFile.ValidButNeedEnvironment)
      .attach('environmentFile', EnvironmentFile.Valid)
      .expect(200)
      .then((res) => {
        expect(res.type).toEqual(expect.stringContaining('json'));

        const buf = Buffer.from(
          res.body.run.executions[0].response.stream.data,
        );
        const json = JSON.parse(buf.toString());

        expect(json.url).toEqual(
          'http://postman-echo.com/get?foobar=some_value',
        );
        expect(json.args.foobar).toEqual('some_value');
        expect(json.args.barfoo).toEqual('value_some');
      });
  });
});

describe('OpenApi documentation', () => {
  it('GET /openapi.yaml should return the openapi file', async () => {
    const res = await requestWithSupertest.get('/openapi.yaml');
    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining('yaml'));
  });

  it('GET /api/docs should return the swagger editor and the openapi spec', async () => {
    const res = await requestWithSupertest.get('/api/docs/');
    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining('html'));
  });
});

describe('Test form', () => {
  it('GET / should return the HTML form', async () => {
    const res = await requestWithSupertest.get('');
    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining('html'));
  });
});

describe('Health Check', () => {
  it('GET /api/health should return Ok response with uptime info', async () => {
    const res = await requestWithSupertest.get('/api/health');
    expect(res.status).toEqual(200);
    expect(res.body.uptime).toBeTruthy();
    expect(typeof res.body.uptime).toEqual('number');
  });
});

describe('Convert HTML', () => {
  it('POST /convert/html should return Ok response with HTML report when provided with valid JSON summary', async () => {
    await requestWithSupertest
      .post('/convert/html')
      .attach('summaryFile', SummaryFile.Valid)
      .expect(200)
      .then((res) => {
        expect(res.type).toEqual(expect.stringContaining('html'));
      });
  });

  it('POST /convert/html should return 400 response with error with invalid JSON summary', async () => {
    await requestWithSupertest
      .post('/convert/html')
      .attach('summaryFile', SummaryFile.Invalid)
      .expect(400)
      .then((res) => {
        expect(res.type).toEqual(expect.stringContaining('json'));
        expect(res.body).toHaveProperty('errors');
      });
  });

  it('POST /convert/html should return 200 response with HTML report when provided with a JSON summary for a failed run', async () => {
    await requestWithSupertest
      .post('/convert/html')
      .attach('summaryFile', SummaryFile.Failure)
      .expect(200)
      .then((res) => {
        expect(res.type).toEqual(expect.stringContaining('html'));
      });
  });
});

function expectErrorOnField<T>(res: Response, field: string, value: T) {
  expect(res.type).toEqual(expect.stringContaining('json'));
  expect(res.body).toHaveProperty('errors');
  expect(res.body.errors.length).toEqual(1);
  expect(res.body.errors[0].path).toEqual(field);
  expect(res.body.errors[0].value).toEqual(value);
}

const CollectionFile = {
  InvalidType: './tests/resources/collection-invalid-type.txt',
  Standalone: './tests/resources/collection-standalone.json',
  ValidButNeedEnvironment:
    './tests/resources/collection-valid-need-environment.json',
  ValidButNeedIterationData:
    './tests/resources/collection-valid-need-iteration-data.json',
  LongRequest: './tests/resources/collection-5-seconds-request.json',
  LongScript: './tests/resources/collection-5-seconds-request.json',
};

const EnvironmentFile = {
  InvalidType: './tests/resources/environment-invalid-type.txt',
  Valid: './tests/resources/environment-valid.json',
};

const IterationFile = {
  InvalidType: './tests/resources/iteration-invalid-type.txt',
  Valid: './tests/resources/iteration-valid.json',
  IncorrectStructure: './tests/resources/iteration-incorrect-structure.json',
};

const SummaryFile = {
  Valid: './tests/resources/summary-valid.json',
  Invalid: './tests/resources/summary-invalid.json',
  Failure: './tests/resources/summary-failure.json',
};
