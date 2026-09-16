import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSessionToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan kata sandi wajib diisi' },
        { status: 400 }
      );
    }

    const admin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { branch: true },
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'Email atau kata sandi tidak valid' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Email atau kata sandi tidak valid' },
        { status: 401 }
      );
    }

    // Generate JWT
    const token = await createSessionToken({
      userId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      branchId: admin.branchId,
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        branch: admin.branch?.name,
      },
    });

    // Set HTTP-Only Cookie (7 days)
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat proses masuk' },
      { status: 500 }
    );
  }
}
