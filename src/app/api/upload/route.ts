import { NextRequest, NextResponse } from "next/server";
import { supabase, BUCKET_NAME } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "maps";

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan dalam request" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${folder}/${Date.now()}_${cleanFileName}`;

    // 1. Attempt upload to Supabase Storage Bucket
    let { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type || "image/png",
        upsert: true,
      });

    // 2. If bucket is not found, attempt to create bucket and retry
    if (error && (error.message?.includes("Bucket not found") || error.message?.includes("not found"))) {
      console.log(`Bucket '${BUCKET_NAME}' not found. Attempting to create bucket...`);
      const { error: createBucketError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml", "image/gif"],
      });

      if (!createBucketError) {
        // Retry upload after creating bucket
        const retry = await supabase.storage.from(BUCKET_NAME).upload(filePath, buffer, {
          contentType: file.type || "image/png",
          upsert: true,
        });
        data = retry.data;
        error = retry.error;
      }
    }

    if (error) {
      console.error("Supabase storage upload error:", error);

      if (error.message?.includes("Bucket not found") || error.message?.includes("not found")) {
        return NextResponse.json(
          {
            error: `Bucket '${BUCKET_NAME}' belum dibuat di dashboard Supabase. Silakan buka Supabase Dashboard ➔ Storage ➔ 'New bucket' ➔ Beri nama '${BUCKET_NAME}' dan centang 'Public' ➔ Save.`,
          },
          { status: 404 }
        );
      }

      return NextResponse.json({ error: `Gagal upload ke storage: ${error.message}` }, { status: 500 });
    }

    // 3. Get public accessible URL
    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      path: data?.path || filePath,
      fileName: file.name,
      contentType: file.type,
      size: file.size,
    });
  } catch (err: any) {
    console.error("Upload API route fatal error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
