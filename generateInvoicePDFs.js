const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Rutas de facturas actualizadas
const updatedPaths = [
  {id: 1, path: "public/facturas/2025/inf/fac-inf-123456.pdf", name: "FAC-INF-123456", ordenCompra: "OC-2025-001", proveedor: "Informática Total", descripcion: "Equipos informáticos para aulas", cantidad: 15, importe: 12500.00},
  {id: 2, path: "public/facturas/2025/inf/fac-inf-789012.pdf", name: "FAC-INF-789012", ordenCompra: "OC-2025-002", proveedor: "CompuTech", descripcion: "Licencias de software educativo", cantidad: 50, importe: 2500.00},
  {id: 3, path: "public/facturas/2025/inf/fac-inf-234567.pdf", name: "FAC-INF-234567", ordenCompra: "OC-2025-003", proveedor: "DataServ", descripcion: "Mantenimiento de servidores", cantidad: 1, importe: 4200.00},
  {id: 4, path: "public/facturas/2025/mec/fac-mec-345678.pdf", name: "FAC-MEC-345678", ordenCompra: "OC-2025-004", proveedor: "MecaTech", descripcion: "Equipamiento de taller mecánico", cantidad: 8, importe: 7800.00},
  {id: 5, path: "public/facturas/2025/mec/fac-mec-456789.pdf", name: "FAC-MEC-456789", ordenCompra: "OC-2025-005", proveedor: "Herramientas Pro", descripcion: "Herramientas especializadas", cantidad: 25, importe: 3600.00},
  {id: 6, path: "public/facturas/2025/ele/fac-ele-567890.pdf", name: "FAC-ELE-567890", ordenCompra: "OC-2025-006", proveedor: "ElectroSuministros", descripcion: "Material eléctrico", cantidad: 100, importe: 5200.00},
  {id: 7, path: "public/facturas/2025/ele/fac-ele-678901.pdf", name: "FAC-ELE-678901", ordenCompra: "OC-2025-007", proveedor: "ElectroPower", descripcion: "Equipos de medición", cantidad: 12, importe: 9400.00},
  {id: 8, path: "public/facturas/2025/rob/fac-rob-789012.pdf", name: "FAC-ROB-789012", ordenCompra: "OC-2025-008", proveedor: "RoboTech", descripcion: "Kits de robótica educativa", cantidad: 20, importe: 8800.00},
  {id: 9, path: "public/facturas/2025/rob/fac-rob-890123.pdf", name: "FAC-ROB-890123", ordenCompra: "OC-2025-009", proveedor: "AutomationSys", descripcion: "Componentes de automatización", cantidad: 30, importe: 6300.00},
  {id: 10, path: "public/facturas/2025/aut/fac-aut-901234.pdf", name: "FAC-AUT-901234", ordenCompra: "OC-2025-010", proveedor: "AutoParts", descripcion: "Repuestos de automoción", cantidad: 45, importe: 7900.00},
  {id: 11, path: "public/facturas/2025/aut/fac-aut-012345.pdf", name: "FAC-AUT-012345", ordenCompra: "OC-2025-011", proveedor: "MecánicaAvanzada", descripcion: "Equipos de diagnóstico", cantidad: 5, importe: 11200.00}
];

