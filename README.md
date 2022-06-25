![Node.js CI](https://github.com/ouvreboite/newman-server/actions/workflows/node.js.yml/badge.svg)

# newman-server 

`newman-server` is a simple NodeJS webserver that can run Postman's collection, using the [newman](https://github.com/postmanlabs/newman) engine.

**Example:**
```sh
$ npm install newman-server
$ newman-server
Server started on port 8080
```

And then, you can call **POST /run/json**, **POST /run/html** or **POST /run/junit** to run a Postman collection and return either the JSON, HTML or JUnit (XML) report.

To have more details about the endpoints shape, you can look at the server [OpenApi documentation]( https://editor.swagger.io/?url=https://raw.githubusercontent.com/ouvreboite/newman-server/main/public/openapi.yaml).

# Developper's guide

Local run
```sh
$ npm install
$ npm run devStart
```

Install the CLI locally
```sh
$ npm pack 
$ cd some-test-folder
$ npm install ..\newman-server-x.x.x.tgz
$ npx newman-server
```
