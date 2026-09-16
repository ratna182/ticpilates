'use client';

import React from 'react';
import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#EAE6DF] bg-white text-[#475467] hover:bg-[#FAF8F5] transition-all cursor-pointer shadow-xs"
    >
      <Printer className="w-3.5 h-3.5" />
      <span>Cetak / Simpan PDF</span>
    </button>
  );
}