// Función para crear un PDF con contenido mejorado
function createEnhancedInvoicePDF(facturaData, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      // Crear directorio si no existe
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Crear PDF con opciones mejoradas
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        info: {
          Title: `Factura ${facturaData.name}`,
          Author: 'Salesianos Zaragoza',
          Subject: 'Factura'
        }
      });
      
      const writeStream = fs.createWriteStream(outputPath);
      
      // Configurar eventos
      writeStream.on('finish', () => resolve(true));
      writeStream.on('error', reject);
      
      // Pipe del PDF al stream de escritura
      doc.pipe(writeStream);
      
      // CABECERA: Posicionamiento vertical controlado
      let yPos = 40; // Posición inicial
      
      // Logo (en caso de tenerlo disponible)
      // Si hay un logo, descomentar estas líneas y añadir la ruta correcta
      // doc.image('path/to/logo.png', 50, yPos, { width: 50 });
      
      // Título y Número de Factura
      doc.fontSize(22)
         .fillColor('#E02D39')
         .text('FACTURA', 50, yPos, { align: 'left' });
      
      yPos += 30;
      
      // Número de factura y fecha en la misma línea
      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(`Factura Nº: ${facturaData.name}`, 50, yPos);
      
      doc.fontSize(11)
         .font('Helvetica')
         .text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 300, yPos);
      
      yPos += 25;
      
      // INFORMACIÓN DE CABECERA
      // Añadir un rectángulo gris claro para el área de información
      doc.rect(50, yPos, doc.page.width - 100, 70)
         .fillAndStroke('#f6f6f6', '#cccccc');
      
      // Contenido dentro del rectángulo
      doc.fillColor('#000000')
         .fontSize(10)
         .text('INFORMACIÓN', 60, yPos + 10, { underline: true });
      
      // Obtener departamento de la ruta
      const departamento = facturaData.path.split('/')[2];
      
      doc.font('Helvetica')
         .text(`ID Factura: ${facturaData.id}`, 60, yPos + 25)
         .text(`Departamento: ${departamento}`, 60, yPos + 40)
         .text(`Orden de Compra: ${facturaData.ordenCompra || 'N/A'}`, 60, yPos + 55);
      
      yPos += 85;
      
      // INFORMACIÓN DE PROVEEDOR
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('Datos del Proveedor', 50, yPos);
      
      yPos += 20;
      
      doc.fontSize(10)
         .font('Helvetica')
         .text(`Proveedor: ${facturaData.proveedor || 'Información no disponible'}`, 50, yPos)
         .text(`NIF: ${facturaData.nifProveedor || 'Información no disponible'}`, 50, yPos + 15)
         .text(`Dirección: ${facturaData.direccionProveedor || 'Información no disponible'}`, 50, yPos + 30)
         .text(`Teléfono: ${facturaData.telefonoProveedor || 'Información no disponible'}`, 50, yPos + 45);
      
      yPos += 75;
      
      // DESCRIPCIÓN DE LA ORDEN DE COMPRA
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('Descripción de la Orden de Compra', 50, yPos);
      
      yPos += 20;
      
      // Tabla de descripción
      const tableTop = yPos;
      const tableHeaders = ['Descripción', 'Cantidad', 'Importe Unitario', 'Importe Total'];
      
      // Calcular importe unitario
      const importeUnitario = facturaData.cantidad ? facturaData.importe / facturaData.cantidad : facturaData.importe;
      
      const tableData = [
        [
          facturaData.descripcion || 'Orden de compra estándar', 
          facturaData.cantidad?.toString() || '1', 
          `${importeUnitario.toFixed(2)}€`, 
          `${facturaData.importe.toFixed(2)}€`
        ]
      ];
      
      // Dibujar la cabecera de la tabla
      doc.fontSize(10)
         .font('Helvetica-Bold');
      
      // Definir ancho de las columnas
      const columnWidth = (doc.page.width - 100) / tableHeaders.length;
      
      // Dibujar fondo de la cabecera
      doc.rect(50, tableTop, doc.page.width - 100, 20)
         .fill('#E02D39');
      
      // Dibujar texto de la cabecera
      doc.fillColor('#FFFFFF');
      tableHeaders.forEach((header, i) => {
        doc.text(header, 50 + (i * columnWidth), tableTop + 5, { 
          width: columnWidth, 
          align: 'center'
        });
      });
      
      // Dibujar datos de la tabla
      doc.fillColor('#000000')
         .font('Helvetica');
      
      tableData.forEach((row, rowIndex) => {
        const rowY = tableTop + 20 + (rowIndex * 20);
        
        // Alternar colores de fondo para las filas
        doc.rect(50, rowY, doc.page.width - 100, 20)
           .fill(rowIndex % 2 === 0 ? '#f6f6f6' : '#FFFFFF');
        
        row.forEach((cell, cellIndex) => {
          doc.fillColor('#000000')
             .text(cell, 50 + (cellIndex * columnWidth), rowY + 5, { 
               width: columnWidth, 
               align: cellIndex === 0 ? 'left' : 'center' 
             });
        });
      });
      
      yPos = tableTop + 50;
      
      // RESUMEN DE IMPORTES
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('Resumen', 50, yPos);
      
      yPos += 20;
      
      // Línea de subtotal
      doc.fontSize(10)
         .font('Helvetica')
         .text('Subtotal:', 350, yPos, { width: 100, align: 'right' })
         .text(`${facturaData.importe.toFixed(2)}€`, 450, yPos, { align: 'right' });
      
      // Línea de IVA (simulado)
      const iva = facturaData.importe * 0.21;
      doc.text('IVA (21%):', 350, yPos + 15, { width: 100, align: 'right' })
         .text(`${iva.toFixed(2)}€`, 450, yPos + 15, { align: 'right' });
      
      // Línea para separar
      doc.moveTo(350, yPos + 30)
         .lineTo(500, yPos + 30)
         .stroke();
      
      // Línea de total
      const total = facturaData.importe * 1.21;
      doc.font('Helvetica-Bold')
         .text('TOTAL:', 350, yPos + 40, { width: 100, align: 'right' })
         .text(`${total.toFixed(2)}€`, 450, yPos + 40, { align: 'right' });
      
      // PIE DE PÁGINA
      const pageHeight = doc.page.height;
      
      // Línea divisoria
      doc.moveTo(50, pageHeight - 100)
         .lineTo(doc.page.width - 50, pageHeight - 100)
         .stroke('#cccccc');
      
      // Texto del pie
      doc.fontSize(9)
         .fillColor('#666666')
         .text('Esta factura fue generada automáticamente por el sistema.', 50, pageHeight - 90)
         .text('Sin el sello y la firma correspondiente, este documento carece de valor contable.', 50, pageHeight - 75);
      
      // Texto de copyright
      doc.fontSize(8)
         .text('© 2025 Salesianos Zaragoza', 0, pageHeight - 50, { align: 'center' });
      
      // Finalizar el documento
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Procesar cada factura
async function procesarFacturas() {
  let createdCount = 0;
  
  for (const facturaData of updatedPaths) {
    try {
      // Ruta completa
      const fullPath = path.join(process.cwd(), facturaData.path);
      
      // Crear el PDF
      await createEnhancedInvoicePDF(facturaData, fullPath);
      
      console.log(`✅ PDF creado con contenido mejorado: ${fullPath} (Factura ${facturaData.name})`);
      createdCount++;
    } catch (error) {
      console.error(`❌ Error creando PDF para factura ${facturaData.id} (${facturaData.name}):`, error.message);
    }
  }
  
  console.log(`\n📊 Resumen: ${createdCount}/${updatedPaths.length} PDFs creados correctamente.`);
}

// Ejecutar el proceso
console.log('🚀 Iniciando generación de PDFs de facturas...');
procesarFacturas().then(() => {
  console.log('✨ Proceso completado con éxito.');
}).catch((error) => {
  console.error('❌ Error en el proceso general:', error);
});