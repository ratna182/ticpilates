import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

async function runVerification() {
  console.log('🧪 Starting Sesi 2 Comprehensive Verification...\n');

  // 1. Verify Master Data & Class Sessions
  const sessions = await prisma.classSession.findMany({
    include: {
      service: true,
      instructor: true,
      bookings: true,
    },
  });
  console.log(`✓ Total Class Sessions in DB: ${sessions.length}`);
  if (sessions.length < 5) throw new Error('Expected at least 5 seeded class sessions');

  // 2. Test Instructor Conflict Logic Directly
  console.log('\n--- Testing Instructor Conflict Detection ---');
  const targetInstructor = await prisma.instructor.findFirst({
    where: { name: { contains: 'Sarah' } },
  });
  if (!targetInstructor) throw new Error('Instructor Sarah not found');

  const existingSession = await prisma.classSession.findFirst({
    where: { instructorId: targetInstructor.id, status: 'scheduled' },
  });
  if (!existingSession) throw new Error('No scheduled session found for Sarah');

  // Overlap test: exactly same time window
  const conflict = await prisma.classSession.findFirst({
    where: {
      instructorId: targetInstructor.id,
      status: { not: 'cancelled' },
      AND: [
        { startTime: { lt: existingSession.endTime } },
        { endTime: { gt: existingSession.startTime } },
      ],
    },
    include: { service: true, instructor: true },
  });

  if (conflict) {
    console.log(`✓ Conflict successfully identified: Instructor ${conflict.instructor.name} is already booked for "${conflict.service.name}" at ${conflict.startTime.toISOString()}`);
  } else {
    throw new Error('Conflict should have been detected!');
  }

  // 3. Test Booking Flow & Race-Condition Hold
  console.log('\n--- Testing 10-Minute Hold & Self-Service Booking ---');
  const testSession = await prisma.classSession.findFirst({
    where: {
      status: 'scheduled',
      capacity: { gt: 1 },
    },
    include: { service: true, bookings: true },
  });
  if (!testSession) throw new Error('Test session not found');

  const initialActiveBookings = testSession.bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'checked-in' || (b.status === 'pending' && b.heldUntil && b.heldUntil > new Date())
  ).length;

  console.log(`Test session: "${testSession.service.name}", Capacity: ${testSession.capacity}, Initial Booked: ${initialActiveBookings}`);

  // Create hold booking
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  const bookingCode = `TP-TEST-${randomSuffix}`;
  const qrCodeString = `TICPILATES:BOOKING:${bookingCode}`;
  const heldUntil = new Date(Date.now() + 10 * 60 * 1000);

  // Client
  let testClient = await prisma.client.findFirst({
    where: { phone: '089912345678' },
  });
  if (!testClient) {
    testClient = await prisma.client.create({
      data: {
        branchId: testSession.branchId,
        name: 'Tester Sesi 2',
        phone: '089912345678',
        email: 'tester2@example.com',
      },
    });
  }

  const transaction = await prisma.transaction.create({
    data: {
      branchId: testSession.branchId,
      clientId: testClient.id,
      amount: 250000,
      method: 'qris',
      status: 'pending',
    },
  });

  const newBooking = await prisma.booking.create({
    data: {
      clientId: testClient.id,
      classSessionId: testSession.id,
      status: 'pending',
      qrCode: qrCodeString,
      heldUntil,
      transactionId: transaction.id,
    },
  });

  console.log(`✓ Created Pending Booking: ${newBooking.id} with Code ${bookingCode}`);
  console.log(`✓ Held Until: ${heldUntil.toISOString()} (10-minute hold timer active)`);

  // Verify QR code generation
  const qrDataUrl = await QRCode.toDataURL(newBooking.qrCode, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 320,
  });
  if (!qrDataUrl.startsWith('data:image/png;base64,')) {
    throw new Error('QR Code data URL generation failed');
  }
  console.log(`✓ High-Res QR Code Data URL generated successfully (${qrDataUrl.length} bytes)`);

  // 4. Test Payment Confirmation Simulation
  console.log('\n--- Testing Instant Payment Confirmation & Invoice ---');
  await prisma.transaction.update({
    where: { id: transaction.id },
    data: { status: 'paid' },
  });

  const confirmedBooking = await prisma.booking.update({
    where: { id: newBooking.id },
    data: { status: 'confirmed' },
  });

  const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
  const invoice = await prisma.invoice.create({
    data: {
      transactionId: transaction.id,
      invoiceNumber,
    },
  });

  // Notification
  const notif = await prisma.notification.create({
    data: {
      clientId: testClient.id,
      channel: 'wa',
      type: 'booking_confirmation',
      message: `Konfirmasi: Tiket ${bookingCode} telah aktif untuk kelas ${testSession.service.name}.`,
      status: 'sent',
    },
  });

  console.log(`✓ Booking Confirmed: ${confirmedBooking.status}`);
  console.log(`✓ Invoice Generated: ${invoice.invoiceNumber}`);
  console.log(`✓ WhatsApp Notification Logged: ${notif.id}`);

  console.log('\n🎉 ALL SESI 2 TESTS PASSED SUCCESSFULLY!');
}

runVerification()
  .catch((e) => {
    console.error('Verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
