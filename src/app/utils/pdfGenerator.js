const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

/**
 * Función para generar un PDF de factura con formato mejorado
 * @param {Object} facturaData - Datos de la factura
 * @param {string} outputPath - Ruta completa donde guardar el PDF
 * @returns {Promise<boolean>} - true si se generó correctamente
 */
export async function generateInvoicePDF(facturaData, outputPath) {
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
          Title: `Factura ${facturaData.Num_factura}`,
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
      
      // CABECERA
      // Logo (si existe, descomentar y poner la ruta correcta)
      try {
        const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.jpg');
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, 45, { width: 50 });
        }
      } catch (error) {
        console.log('Logo no encontrado, continuando sin él...');
      }
      
      // Título y Número de Factura
      doc.fontSize(25)
         .fillColor('#E02D39')
         .text('FACTURA', 50, 50, { align: 'left' })
         .moveDown(0.5);
      
      doc.fontSize(12)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(`Factura Nº: ${facturaData.Num_factura}`, { continued: true })
         .font('Helvetica')
         .text(`                             Fecha: ${formatDate(facturaData.Fecha_emision)}`, { align: 'left' })
         .moveDown(0.5);
      
      // INFORMACIÓN DE CABECERA
      // Añadir un rectángulo gris claro para el área de información
      doc.rect(50, doc.y, doc.page.width - 100, 80)
         .fillAndStroke('#f6f6f6', '#cccccc');
      
      // Contenido dentro del rectángulo
      doc.fillColor('#000000')
         .fontSize(10)
         .text('INFORMACIÓN', 60, doc.y - 70, { underline: true })
         .moveDown(0.5);
         
      doc.font('Helvetica')
         .text(`ID Factura: ${facturaData.idFactura}`, 60, doc.y)
         .text(`Departamento: ${facturaData.Departamento}`, 60, doc.y + 15)
         .text(`Orden de Compra: ${facturaData.Num_orden}`, 60, doc.y + 30)
         .moveDown(2);
      
      // INFORMACIÓN DE PROVEEDOR
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Datos del Proveedor', 50, doc.y)
         .moveDown(0.5);
      
      doc.fontSize(10)
         .font('Helvetica')
         .text(`Proveedor: ${facturaData.Proveedor || 'Información no disponible'}`, 50, doc.y);
      
      // Intentamos obtener más información del proveedor si no está ya incluida
      if (!facturaData.NIF || !facturaData.Direccion || !facturaData.Telefono) {
        doc.text(`NIF: Información no disponible`, 50, doc.y + 15)
           .text(`Dirección: Información no disponible`, 50, doc.y + 30)
           .text(`Teléfono: Información no disponible`, 50, doc.y + 45);
      } else {
        doc.text(`NIF: ${facturaData.NIF}`, 50, doc.y + 15)
           .text(`Dirección: ${facturaData.Direccion}`, 50, doc.y + 30)
           .text(`Teléfono: ${facturaData.Telefono}`, 50, doc.y + 45);
      }
      doc.moveDown(1.5);
      
      // DESCRIPCIÓN DE LA ORDEN DE COMPRA
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Descripción de la Orden de Compra', 50, doc.y)
         .moveDown(0.5);
      
      // Tabla de descripción
      const tableTop = doc.y;
      const tableHeaders = ['Descripción', 'Cantidad', 'Importe Unitario', 'Importe Total'];
      
      // Determinar los valores a mostrar
      const cantidad = facturaData.Cantidad || 1;
      const importeTotal = facturaData.Importe || 0;
      const importeUnitario = importeTotal / cantidad;
      
      const tableData = [
        [
          facturaData.Descripcion || 'Orden de compra estándar',
          cantidad.toString(),
          `${importeUnitario.toFixed(2)}€`,
          `${importeTotal.toFixed(2)}€`
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
      
      doc.moveDown(3);
      
      // RESUMEN DE IMPORTES
      const summaryY = doc.y;
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('Resumen', 50, summaryY)
         .moveDown(0.5);
      
      // Línea de subtotal
      const subtotal = importeTotal;
      doc.fontSize(10)
         .font('Helvetica')
         .text('Subtotal:', 350, doc.y, { width: 100, align: 'right' })
         .text(`${subtotal.toFixed(2)}€`, 450, doc.y, { align: 'right' });
      
      // Línea de IVA (simulado)
      const iva = subtotal * 0.21;
      doc.text('IVA (21%):', 350, doc.y + 15, { width: 100, align: 'right' })
         .text(`${iva.toFixed(2)}€`, 450, doc.y, { align: 'right' });
      
      // Línea para separar
      doc.moveTo(350, doc.y + 10)
         .lineTo(500, doc.y + 10)
         .stroke();
      
      // Línea de total
      const total = subtotal * 1.21;
      doc.font('Helvetica-Bold')
         .text('TOTAL:', 350, doc.y + 15, { width: 100, align: 'right' })
         .text(`${total.toFixed(2)}€`, 450, doc.y, { align: 'right' });
      
      // Estado de la factura
      doc.moveDown();
      doc.fontSize(12)
         .fillColor(
           facturaData.Estado === 'Pagada' ? '#008000' : 
           facturaData.Estado === 'Pendiente' ? '#FFA500' : '#FF0000'
         )
         .text(`Estado: ${facturaData.Estado}`, 350, doc.y, { align: 'right' });
      
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
      console.error('Error generando PDF:', error);
      reject(error);
    }
  });
}

/**
 * Formatea una fecha para mostrar en formato local
 * @param {string|Date} dateString - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
function formatDate(dateString) {
  if (!dateString) return new Date().toLocaleDateString('es-ES');
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  } catch (error) {
    return new Date().toLocaleDateString('es-ES');
  }
}