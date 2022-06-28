![Node.js CI](https://github.com/ouvreboite/newman-server/actions/workflows/node.js.yml/badge.svg)

# newman-server 

`newman-server` is a simple NodeJS server that can run your Postman's collections, using the [newman](https://github.com/postmanlabs/newman) engine.

🚩 Requires nodeJS >= 12.🚩

**Example:**
```sh
$ npm install newman-server
$ newman-server
Server started on port 8080
Access http://localhost:8080 to test the server
```

The server expose a simple **POST /run/{outputType}** endpoint that expect the Postman collection as a form data input. For example POST /run/json for the JSON run output.
You can directly play with a provided basic HTML form and try running your collection by calling the server's root page.

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
To have more details about the endpoints shape, you can look at the server [OpenApi documentation]( https://editor.swagger.io/?url=https://raw.githubusercontent.com/ouvreboite/newman-server/main/public/openapi.yaml)

## Developper's guide

### Local test and run
```sh
$ npm install
$ npm test
$ npm run devStart
```

### Install the CLI locally
```sh
$ npm pack 
$ cd some-test-folder
$ npm install ..\newman-server-x.x.x.tgz
$ npx newman-server
```
