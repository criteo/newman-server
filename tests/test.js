const { Application } = require('../src/app');
const supertest = require('supertest');
const fs = require('fs');
const { NewmanRunner } = require('../src/runner');
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
        expectErrorOnField(res, 'collectionFile');
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
          'collection-invalid-type.txt'
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
          'iteration-invalid-type.txt'
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

  it('POST /run/json should return 500 if newman is inable to run the collection', async () => {
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
});

function expectErrorOnField(res, field, value) {
  expect(res.type).toEqual(expect.stringContaining('json'));
  expect(res.body).toHaveProperty('errors');
  expect(res.body.errors.length).toEqual(1);
  expect(res.body.errors[0].param).toEqual(field);
  expect(res.body.errors[0].value).toEqual(value);
}

const CollectionFile = {
  InvalidType: './tests/resources/collection-invalid-type.txt',
  Standalone: './tests/resources/collection-standalone.json',
  ValidButNeedIterationData:
    './tests/resources/collection-valid-need-iteration-data.json',
};

const IterationFile = {
  InvalidType: './tests/resources/iteration-invalid-type.txt',
  Valid: './tests/resources/iteration-valid.json',
  IncorrectStructure: './tests/resources/iteration-incorrect-structure.json',
};

const SummaryFile = {
  Valid: './tests/resources/summary-valid.json',
  Invalid: './tests/resources/summary-invalid.json',
};
