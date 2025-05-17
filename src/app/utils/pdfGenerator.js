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
      
      // Añadir encabezado
      doc.fontSize(25)
         .text('FACTURA', { align: 'center' })
         .moveDown(0.5);
      
      // Línea separadora
      drawHorizontalLine(doc, 50);
      
      // Información de la factura
      doc.fontSize(12)
         .text(`Factura Nº: ${facturaData.Num_factura}`, { continued: true })
         .text(`Fecha: ${formatDate(facturaData.Fecha_emision)}`, { align: 'right' })
         .moveDown(0.5);
      
      // Información de proveedor y departamento
      doc.fontSize(14)
         .text('DATOS DE FACTURA', { underline: true })
         .moveDown(0.5);
      
      // Tabla con la información principal
      const tableTop = doc.y + 10;
      const colWidths = {
        property: 140,
        value: 350
      };
      
      // Primera columna: Propiedades
      doc.fontSize(10);
      
      // Datos en formato de tabla
      const tableData = [
        { property: 'Proveedor:', value: facturaData.Proveedor },
        { property: 'NIF Proveedor:', value: facturaData.NIF || 'No disponible' },
        { property: 'Departamento:', value: facturaData.Departamento },
        { property: 'Orden de Compra:', value: facturaData.Num_orden },
        { property: 'Estado:', value: facturaData.Estado },
        { property: 'Inventariable:', value: facturaData.Inventariable ? 'Sí' : 'No' },
        { property: 'Cantidad:', value: facturaData.Cantidad || '1' }
      ];
      
      // Dibujar tabla de información
      let yPosition = tableTop;
      let rowHeight = 20;
      
      tableData.forEach((row, i) => {
        const evenRow = i % 2 === 0;
        
        // Fondo alterno para filas
        if (evenRow) {
          doc.rect(50, yPosition, doc.page.width - 100, rowHeight).fill('#f5f5f5');
        }
        
        doc.fillColor('#000')
           .text(row.property, 60, yPosition + 5, { width: colWidths.property, align: 'left' })
           .text(row.value, 200, yPosition + 5, { width: colWidths.value, align: 'left' });
        
        yPosition += rowHeight;
      });
      
      // Añadir descripción de la orden
      yPosition += 20;
      doc.fontSize(14)
         .text('DESCRIPCIÓN', 50, yPosition, { underline: true })
         .moveDown(0.5);
      
      yPosition = doc.y;
      
      // Área de descripción con borde
      doc.rect(50, yPosition, doc.page.width - 100, 60).stroke('#cccccc');
      doc.fontSize(10)
         .text(facturaData.Descripcion || 'Sin descripción disponible', 60, yPosition + 10, { 
           width: doc.page.width - 120,
           align: 'left'
         });
      
      // Avanzar el cursor
      doc.y = yPosition + 80;
      
      // Resumen económico
      doc.fontSize(14)
         .text('RESUMEN ECONÓMICO', { underline: true })
         .moveDown(0.5);
      
      // Tabla de importes
      const summaryTable = [
        { concept: 'Importe Base', amount: facturaData.Importe || 0 },
        { concept: 'IVA (21%)', amount: (facturaData.Importe * 0.21) || 0 },
        { concept: 'TOTAL', amount: (facturaData.Importe * 1.21) || 0 }
      ];
      
      // Dibujar tabla de resumen económico
      yPosition = doc.y + 10;
      
      doc.fontSize(10);
      
      // Cabecera de la tabla económica
      doc.rect(50, yPosition, doc.page.width - 100, rowHeight).fill('#e6e6e6');
      doc.fillColor('#000')
         .text('CONCEPTO', 60, yPosition + 5, { width: 300, align: 'left' })
         .text('IMPORTE', doc.page.width - 160, yPosition + 5, { width: 100, align: 'right' });
      
      yPosition += rowHeight;
      
      // Filas de la tabla económica
      summaryTable.forEach((row, i) => {
        const isTotal = i === summaryTable.length - 1;
        
        if (isTotal) {
          // Para la fila de total, añadimos una línea separadora y negrita
          doc.moveTo(50, yPosition).lineTo(doc.page.width - 50, yPosition).stroke('#cccccc');
          yPosition += 5;
          doc.font('Helvetica-Bold');
        } else {
          doc.font('Helvetica');
        }
        
        doc.text(row.concept, 60, yPosition + 5, { width: 300, align: 'left' })
           .text(formatCurrency(row.amount), doc.page.width - 160, yPosition + 5, { width: 100, align: 'right' });
        
        yPosition += rowHeight;
      });
      
      // Volver a la fuente normal
      doc.font('Helvetica');
      
      // Comentarios y condiciones
      const bottomPosition = doc.page.height - 120;
      doc.fontSize(9)
         .text('Notas y condiciones:', 50, bottomPosition, { underline: true })
         .moveDown(0.5)
         .text('- Esta factura ha sido generada automáticamente por el sistema de gestión WASABI.')
         .text('- El pago debe realizarse en un plazo de 30 días desde la fecha de emisión.')
         .text('- Para cualquier consulta, contacte con el departamento financiero.')
         .moveDown(0.5);
      
      // Pie de página
      drawHorizontalLine(doc, doc.page.height - 50);
      
      doc.fontSize(8)
         .text(`© ${new Date().getFullYear()} Salesianos Zaragoza - Todos los derechos reservados`, { 
           align: 'center',
           width: doc.page.width - 100,
           x: 50
         })
         .text(`Documento generado el ${formatDateTimeNow()}`, { 
           align: 'center',
           width: doc.page.width - 100,
           x: 50
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
 * Dibuja una línea horizontal en el documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {number} y - Posición Y donde dibujar la línea
 */
function drawHorizontalLine(doc, y) {
  doc.moveTo(50, y)
     .lineTo(doc.page.width - 50, y)
     .stroke('#cccccc');
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

/**
 * Formatea un valor monetario
 * @param {number} amount 
 * @returns {string}
 */
function formatCurrency(amount) {
  return amount.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' €';
}

/**
 * Devuelve la fecha y hora actual formateada
 * @returns {string}
 */
function formatDateTimeNow() {
  return new Date().toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}