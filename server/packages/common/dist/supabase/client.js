"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbPool = exports.supabase = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({
    path: ".env",
});
const supabase_js_1 = require("@supabase/supabase-js");
const pg_1 = require("pg");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    console.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in process.env!");
    process.exit(1);
}
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false,
    },
});
console.log("Supabase client initialized successfully!");
exports.dbPool = new pg_1.Pool({
    connectionString: process.env.DATABASE_TRANSACTION_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
