const {Application} = require('../app');
const {InputBuilder, CollectionType, DataType} = require('./input-builder');
const supertest = require('supertest');
const fs = require("fs");
const { NewmanRunner } = require('../runner');

const app = new Application(new NewmanRunner());
const requestWithSupertest = supertest(app.expressApp);

describe('Run endpoints', () => {   
  it('POST /run/xxx should return 400 because the xxx reporter is not supported', async () => {
    const input = new InputBuilder().withCollection(CollectionType.ValidStandalone).build();
    const res = await requestWithSupertest.post('/run/xxx').send(input);
    expect400errorOnField(res, 'reporter');
  });

  it('POST /run/json should return 400 when no collection is provided', async () => {
    const input = new InputBuilder().empty().build();
    const res = await requestWithSupertest.post('/run/json').send(input);
    expect400errorOnField(res, 'collection');
  });

  it('POST /run/json should return 400 when provided collection is not a JSON string', async () => {
    const input = new InputBuilder().withCollection(CollectionType.Invalid).build();
    const res = await requestWithSupertest.post('/run/json').send(input);
    expect400errorOnField(res, 'collection');
  });

  it('POST /run/json should return 400 when provided iterationData is not a JSON string', async () => {
    const input = new InputBuilder().withCollection(CollectionType.ValidWithIterationData).withIterationData(DataType.Invalid).build();
    const res = await requestWithSupertest.post('/run/json').send(input);
    expect400errorOnField(res, 'iterationData');
  });

  it('POST /run/json should test the Github API and return the JSON result when the collection is provided', async () => {
    const input = new InputBuilder().withCollection(CollectionType.ValidStandalone).build();
    const res = await requestWithSupertest.post('/run/json').send(input);

    //the sample collection should run sucessfully
    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining('json'));
    
    //the returned JSON should contains the iterations results (1 valid iteration)
    expect(res.body).toHaveProperty('stats');
    expect(res.body.stats).toHaveProperty('iterations');
    expect(res.body.stats.iterations.total).toEqual(1);
    expect(res.body.stats.iterations.pending).toEqual(0);
    expect(res.body.stats.iterations.failed).toEqual(0);
  });

  it('POST /run/json should test the Github API and return the JSON result when the collection and iteration data is provided', async () => {
    const input = new InputBuilder().withCollection(CollectionType.ValidWithIterationData).withIterationData(DataType.Valid).build();
    const res = await requestWithSupertest.post('/run/json').send(input);

    //the sample collection should run sucessfully
    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining('json'));
    
    //the returned JSON should contains the iterations results (2 valid iteration, as specified in the iteraiton data file)
    expect(res.body).toHaveProperty('stats');
    expect(res.body.stats).toHaveProperty('iterations');
    expect(res.body.stats.iterations.total).toEqual(2);
    expect(res.body.stats.iterations.pending).toEqual(0);
    expect(res.body.stats.iterations.failed).toEqual(0);
  });

  it('POST /run/json should return 500 if newman is inable to run the collection', async () => {
    const input = new InputBuilder().withCollection(CollectionType.ValidWithIterationData).withIterationData(DataType.Throwing).build();
    const res = await requestWithSupertest.post('/run/json').send(input);
    expect(res.status).toEqual(500);
    expect(res.type).toEqual(expect.stringContaining('json'));
    
    expect(res.body).toHaveProperty('error');
  });

  it('POST /run/html should test the Github API and return the HTML result when the collection is provided', async () => {
    const input = new InputBuilder().withCollection(CollectionType.ValidStandalone).build();
    const res = await requestWithSupertest.post('/run/html').send(input);

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining('html'));
  });

  it('POST /run/html should purge the HTML file after sending it', async () => {
    const input = new InputBuilder().withCollection(CollectionType.ValidStandalone).build();
    await requestWithSupertest.post('/run/html').send(input);

    const reportsDir = './temp_reports';
    expect(fs.existsSync(reportsDir)).toBeTruthy();

    fs.readdir(reportsDir, (err, files) => {
      expect(err).toBeNull();
      expect(files.length).toEqual(0);
    });
  });
});

describe('OpenApi documentation', () => {   
  it('GET /openapi.yaml should return the openapi file', async () => {
    const res = await requestWithSupertest.get('/openapi.yaml');
    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining('yaml'));
  });

  it('GET /api-docs should return the swagger editor and the openapi spec', async () => {
    const res = await requestWithSupertest.get('/api-docs/');
    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining('html'));
  });
});

function expect400errorOnField(res, field){
  expect(res.type).toEqual(expect.stringContaining('json'));
  expect(res.body).toHaveProperty('errors');
  if(res.body.errors.length > 1)
    console.log(res.body);
  expect(res.body.errors.length).toEqual(1);
  expect(res.body.errors[0].param).toEqual(field);
}