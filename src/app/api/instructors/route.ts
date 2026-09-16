import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  try {
    const instructors = await prisma.instructor.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { classSessions: true },
        },
      },
    });
    return NextResponse.json({ ok: true, data: instructors });
  } catch (error) {
    console.error('Error fetching instructors:', error);
    return NextResponse.json({ error: 'Gagal mengambil data instruktur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, phone, bio, photoUrl, active } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nama instruktur wajib diisi' }, { status: 400 });
    }

    const branch = await prisma.branch.findFirst();
    if (!branch) {
      return NextResponse.json({ error: 'Data cabang tidak ditemukan' }, { status: 500 });
    }

    const instructor = await prisma.instructor.create({
      data: {
        branchId: branch.id,
        name: name.trim(),
        phone: phone?.trim() || null,
        bio: bio?.trim() || null,
        photoUrl: photoUrl?.trim() || null,
        active: active !== undefined ? Boolean(active) : true,
      },
    });

    return NextResponse.json({ ok: true, data: instructor }, { status: 201 });
  } catch (error) {
    console.error('Error creating instructor:', error);
    return NextResponse.json({ error: 'Gagal menyimpan instruktur baru' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, name, phone, bio, photoUrl, active } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID instruktur diperlukan' }, { status: 400 });
    }

    const updated = await prisma.instructor.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(bio !== undefined && { bio: bio?.trim() || null }),
        ...(photoUrl !== undefined && { photoUrl: photoUrl?.trim() || null }),
        ...(active !== undefined && { active: Boolean(active) }),
      },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    console.error('Error updating instructor:', error);
    return NextResponse.json({ error: 'Gagal memperbarui data instruktur' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID instruktur diperlukan' }, { status: 400 });
    }

    const sessionCount = await prisma.classSession.count({
      where: { instructorId: id },
    });

    if (sessionCount > 0) {
      const deactivated = await prisma.instructor.update({
        where: { id },
        data: { active: false },
      });
      return NextResponse.json({
        ok: true,
        message: 'Instruktur dinonaktifkan karena sudah memiliki riwayat sesi kelas',
        data: deactivated,
      });
    }

    await prisma.instructor.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true, message: 'Instruktur berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting instructor:', error);
    return NextResponse.json({ error: 'Gagal menghapus instruktur' }, { status: 500 });
  }
}
