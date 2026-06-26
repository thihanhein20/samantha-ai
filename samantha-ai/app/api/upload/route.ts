// API route to upload a PDF to Supabase Storage: reads the file from the request,
// uploads it, and returns a signed URL for access

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const fileName = req.headers.get("x-filename");
    if (!fileName)
      return NextResponse.json(
        { error: "Filename not provided" },
        { status: 400 },
      );

    const pdfArrayBuffer = await req.arrayBuffer();
    if (!pdfArrayBuffer)
      return NextResponse.json({ error: "No file sent" }, { status: 400 });

    const key = `uploads/${Date.now()}-${fileName}`;
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET!;

    // Create bucket if it doesn't exist yet
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find((b) => b.name === bucket)) {
      await supabase.storage.createBucket(bucket, { public: false });
    }

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(key, Buffer.from(pdfArrayBuffer), {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage.from(bucket).createSignedUrl(key, 3600);

    if (signedUrlError) throw signedUrlError;

    console.log("Signed URL:", signedUrlData.signedUrl);

    return NextResponse.json({ fileUrl: signedUrlData.signedUrl, s3key: key });
  } catch (err: any) {
    console.error("Storage upload failed:", err);
    return NextResponse.json(
      { error: "Storage upload failed", details: err.message },
      { status: 500 },
    );
  }
}
