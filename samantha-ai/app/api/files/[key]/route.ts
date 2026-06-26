// API route to fetch a PDF file from Supabase Storage by key and return it as an inline response

import { supabase } from "@/lib/supabase";

export async function GET(
  req: Request,
  context: { params: Promise<{ key: string }> },
) {
  try {
    const { key } = await context.params;
    const decodedKey = decodeURIComponent(key);
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET!;

    console.log("Fetching storage key:", decodedKey);

    const { data, error } = await supabase.storage
      .from(bucket)
      .download(decodedKey);

    if (error || !data) {
      console.error("Storage fetch error:", error);
      return new Response("File not found", { status: 404 });
    }

    return new Response(data, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    });
  } catch (err: any) {
    console.error("Storage fetch error:", err);
    return new Response("File not found", { status: 404 });
  }
}
