const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Función para crear un PDF con contenido
function createInvoicePDF(facturaData, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      // Crear directorio si no existe
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Crear PDF
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(outputPath);
      
      // Configurar eventos
      writeStream.on('finish', () => resolve(true));
      writeStream.on('error', reject);
      
      // Pipe del PDF al stream de escritura
      doc.pipe(writeStream);
      
      // Añadir contenido
      doc.fontSize(25)
         .text('FACTURA', 50, 50)
         .fontSize(12)
         .text(`Factura Nº: ${facturaData.name}`, 50, 90)
         .text(`Fecha: 17/05/2025`, 50, 110)
         .moveDown();
      
      // Información de proveedor y departamento
      doc.fontSize(14)
         .text('Información', 50, 140)
         .fontSize(10)
         .text(`ID Factura: ${facturaData.id}`, 50, 160)
         .text(`Departamento: ${facturaData.path.split('/')[2]}`, 50, 180)
         .moveDown();
      
      // Añadir más contenido...
      doc.fontSize(14)
         .text('Detalles', 50, 220);
      
      doc.fontSize(10)
         .text('Esta factura fue generada automáticamente por el sistema.', 50, 240)
         .text('© 2025 Salesianos Zaragoza', 50, 700, { align: 'center' });
      
      // Finalizar el documento
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Nuevas rutas actualizadas (mismas que antes)
const updatedPaths = [
  {id: 1, path: "public/facturas/2025/inf/fac-inf-123456.pdf", name: "FAC-INF-123456"},
  {id: 2, path: "public/facturas/2025/inf/fac-inf-789012.pdf", name: "FAC-INF-789012"},
  {id: 3, path: "public/facturas/2025/inf/fac-inf-234567.pdf", name: "FAC-INF-234567"},
  {id: 4, path: "public/facturas/2025/mec/fac-mec-345678.pdf", name: "FAC-MEC-345678"},
  {id: 5, path: "public/facturas/2025/mec/fac-mec-456789.pdf", name: "FAC-MEC-456789"},
  {id: 6, path: "public/facturas/2025/ele/fac-ele-567890.pdf", name: "FAC-ELE-567890"},
  {id: 7, path: "public/facturas/2025/ele/fac-ele-678901.pdf", name: "FAC-ELE-678901"},
  {id: 8, path: "public/facturas/2025/rob/fac-rob-789012.pdf", name: "FAC-ROB-789012"},
  {id: 9, path: "public/facturas/2025/rob/fac-rob-890123.pdf", name: "FAC-ROB-890123"},
  {id: 10, path: "public/facturas/2025/aut/fac-aut-901234.pdf", name: "FAC-AUT-901234"},
  {id: 11, path: "public/facturas/2025/aut/fac-aut-012345.pdf", name: "FAC-AUT-012345"}
];

// Procesar cada factura
async function procesarFacturas() {
  let createdCount = 0;
  
  for (const facturaData of updatedPaths) {
    try {
      // Ruta completa
      const fullPath = path.join(process.cwd(), facturaData.path);
      
      // Crear el PDF
      await createInvoicePDF(facturaData, fullPath);
      
      console.log(`✅ PDF creado con contenido: ${fullPath} (Factura ${facturaData.name})`);
      createdCount++;
    } catch (error) {
      console.error(`❌ Error creando PDF para factura ${facturaData.id} (${facturaData.name}):`, error.message);
    }
  }
  
  console.log(`\n📊 Resumen: ${createdCount}/${updatedPaths.length} PDFs creados correctamente.`);
}

// Ejecutar el proceso
procesarFacturas();