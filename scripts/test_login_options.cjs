const path = require('path');
const handler = require(path.join(__dirname, '..', 'api', 'auth', 'login.js'));

function makeRes() {
  const headers = {};
  let statusCode = 0;
  let body = '';
  return {
    get result() {
      return { statusCode, headers, body };
    },
    setHeader(key, val) { headers[key] = val; },
    end(chunk = '') { body += typeof chunk === 'string' ? chunk : String(chunk); console.log(JSON.stringify({ statusCode, headers, body }, null, 2)); },
    set statusCode(code) { statusCode = code; },
    get statusCode() { return statusCode; },
  };
}

(async () => {
  const req = {
    method: 'OPTIONS',
    url: '/api/auth/login',
    headers: {
      origin: 'https://kililamusic.fun',
      'access-control-request-method': 'POST',
      'access-control-request-headers': 'Content-Type, Authorization',
    },
  };

  const res = makeRes();
  await handler(req, res);
})();