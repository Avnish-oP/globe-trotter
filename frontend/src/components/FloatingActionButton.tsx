'use client';

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

export default function FloatingActionButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/trips/new')}
      className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-500 to-violet-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
    >
      {/* Pulse Animation (non-interactive) */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-violet-600 opacity-20 animate-ping pointer-events-none"></div>

      {/* Icon */}
      <Plus size={24} />
    </button>
  );
}
