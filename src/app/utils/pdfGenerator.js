import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Genera un PDF de factura basado en datos de la base de datos
 * @param {Object} facturaData - Datos de la factura
 * @param {string} outputPath - Ruta donde guardar el PDF
 * @returns {Promise<boolean>} - Resultado de la operación
 */
export async function generateInvoicePDF(facturaData, outputPath) {
  try {
    // Asegurar que el directorio existe
    const dir = path.dirname(outputPath);
    await fs.promises.mkdir(dir, { recursive: true });
    
    // Crear el documento PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Crear stream de escritura
    const writeStream = fs.createWriteStream(outputPath);
    
    // Configurar eventos
    return new Promise((resolve, reject) => {
      // Manejar eventos de stream
      writeStream.on('finish', () => resolve(true));
      writeStream.on('error', reject);
      
      // Pipe del PDF al stream de escritura
      doc.pipe(writeStream);
      
      // Añadir logo (opcional)
      // doc.image('public/images/logo.jpg', 50, 45, { width: 150 });
      
      // Añadir encabezado
      doc.fontSize(25)
         .text('FACTURA', 50, 50)
         .fontSize(12)
         .text(`Factura Nº: ${facturaData.Num_factura}`, 50, 90)
         .text(`Fecha: ${formatDate(facturaData.Fecha_emision)}`, 50, 110)
         .moveDown();
      
      // Información de proveedor y departamento
      doc.fontSize(14)
         .text('Información', 50, 140)
         .fontSize(10)
         .text(`Proveedor: ${facturaData.Proveedor}`, 50, 160)
         .text(`Departamento: ${facturaData.Departamento}`, 50, 180)
         .text(`Orden de Compra: ${facturaData.Num_orden}`, 50, 200)
         .moveDown();
      
      // Tabla de resumen
      doc.fontSize(14)
         .text('Resumen', 50, 240)
         .fontSize(10);
      
      // Encabezados de tabla
      const tableTop = 260;
      const tableColumnWidth = 150;
      
      doc.text('Concepto', 50, tableTop)
         .text('Importe', 200, tableTop)
         .text('Estado', 350, tableTop);
      
      // Línea separadora
      doc.moveTo(50, tableTop + 15)
         .lineTo(550, tableTop + 15)
         .stroke();
      
      // Datos de la tabla
      doc.text('Orden de compra', 50, tableTop + 30)
         .text(`${facturaData.Importe} €`, 200, tableTop + 30)
         .text(facturaData.Estado, 350, tableTop + 30);
      
      // Total
      doc.moveTo(50, tableTop + 50)
         .lineTo(550, tableTop + 50)
         .stroke();
      
      doc.fontSize(12)
         .text(`Total: ${facturaData.Importe} €`, 400, tableTop + 70);
      
      // Notas adicionales
      doc.fontSize(10)
         .text('Notas:', 50, tableTop + 100)
         .text(`Esta factura fue generada automáticamente por el sistema de gestión.`, 50, tableTop + 120);
      
      // Pie de página
      const bottomPosition = doc.page.height - 50;
      doc.fontSize(10)
         .text(`© ${new Date().getFullYear()} Salesianos Zaragoza - Todos los derechos reservados`, 50, bottomPosition, {
           align: 'center'
         });
      
      // Finalizar el documento
      doc.end();
    });
  } catch (error) {
    console.error('Error generando PDF:', error);
    return false;
  }
}

/**
 * Formatea una fecha para mostrar
 * @param {string|Date} dateString 
 * @returns {string}
 */
function formatDate(dateString) {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
}