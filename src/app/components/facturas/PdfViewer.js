"use client"

import { useState, useEffect } from 'react';
import { File, Download, ExternalLink } from 'lucide-react';

export default function PdfViewer({ pdfUrl, fileName, onClose }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simplemente para simular la carga del PDF
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [pdfUrl]);

  const handleDownload = () => {
    window.open(pdfUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center">
            <File className="w-5 h-5 mr-2 text-red-600" />
            <h2 className="text-xl font-semibold">{fileName || 'Factura PDF'}</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="bg-blue-600 text-white px-3 py-1 rounded-md flex items-center"
            >
              <Download className="w-4 h-4 mr-1" />
              <span>Descargar</span>
            </button>
            <button
              onClick={onClose}
              className="bg-gray-200 px-2 py-1 rounded-md text-gray-800"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-hidden p-1 bg-gray-100">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center text-red-600">
              <p>{error}</p>
            </div>
          ) : (
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0`}
              className="w-full h-full border-0"
              title="Visor de PDF"
            />
          )}
        </div>

        <div className="p-3 bg-gray-50 border-t flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Puede ser necesario permitir la visualización de PDFs en su navegador
          </span>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 flex items-center text-sm hover:underline"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Abrir en nueva pestaña
          </a>
        </div>
      </div>
    </div>
  );
}