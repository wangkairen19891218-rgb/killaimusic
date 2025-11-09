"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAnon = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
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
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
if (!supabaseUrl) {
    console.error('Supabase URL missing in environment variables');
}
let supabaseClient = null;
try {
    if (supabaseUrl && supabaseServiceKey) {
        supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }
    else if (supabaseUrl && supabaseAnonKey) {
        console.warn('Using Supabase anon key fallback; operations may be restricted by RLS');
        supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }
    else {
        console.error('Supabase keys missing; backend data operations will be unavailable');
    }
}
catch (e) {
    console.error('Failed to initialize Supabase client:', e);
}
exports.supabase = supabaseClient;
exports.supabaseAnon = (supabaseUrl && supabaseAnonKey)
    ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey)
    : null;
exports.default = supabaseClient;
