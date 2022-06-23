const express = require('express');
const { param, body, validationResult } = require('express-validator');
const {NewmanRunner} = require('./runner');
const swaggerUi = require('swagger-ui-express');

class Application{
  constructor(newmanRunner = new NewmanRunner){
    this.newmanRunner = newmanRunner;
    this.expressApp = this.setupExpressApp();
  }

  setupExpressApp(){
    const expressApp = express();
    expressApp.use(express.static('public'));
    var options = {
      swaggerOptions: {
        url: '/openapi.yaml'
      }
    }
    expressApp.use('/api-docs', swaggerUi.serve, swaggerUi.setup(null, options));
    expressApp.use(express.json());
    
    expressApp.post(
        '/run/:type',
        param('type').isIn(['html','json','junit']).withMessage('Only the json, html and junit reports are supported'),
        body('collection').isJSON().withMessage('The test collection must be provided as a JSON string'),
        body('iterationData').optional().isJSON().withMessage('The test iteration data must be provided as a JSON string'),
        (req, res) => {
          const errors = validationResult(req);
          if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
          }
    
          const collection = JSON.parse(req.body.collection);
          const iterationData = req.body.iterationData? JSON.parse(req.body.iterationData):null;
          this.newmanRunner.runCollection(res, req.params.type, collection, iterationData);
        },
    );

    return expressApp;
  }
}

module.exports = {Application};