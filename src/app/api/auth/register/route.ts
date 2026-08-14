import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanPassword.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email ini sudah terdaftar" },
        { status: 409 }
      );
    }

    // Use hashSync for 100% synchronous, reliable hashing
    const hashedPassword = bcrypt.hashSync(cleanPassword, 10);

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        name: name?.trim() || null,
      },
    });

    console.log("Registered user successfully:", user.email);

    return NextResponse.json(
      { message: "Akun berhasil dibuat", userId: user.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Register Error Details:", error);
    return NextResponse.json(
      { error: error?.message || "Terjadi kesalahan server saat mendaftar" },
      { status: 500 }
    );
  }
}
