"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const url_1 = require("url");
const allowedOrigins = new Set([
    'https://kililamusic.fun',
    'https://www.kililamusic.fun',
    'https://killaimusic.fun',
    'https://www.killaimusic.fun',
    'https://inkmusic.fun',
    'https://www.inkmusic.fun',
    'http://localhost:5173',
    'http://localhost:3000'
]);
function setCorsHeaders(req, res) {
    const origin = req.headers['origin'] || '';
    const allowed = origin && allowedOrigins.has(origin);
    res.setHeader('Access-Control-Allow-Origin', allowed ? origin : '*');
    if (allowed) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    const reqMethod = req.headers['access-control-request-method'] || 'GET,POST,PUT,DELETE,OPTIONS';
    const reqHeaders = req.headers['access-control-request-headers'] || 'Content-Type, Authorization';
    res.setHeader('Access-Control-Allow-Methods', reqMethod);
    res.setHeader('Access-Control-Allow-Headers', reqHeaders);
    res.setHeader('Vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
}
function handler(req, res) {
    try {
        const parsed = (0, url_1.parse)(req.url || '', true);
        const q = parsed.query;
        const pathParam = (q && q.path) ? String(q.path) : undefined;
        if ((parsed.pathname === '/api/index' || parsed.pathname === '/api/index/') && pathParam) {
            const normalized = pathParam.startsWith('/') ? pathParam : `/${pathParam}`;
            req.url = `/api${normalized}`;
        }
        setCorsHeaders(req, res);
        res.setHeader('X-Serverless-Function', 'api/index');
        if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
        }
        let expressApp;
        try {
            expressApp = require('./app').default;
        }
        catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'App load error', detail: String(e?.message || e) }));
            return;
        }
        ;
        expressApp(req, res);
    }
    catch (error) {
        try {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Server entry error' }));
        }
        catch { }
    }
}
