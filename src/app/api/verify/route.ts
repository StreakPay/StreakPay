import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const { data: existingProof } = await supabase
      .from("payment_proofs")
      .select("id")
      .eq("user_id", user.id)
      .in("status", ["pending"])
      .limit(1)
      .single();

    if (existingProof) {
      return NextResponse.json({ error: "You already have a pending proof" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "jpg";
    const storagePath = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(storagePath, buffer, { contentType: file.type });

    let fileUrl: string;
    if (uploadError) {
      fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/payment-proofs/${storagePath}`;
    } else {
      const { data: urlData } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(storagePath);
      fileUrl = urlData.publicUrl;
    }

    const { data: proof, error: proofError } = await supabase
      .from("payment_proofs")
      .insert({
        user_id: user.id,
        file_url: fileUrl,
        file_name: file.name,
        mime_type: file.type,
        status: "pending",
      })
      .select("id, status")
      .single();

    if (proofError) throw proofError;

    await supabase
      .from("profiles")
      .update({ verification_status: "proof_submitted" })
      .eq("id", user.id);

    return NextResponse.json({ success: true, proof: { id: proof.id, status: proof.status } });
  } catch (error) {
    console.error("Upload proof error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
