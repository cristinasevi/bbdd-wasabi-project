"use client"

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, AlertTriangle } from 'lucide-react';

export default function SessionWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const message = searchParams.get('message');
    if (message === 'session_expired') {
      setShowWarning(true);
    }
  }, [searchParams]);

  if (!showWarning) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-yellow-800">
              Tu sesión expiró. Por favor, inicia sesión nuevamente.
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Recuerda hacer logout antes de cerrar la ventana.
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              className="bg-yellow-50 rounded-md inline-flex text-yellow-400 hover:text-yellow-500"
              onClick={() => setShowWarning(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}