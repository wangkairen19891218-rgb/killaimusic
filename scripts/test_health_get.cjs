const path = require('path');

function makeRes() {
  const headers = {};
  let statusCode = 0;
  let body = '';
  return {
    json(obj) { this.setHeader('Content-Type', 'application/json'); this.statusCode = 200; this.end(JSON.stringify(obj)); },
    get result() { return { statusCode, headers, body }; },
    setHeader(key, val) { headers[key] = val; },
    end(chunk = '') { body += typeof chunk === 'string' ? chunk : String(chunk); console.log(JSON.stringify({ statusCode, headers, body }, null, 2)); },
    set statusCode(code) { statusCode = code; },
    get statusCode() { return statusCode; },
  };
}

(async () => {
  const modulePath = path.join(__dirname, '..', 'api', 'health.js');
  const handler = require(modulePath);
  const req = {
    method: 'GET',
    url: '/api/health',
    headers: {
      origin: 'https://kililamusic.fun'
    }
  };
  const res = makeRes();
  await handler(req, res);
})();