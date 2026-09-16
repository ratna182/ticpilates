import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting TICPILATES seed...');

  // 1. Default Branch
  const branch = await prisma.branch.upsert({
    where: { id: 'branch-kemang-01' },
    update: {
      address: 'Jl. Menteng III No.1, Pd. Ranji, Kec. Ciputat Tim., Kota Tangerang Selatan, Banten 15412',
    },
    create: {
      id: 'branch-kemang-01',
      name: 'TICPILATES Kemang Studio',
      address: 'Jl. Menteng III No.1, Pd. Ranji, Kec. Ciputat Tim., Kota Tangerang Selatan, Banten 15412',
      phone: '0812-9876-5432',
    },
  });
  console.log(`✓ Branch created: ${branch.name}`);

  // 2. Admin User (admin@ticpilates.com / admin123)
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);

  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@ticpilates.com' },
    update: { passwordHash },
    create: {
      id: 'admin-01',
      branchId: branch.id,
      name: 'Owner & Head Admin',
      email: 'admin@ticpilates.com',
      passwordHash,
      role: 'admin',
    },
  });
  console.log(`✓ Admin user created: ${admin.email}`);

  // 3. Instructors
  const instructorsData = [
    {
      id: 'inst-01',
      name: 'Sarah Jenkins',
      phone: '0811-2233-4455',
      bio: 'Lead Reformer & Tower Specialist dengan sertifikasi internasional PMA, 8+ tahun pengalaman.',
      photoUrl: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400&q=80',
    },
    {
      id: 'inst-02',
      name: 'Maya Putri',
      phone: '0812-3344-5566',
      bio: 'Certified Comprehensive Pilates Instructor, spesialisasi koreksi postur, skoliosis & pre/post-natal.',
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
    },
    {
      id: 'inst-03',
      name: 'Aditya Pratama',
      phone: '0813-4455-6677',
      bio: 'Dynamic Athletic Reformer Coach, spesialis penguatan core fungsional & rehabilitasi cedera olahraga.',
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
    },
  ];

  for (const inst of instructorsData) {
    await prisma.instructor.upsert({
      where: { id: inst.id },
      update: inst,
      create: { ...inst, branchId: branch.id },
    });
  }
  console.log(`✓ Seeded ${instructorsData.length} instructors`);

  // 4. Services
  const servicesData = [
    {
      id: 'srv-01',
      name: 'Reformer Foundation (Group)',
      type: 'group',
      durationMin: 50,
      defaultCapacity: 6,
      description: 'Kelas reformer pengenalan teknik dasar, artikulasi tulang belakang, dan core activation dengan tempo terkontrol.',
    },
    {
      id: 'srv-02',
      name: 'Cadillac & Tower Flow (Group)',
      type: 'group',
      durationMin: 50,
      defaultCapacity: 4,
      description: 'Latihan dinamis dengan tower spring resistance untuk meningkatkan fleksibilitas dan kekuatan upper body.',
    },
    {
      id: 'srv-03',
      name: 'Mat Pilates & Core Focus (Group)',
      type: 'group',
      durationMin: 45,
      defaultCapacity: 8,
      description: 'Latihan matwork intensif fokus aktivasi otot inti terdalam, stabilitas panggul, dan mobilitas tubuh menyeluruh.',
    },
    {
      id: 'srv-04',
      name: 'Private 1-on-1 Personalized Session',
      type: 'private',
      durationMin: 60,
      defaultCapacity: 1,
      description: 'Sesi privat eksklusif 1-on-1 yang dipersonalisasi penuh sesuai kebutuhan postur, riwayat cedera, dan fitness goal klien.',
    },
  ];

  for (const srv of servicesData) {
    await prisma.service.upsert({
      where: { id: srv.id },
      update: srv,
      create: { ...srv, branchId: branch.id },
    });
  }
  console.log(`✓ Seeded ${servicesData.length} services`);

  // 5. Pricing Plans
  const plansData = [
    {
      id: 'plan-01',
      name: 'Single Class Pass',
      type: 'single',
      price: 250000,
      sessionCount: 1,
      durationDays: 14,
    },
    {
      id: 'plan-02',
      name: 'Starter 5-Class Pack',
      type: 'bundle',
      price: 1150000,
      sessionCount: 5,
      durationDays: 45,
    },
    {
      id: 'plan-03',
      name: 'Pro 10-Class Pack',
      type: 'bundle',
      price: 2100000,
      sessionCount: 10,
      durationDays: 90,
    },
    {
      id: 'plan-04',
      name: 'Monthly Unlimited Membership',
      type: 'membership',
      price: 2750000,
      sessionCount: null,
      durationDays: 30,
    },
  ];

  for (const plan of plansData) {
    await prisma.pricingPlan.upsert({
      where: { id: plan.id },
      update: plan,
      create: { ...plan, branchId: branch.id },
    });
  }
  console.log(`✓ Seeded ${plansData.length} pricing plans`);

  // 6. Promo Code
  await prisma.promoCode.upsert({
    where: { code: 'PILATESFIRST' },
    update: {},
    create: {
      id: 'promo-01',
      branchId: branch.id,
      code: 'PILATESFIRST',
      discountType: 'percent',
      discountValue: 20,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // +60 days
      usageLimit: 50,
      usageCount: 0,
    },
  });
  console.log('✓ Seeded promo code PILATESFIRST (20% off)');

  // 7. Demo Clients
  const clientsData = [
    {
      id: 'client-01',
      name: 'Dewi Lestari',
      phone: '081234567890',
      email: 'dewi.lestari@example.com',
      notes: 'Prefer reformer pagi, riwayat tegang bahu ringan.',
    },
    {
      id: 'client-02',
      name: 'Anindya Bakrie',
      phone: '081398765432',
      email: 'anindya.b@example.com',
      notes: 'Latihan rutin penguatan core & koreksi postur.',
    },
    {
      id: 'client-03',
      name: 'Budi Santoso',
      phone: '081122338899',
      email: 'budi.santoso@example.com',
      notes: 'Pemulihan lower back tightness pasca maraton.',
    },
    {
      id: 'client-04',
      name: 'Clarissa Wang',
      phone: '085677889900',
      email: 'clarissa.w@example.com',
      notes: 'Member reformer aktif tingkat intermediate.',
    },
  ];

  for (const c of clientsData) {
    await prisma.client.upsert({
      where: { id: c.id },
      update: c,
      create: { ...c, branchId: branch.id },
    });
  }
  console.log(`✓ Seeded ${clientsData.length} demo clients`);

  // 8. Demo Class Sessions (Today, Tomorrow, and Day After Tomorrow)
  const now = new Date();
  
  // Helper to create date with specific day offset and time (WIB / Local)
  const createDateTime = (dayOffset: number, hours: number, minutes: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const sessionsConfig = [
    // Today
    {
      id: 'sess-today-01',
      serviceId: 'srv-01', // Reformer Foundation (50 min, cap 6)
      instructorId: 'inst-01', // Sarah Jenkins
      startTime: createDateTime(0, 8, 0),
      endTime: createDateTime(0, 8, 50),
      capacity: 6,
    },
    {
      id: 'sess-today-02',
      serviceId: 'srv-02', // Tower Flow (50 min, cap 4)
      instructorId: 'inst-02', // Maya Putri
      startTime: createDateTime(0, 10, 0),
      endTime: createDateTime(0, 10, 50),
      capacity: 4,
    },
    {
      id: 'sess-today-03',
      serviceId: 'srv-03', // Mat Pilates (45 min, cap 8)
      instructorId: 'inst-03', // Aditya Pratama
      startTime: createDateTime(0, 14, 0),
      endTime: createDateTime(0, 14, 45),
      capacity: 8,
    },
    {
      id: 'sess-today-04',
      serviceId: 'srv-04', // Private 1-on-1 (60 min, cap 1)
      instructorId: 'inst-01', // Sarah Jenkins
      startTime: createDateTime(0, 16, 0),
      endTime: createDateTime(0, 17, 0),
      capacity: 1,
    },
    {
      id: 'sess-today-05',
      serviceId: 'srv-01', // Reformer Foundation (50 min, cap 6)
      instructorId: 'inst-02', // Maya Putri
      startTime: createDateTime(0, 18, 30),
      endTime: createDateTime(0, 19, 20),
      capacity: 6,
    },
    // Tomorrow
    {
      id: 'sess-tmr-01',
      serviceId: 'srv-01',
      instructorId: 'inst-02',
      startTime: createDateTime(1, 8, 30),
      endTime: createDateTime(1, 9, 20),
      capacity: 6,
    },
    {
      id: 'sess-tmr-02',
      serviceId: 'srv-02',
      instructorId: 'inst-01',
      startTime: createDateTime(1, 11, 0),
      endTime: createDateTime(1, 11, 50),
      capacity: 4,
    },
    {
      id: 'sess-tmr-03',
      serviceId: 'srv-03',
      instructorId: 'inst-03',
      startTime: createDateTime(1, 15, 30),
      endTime: createDateTime(1, 16, 15),
      capacity: 8,
    },
    {
      id: 'sess-tmr-04',
      serviceId: 'srv-01',
      instructorId: 'inst-01',
      startTime: createDateTime(1, 18, 0),
      endTime: createDateTime(1, 18, 50),
      capacity: 6,
    },
    // Day 2
    {
      id: 'sess-d2-01',
      serviceId: 'srv-02',
      instructorId: 'inst-02',
      startTime: createDateTime(2, 9, 0),
      endTime: createDateTime(2, 9, 50),
      capacity: 4,
    },
    {
      id: 'sess-d2-02',
      serviceId: 'srv-01',
      instructorId: 'inst-03',
      startTime: createDateTime(2, 13, 0),
      endTime: createDateTime(2, 13, 50),
      capacity: 6,
    },
  ];

  for (const s of sessionsConfig) {
    await prisma.classSession.upsert({
      where: { id: s.id },
      update: {
        ...s,
        status: 'scheduled',
      },
      create: {
        ...s,
        branchId: branch.id,
        status: 'scheduled',
      },
    });
  }
  console.log(`✓ Seeded ${sessionsConfig.length} class sessions`);

  // 9. Demo Confirmed Bookings with Transactions
  const demoBookings = [
    {
      id: 'book-demo-01',
      clientId: 'client-01',
      classSessionId: 'sess-today-01',
      code: 'TP-BK-7001',
      status: 'confirmed',
    },
    {
      id: 'book-demo-02',
      clientId: 'client-02',
      classSessionId: 'sess-today-01',
      code: 'TP-BK-7002',
      status: 'confirmed',
    },
    {
      id: 'book-demo-03',
      clientId: 'client-03',
      classSessionId: 'sess-today-02',
      code: 'TP-BK-7003',
      status: 'confirmed',
    },
    {
      id: 'book-demo-04',
      clientId: 'client-04',
      classSessionId: 'sess-today-02',
      code: 'TP-BK-7004',
      status: 'checked-in',
    },
    {
      id: 'book-demo-05',
      clientId: 'client-02',
      classSessionId: 'sess-tmr-01',
      code: 'TP-BK-8001',
      status: 'confirmed',
    },
  ];

  for (const b of demoBookings) {
    const trx = await prisma.transaction.upsert({
      where: { id: `trx-${b.id}` },
      update: {},
      create: {
        id: `trx-${b.id}`,
        branchId: branch.id,
        clientId: b.clientId,
        amount: 250000,
        method: 'qris',
        status: 'paid',
      },
    });

    await prisma.booking.upsert({
      where: { id: b.id },
      update: {
        status: b.status,
      },
      create: {
        id: b.id,
        clientId: b.clientId,
        classSessionId: b.classSessionId,
        status: b.status,
        qrCode: `TICPILATES:BOOKING:${b.code}`,
        transactionId: trx.id,
      },
    });
  }
  console.log(`✓ Seeded ${demoBookings.length} confirmed demo bookings`);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
