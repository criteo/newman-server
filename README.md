[![Node.js CI](https://github.com/criteo/newman-server/actions/workflows/node.js.yml/badge.svg)](https://github.com/criteo/newman-server/actions/workflows/node.js.yml)

# newman-server 

`newman-server` is a simple NodeJS server that can run your Postman's collections, using the [newman](https://github.com/postmanlabs/newman) engine.

🚩 Requires nodeJS >= 20 🚩

**Example:**

```sh
$ npm install -g newman-server
$ newman-server
Server started on port 8080
Access http://localhost:8080 to test the server
```

If you don't want to do a global installation, you can use npx to run a locally installed dependency
```sh
$ npm install newman-server
$ npx newman-server
```

The server expose a simple **POST /run/{outputType}** endpoint that expect the Postman collection as a form data input. For example POST /run/json for will use the json newman reporter.
An basic index.html is provided to try running your collection.

## Features

### Supported outputs
|  Output type | Path param | Reporter used                                           |
|--------------|------------|---------------------------------------------------------|
| JSON         | json       | https://github.com/postmanlabs/newman#json-reporter     |
| JUnit        | junit      | https://github.com/postmanlabs/newman#junitxml-reporter |
| HTML         | html       | https://www.npmjs.com/package/newman-reporter-htmlextra |

### Form Inputs
|  Form input       | Type       | Description                                             |
|-------------------|------------|---------------------------------------------------------|
| collectionFile    | .json file | The Postman JSON collection file                        |
| iterationDataFile | .json file | (Optional) The Postman [iteration data](https://learning.postman.com/docs/running-collections/working-with-data-files/) JSON file |

### CLI options
|  Option           | Type   | Default        | Description                        |
|-------------------|--------|----------------|------------------------------------|
| port              | number | 8080           | The server's port                  |
| tempReportsFolder | path   | ./temp_reports | The folder where the temporary XML and HTML report file will be created.  |

### OpenApi doc
To have more details about the endpoints shape, you can look at the server [OpenApi documentation]( https://editor.swagger.io/?url=https://raw.githubusercontent.com/criteo/newman-server/main/public/openapi.yaml)

### Health check endpoint
The server is exposing the endpoint **GET /api/health** that verifies that the server is in an healthy state. When the endpoint is called, the program will check that:
- It has read/write access to the temparory result folder
- The newman NPM package has been successfully installed and is able to run a Postman collection
If the tests succeed, the response status code will be 200, otherwise it will respond with a 500.

### Convert to HTML endpoint
The server is exposing the endpoint **POST /convert/html** that expects JSON summary file as form data input that can be received through POST /run/json. If the provided summary file is valid, the response will be 200 with HTML report, otherwise it will respond with a 400 and error.

## Developer's guide

### Local test and run
```sh
$ npm install
$ npm test
$ npm run start:dev
```

### Install the CLI locally
```sh
$ npm pack 
$ cd some-test-folder
$ npm install ..\newman-server-x.x.x.tgz
$ npx newman-server
```
