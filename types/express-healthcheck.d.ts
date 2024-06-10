// @types/express-healthcheck is missing the callback version of the test method
declare module 'express-healthcheck' {
  export default function (arg: {
    test: (callback: (error?: object) => void) => void;
  });
}
