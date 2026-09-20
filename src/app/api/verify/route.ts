import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
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

    const existingProof = await db.paymentProof.findFirst({
      where: { userId: session.user.id, status: { in: ["pending", "approved"] } },
    });
    if (existingProof) {
      return NextResponse.json({ error: "You already have a pending proof" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "jpg";
    const safeName = `${session.user.id}-${Date.now()}.${ext}`;
    const fs = require("fs");
    const path = require("path");
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(path.join(uploadDir, safeName), buffer);

    const proof = await db.paymentProof.create({
      data: {
        id: uuidv4(),
        userId: session.user.id,
        fileUrl: `/uploads/${safeName}`,
        fileName: file.name,
        mimeType: file.type,
        status: "pending",
      },
    });

    await db.userProfile.update({
      where: { userId: session.user.id },
      data: { verificationStatus: "proof_submitted" },
    });

    return NextResponse.json({ success: true, proof: { id: proof.id, status: proof.status } });
  } catch (error) {
    console.error("Upload proof error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
