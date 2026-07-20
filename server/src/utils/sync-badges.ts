import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { supabase } from "../config/supabaseClient";

const BADGES_BUCKET = process.env.SUPABASE_BADGES_BUCKET_ID || "badges";
const LOCAL_STATIC_DIR = path.join(__dirname, "../..", "static/badges");
async function syncBadges() {
  console.log("Starting badge synchronization on Supabase Storage...");

  if (!fs.existsSync(LOCAL_STATIC_DIR)) {
    console.error(`Local directory ${LOCAL_STATIC_DIR} does not exist.`);
    return;
  }

  const files = fs.readdirSync(LOCAL_STATIC_DIR);

  const uploadPromises = files.map(async (fileName) => {
    const localFilePath = path.join(LOCAL_STATIC_DIR, fileName);
    if (fs.statSync(localFilePath).isDirectory()) return;

    const fileBuffer = fs.readFileSync(localFilePath);
    const ext = path.extname(fileName).toLowerCase();
    const contentType = ext === ".svg" ? "image/svg+xml" : "image/png";

    return supabase.storage
      .from(BADGES_BUCKET)
      .upload(fileName, fileBuffer, {
        contentType: contentType,
        upsert: true,
      })
      .then(({ error }) => {
        if (error)
          console.error(`Failed to upload ${fileName}:`, error.message);
        else console.log(`${fileName} synced.`);
      });
  });

  await Promise.all(uploadPromises);
  console.log("Synchronization completed!");
}

syncBadges();
