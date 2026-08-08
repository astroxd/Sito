import path from "path";
import dotenv from "dotenv";
dotenv.config({
  path: ".env",
});
import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in process.env!",
  );
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

console.log("Supabase client initialized successfully!");

export const dbPool = new Pool({
  connectionString: process.env.DATABASE_TRANSACTION_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
