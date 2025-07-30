const { createServer } = require('../../dist/api/server');

exports.handler = async (event, context) => {
  const app = createServer();
  
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const request = {
        method: event.httpMethod,
        url: event.path,
        headers: event.headers,
        body: event.body
      };

      app.handle(request, {
        writeHead: (statusCode, headers) => {
          resolve({
            statusCode,
            headers,
            body: ''
          });
        },
        end: (body) => {
          resolve({
            statusCode: 200,
            body
          });
        }
      });
    });
  });
};