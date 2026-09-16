import React from 'react';
import Link from 'next/link';
import { LucideIcon, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

interface ModulePlaceholderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  sessionNumber: number;
  sessionName: string;
  features: string[];
}

export default function ModulePlaceholder({
  title,
  subtitle,
  icon: Icon,
  sessionNumber,
  sessionName,
  features,
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      <div className="bg-white rounded-3xl p-8 border border-[#EAE6DF] subtle-shadow text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#EBF7EE] text-[#2D6A4F] flex items-center justify-center mx-auto mb-4 border border-[#D8F3DC]">
          <Icon className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F5] text-[#C08A3E] border border-[#EAE6DF] text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Dijadwalkan pada Sesi {sessionNumber}: {sessionName}</span>
        </div>

        <h1 className="text-2xl font-bold text-[#1C2427]">{title}</h1>
        <p className="text-sm text-[#667085] mt-2 max-w-xl mx-auto leading-relaxed">
          {subtitle}
        </p>

        <div className="mt-8 p-6 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] max-w-md mx-auto text-left">
          <div className="text-xs font-bold text-[#1C2427] mb-3 uppercase tracking-wider">
            Fitur yang Akan Hadir di Sesi {sessionNumber}:
          </div>
          <ul className="space-y-2 text-xs text-[#475467]">
            {features.map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] mt-1.5 shrink-0" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#EAE6DF] text-xs font-semibold text-[#1C2427] hover:bg-[#FAF8F5] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </Link>
          <Link
            href="/admin/services"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1E4633] text-white text-xs font-semibold transition-all shadow-sm"
          >
            <span>Buka Layanan (Sesi 1)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
