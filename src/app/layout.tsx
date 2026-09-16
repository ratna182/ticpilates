import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TICPILATES — Studio Management & Booking System',
  description: 'Sistem manajemen studio Pilates terintegrasi: jadwal kelas, booking mandiri, membership, dan check-in kehadiran.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#FAF8F5] text-[#1C2427]">
        {children}
      </body>
    </html>
  );
}
