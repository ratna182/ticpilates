import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  try {
    const services = await prisma.service.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { classSessions: true },
        },
      },
    });
    return NextResponse.json({ ok: true, data: services });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Gagal mengambil data layanan' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, type, durationMin, defaultCapacity, description, active } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nama layanan wajib diisi' }, { status: 400 });
    }
    if (!type || !['group', 'private'].includes(type)) {
      return NextResponse.json({ error: 'Tipe layanan harus berupa group atau private' }, { status: 400 });
    }
    const duration = parseInt(durationMin, 10);
    const capacity = parseInt(defaultCapacity, 10);

    if (isNaN(duration) || duration <= 0) {
      return NextResponse.json({ error: 'Durasi harus berupa angka lebih dari 0 menit' }, { status: 400 });
    }
    if (isNaN(capacity) || capacity <= 0) {
      return NextResponse.json({ error: 'Kapasitas default harus lebih dari 0' }, { status: 400 });
    }

    // Default branch
    const branch = await prisma.branch.findFirst();
    if (!branch) {
      return NextResponse.json({ error: 'Data cabang tidak ditemukan' }, { status: 500 });
    }

    const service = await prisma.service.create({
      data: {
        branchId: branch.id,
        name: name.trim(),
        type,
        durationMin: duration,
        defaultCapacity: capacity,
        description: description?.trim() || null,
        active: active !== undefined ? Boolean(active) : true,
      },
    });

    return NextResponse.json({ ok: true, data: service }, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Gagal menyimpan layanan baru' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, name, type, durationMin, defaultCapacity, description, active } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID layanan diperlukan' }, { status: 400 });
    }

    const updated = await prisma.service.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(type && { type }),
        ...(durationMin !== undefined && { durationMin: parseInt(durationMin, 10) }),
        ...(defaultCapacity !== undefined && { defaultCapacity: parseInt(defaultCapacity, 10) }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(active !== undefined && { active: Boolean(active) }),
      },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({ error: 'Gagal memperbarui data layanan' }, { status: 500 });
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
      return NextResponse.json({ error: 'ID layanan diperlukan' }, { status: 400 });
    }

    // Check if service is used in class sessions
    const sessionCount = await prisma.classSession.count({
      where: { serviceId: id },
    });

    if (sessionCount > 0) {
      // Soft deactivate instead of hard delete to preserve historical integrity
      const deactivated = await prisma.service.update({
        where: { id },
        data: { active: false },
      });
      return NextResponse.json({
        ok: true,
        message: 'Layanan dinonaktifkan karena sudah terkait dengan riwayat jadwal',
        data: deactivated,
      });
    }

    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true, message: 'Layanan berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ error: 'Gagal menghapus layanan' }, { status: 500 });
  }
}
