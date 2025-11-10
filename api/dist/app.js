"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const projects_1 = __importDefault(require("./routes/projects"));
const tracks_1 = __importDefault(require("./routes/tracks"));
const ai_analysis_1 = __importDefault(require("./routes/ai-analysis"));
(() => {
    const envPath = process.env.NODE_ENV === 'production'
        ? path_1.default.resolve(process.cwd(), '.env.production')
        : path_1.default.resolve(process.cwd(), '.env');
    if (fs_1.default.existsSync(envPath)) {
        dotenv_1.default.config({ path: envPath });
    }
    else {
        dotenv_1.default.config();
    }
})();
const app = (0, express_1.default)();
const allowedOrigins = [
    'https://kililamusic.fun',
    'https://www.kililamusic.fun',
    'https://killaimusic.fun',
    'https://www.killaimusic.fun',
    'https://inkmusic.fun',
    'https://www.inkmusic.fun',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://192.168.2.14:5173'
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204
}));
app.options('*', (0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/auth', auth_1.default);
app.use('/api/projects', projects_1.default);
app.use('/api/tracks', tracks_1.default);
app.use('/api/ai-analysis', ai_analysis_1.default);
app.use('/api/health', (req, res, next) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Music Production API'
    });
});
app.use((error, req, res, next) => {
    res.status(500).json({
        success: false,
        error: 'Server internal error',
    });
});
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'API not found',
    });
});
exports.default = app;
