// scripts/test-storage.ts — smoke test for Supabase Storage upload
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";

dotenv.config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;

if (!supabaseUrl || !serviceKey || !bucket) {
  throw new Error(
    "Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET",
  );
}

const supabase = createClient(supabaseUrl, serviceKey);

async function testStorage() {
  const filePath = path.join(__dirname, "test.pdf");
  if (!fs.existsSync(filePath)) {
    console.error("❌ test.pdf not found in scripts folder");
    return;
  }

  const fileContent = fs.readFileSync(filePath);
  const key = `test-${Date.now()}.pdf`;

  const { error } = await supabase.storage
    .from(bucket!)
    .upload(key, fileContent, { contentType: "application/pdf" });

  if (error) {
    console.error("❌ Upload failed:", error);
    return;
  }

  console.log("✅ Upload successful:", key);

  const { data } = await supabase.storage.from(bucket!).createSignedUrl(key, 3600);
  console.log("Signed URL:", data?.signedUrl);
}

testStorage();
