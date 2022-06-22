## Intro

`newman-server` is a simple webserver that can run Postman's collection, using the newman engine.

**Example:**
```sh
$ npm install newman-server
$ newman-server
Server started on port 8080
```

And then, you can call **POST /run/json** or **POST /run/html** to run a Postman collection and return either the JSON or HTML report.

To have more details about the endpoints shape, you can look at the server [OpenApi documentation]( https://editor.swagger.io/?url=https://raw.githubusercontent.com/ouvreboite/newman-server/main/public/openapi.json).

