/**
 * regenerateInvoicePDF.js
 * Script para regenerar un PDF de factura específico usando la base de datos
 * 
 * Para ejecutar:
 * 1. Instalar dependencias: npm install pdfkit mysql2
 * 2. Ejecutar: node regenerateInvoicePDF.js NUMERO_FACTURA
 * 
 * Ejemplos:
 * - Para regenerar una factura específica: node regenerateInvoicePDF.js FAC-AMZ-123456
 * - Para regenerar todas las facturas: node regenerateInvoicePDF.js --all
 */

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const mysql = require('mysql2/promise');

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password', // Cambiar por tu contraseña
  database: process.env.DB_NAME || 'Proyecto_WASABI'
};

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
      
      // CABECERA: Posicionamiento vertical controlado
      let yPos = 40; // Posición inicial
      
      // Logo (en caso de tenerlo disponible)
      // Intentar cargar el logo desde la carpeta public/images
      try {
        const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.jpg');
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, yPos, { width: 50 });
          yPos += 10;
        }
      } catch (error) {
        console.log('Logo no encontrado, continuando sin él...');
      }
      
      // Título y Número de Factura
      doc.fontSize(22)
         .fillColor('#E02D39')
         .text('FACTURA', 50, yPos, { align: 'left' });
      
      yPos += 30;
      
      // Número de factura y fecha en la misma línea
      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(`Factura Nº: ${facturaData.Num_factura}`, 50, yPos);
      
      // Formatea la fecha correctamente
      let fechaEmision;
      if (facturaData.Fecha_emision) {
        if (facturaData.Fecha_emision instanceof Date) {
          fechaEmision = facturaData.Fecha_emision.toLocaleDateString('es-ES');
        } else {
          try {
            fechaEmision = new Date(facturaData.Fecha_emision).toLocaleDateString('es-ES');
          } catch (e) {
            fechaEmision = new Date().toLocaleDateString('es-ES');
          }
        }
      } else {
        fechaEmision = new Date().toLocaleDateString('es-ES');
      }
      
      doc.fontSize(11)
         .font('Helvetica')
         .text(`Fecha: ${fechaEmision}`, 300, yPos);
      
      yPos += 25;
      
      // INFORMACIÓN DE CABECERA
      // Añadir un rectángulo gris claro para el área de información
      doc.rect(50, yPos, doc.page.width - 100, 70)
         .fillAndStroke('#f6f6f6', '#cccccc');
      
      // Contenido dentro del rectángulo
      doc.fillColor('#000000')
         .fontSize(10)
         .text('INFORMACIÓN', 60, yPos + 10, { underline: true });
      
      // Obtener departamento
      const departamento = facturaData.Departamento || 'N/A';
      
      doc.font('Helvetica')
         .text(`ID Factura: ${facturaData.idFactura}`, 60, yPos + 25)
         .text(`Departamento: ${departamento}`, 60, yPos + 40)
         .text(`Orden de Compra: ${facturaData.Num_orden || 'N/A'}`, 60, yPos + 55);
      
      yPos += 85;
      
      // INFORMACIÓN DE PROVEEDOR
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('Datos del Proveedor', 50, yPos);
      
      yPos += 20;
      
      doc.fontSize(10)
         .font('Helvetica')
         .text(`Proveedor: ${facturaData.Proveedor || 'Información no disponible'}`, 50, yPos)
         .text(`NIF: ${facturaData.NIF || 'Información no disponible'}`, 50, yPos + 15)
         .text(`Dirección: ${facturaData.Direccion || 'Información no disponible'}`, 50, yPos + 30)
         .text(`Teléfono: ${facturaData.Telefono ? facturaData.Telefono.toString() : 'Información no disponible'}`, 50, yPos + 45);
      
      yPos += 75;
      
      // DESCRIPCIÓN DE LA ORDEN DE COMPRA
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('Descripción de la Orden de Compra', 50, yPos);
      
      yPos += 20;
      
      // Tabla de descripción
      const tableTop = yPos;
      const tableHeaders = ['Descripción', 'Cantidad', 'Importe Unitario', 'Importe Total'];
      
      // Preparar datos para la tabla
      const descripcion = facturaData.Descripcion || 'Orden de compra estándar';
      const cantidad = facturaData.Cantidad ? facturaData.Cantidad.toString() : '1';
      const importe = facturaData.Importe || 0;
      
      // Calcular importe unitario
      const importeUnitario = facturaData.Cantidad ? importe / facturaData.Cantidad : importe;
      
      const tableData = [
        [
          descripcion, 
          cantidad, 
          `${importeUnitario.toFixed(2)}€`, 
          `${importe.toFixed(2)}€`
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
         .text(`${importe.toFixed(2)}€`, 450, yPos, { align: 'right' });
      
      // Línea de IVA (simulado)
      const iva = importe * 0.21;
      doc.text('IVA (21%):', 350, yPos + 15, { width: 100, align: 'right' })
         .text(`${iva.toFixed(2)}€`, 450, yPos + 15, { align: 'right' });
      
      // Línea para separar
      doc.moveTo(350, yPos + 30)
         .lineTo(500, yPos + 30)
         .stroke();
      
      // Línea de total
      const total = importe * 1.21;
      doc.font('Helvetica-Bold')
         .text('TOTAL:', 350, yPos + 40, { width: 100, align: 'right' })
         .text(`${total.toFixed(2)}€`, 450, yPos + 40, { align: 'right' });
      
      // Estado de la factura si está disponible
      if (facturaData.Estado) {
        yPos += 60;
        doc.fontSize(12)
           .fillColor(
             facturaData.Estado === 'Contabilizada' ? '#008000' : 
             facturaData.Estado === 'Pendiente' ? '#FFA500' : '#FF0000'
           )
           .text(`Estado: ${facturaData.Estado}`, 350, yPos, { align: 'right' });
      }
      
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

// Función principal
async function main() {
  // Obtener el número de factura de los argumentos de la línea de comandos
  const numFactura = process.argv[2];
  if (!numFactura) {
    console.error('❌ Error: Debes proporcionar un número de factura como argumento.');
    console.log('Uso: node regenerateInvoicePDF.js NUMERO_FACTURA');
    console.log('Para regenerar todas las facturas: node regenerateInvoicePDF.js --all');
    process.exit(1);
  }
  
  let connection;
  try {
    // Conectar a la base de datos
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión establecida');
    
    // Construir la consulta según el modo (una factura o todas)
    let query;
    let params = [];
    let message;
    
    if (numFactura === '--all') {
      query = `
        SELECT 
          f.idFactura,
          f.Num_factura,
          f.Fecha_emision,
          f.Ruta_pdf,
          o.Num_orden,
          o.Importe,
          o.Descripcion,
          o.Cantidad,
          p.Nombre AS Proveedor,
          p.NIF,
          p.Direccion,
          p.Telefono,
          p.Email,
          d.Nombre AS Departamento,
          e.Tipo AS Estado
        FROM Factura f
        JOIN Orden o ON f.idOrdenFK = o.idOrden
        JOIN Proveedor p ON o.id_ProveedorFK = p.idProveedor
        JOIN Departamento d ON o.id_DepartamentoFK = d.id_Departamento
        JOIN Estado e ON f.idEstadoFK = e.idEstado
      `;
      message = 'Buscando todas las facturas en la base de datos...';
    } else {
      query = `
        SELECT 
          f.idFactura,
          f.Num_factura,
          f.Fecha_emision,
          f.Ruta_pdf,
          o.Num_orden,
          o.Importe,
          o.Descripcion,
          o.Cantidad,
          p.Nombre AS Proveedor,
          p.NIF,
          p.Direccion,
          p.Telefono,
          p.Email,
          d.Nombre AS Departamento,
          e.Tipo AS Estado
        FROM Factura f
        JOIN Orden o ON f.idOrdenFK = o.idOrden
        JOIN Proveedor p ON o.id_ProveedorFK = p.idProveedor
        JOIN Departamento d ON o.id_DepartamentoFK = d.id_Departamento
        JOIN Estado e ON f.idEstadoFK = e.idEstado
        WHERE f.Num_factura = ?
      `;
      params = [numFactura];
      message = `Buscando factura: ${numFactura}`;
    }
    
    console.log(`🔍 ${message}`);
    
    // Ejecutar la consulta
    const [facturas] = await connection.query(query, params);
    
    if (facturas.length === 0) {
      console.error('❌ No se encontraron facturas con los criterios especificados.');
      process.exit(1);
    }
    
    console.log(`📋 Se encontraron ${facturas.length} facturas para regenerar`);
    
    // Procesar cada factura
    let createdCount = 0;
    for (let i = 0; i < facturas.length; i++) {
      const factura = facturas[i];
      
      // Verificar si hay una ruta de PDF definida
      if (!factura.Ruta_pdf) {
        console.log(`⚠️ La factura ${factura.Num_factura} no tiene ruta de PDF definida. Asignando una predeterminada.`);
        // Generar una ruta basada en el número de factura y el departamento
        const departamentoCodigo = factura.Departamento.substring(0, 3).toLowerCase();
        factura.Ruta_pdf = `/facturas/2025/${departamentoCodigo}/fac-${factura.Num_factura.toLowerCase().replace(/\//g, '-')}.pdf`;
        
        // Actualizar la ruta en la base de datos
        await connection.query(
          'UPDATE Factura SET Ruta_pdf = ? WHERE idFactura = ?',
          [factura.Ruta_pdf, factura.idFactura]
        );
        console.log(`✓ Ruta PDF actualizada en la base de datos: ${factura.Ruta_pdf}`);
      }
      
      // Normalizar la ruta del PDF
      let rutaRelativa = factura.Ruta_pdf;
      if (rutaRelativa.startsWith('/')) {
        rutaRelativa = rutaRelativa.substring(1);
      }
      
      // Construir la ruta completa
      const rutaCompleta = path.join(process.cwd(), 'public', rutaRelativa);
      
      console.log(`🔄 Procesando factura ${i+1}/${facturas.length}: ${factura.Num_factura}`);
      try {
        // Crear directorio si no existe
        const dir = path.dirname(rutaCompleta);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`✓ Directorio creado: ${dir}`);
        }
        
        // Generar el PDF de la factura
        await createEnhancedInvoicePDF(factura, rutaCompleta);
        console.log(`✅ PDF creado correctamente: ${rutaCompleta}`);
        createdCount++;
      } catch (error) {
        console.error(`❌ Error generando PDF para factura ${factura.idFactura} (${factura.Num_factura}):`, error.message);
      }
    }
    
    console.log(`\n📊 Resumen: ${createdCount}/${facturas.length} PDFs generados correctamente.`);
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
      console.log('🔒 Conexión a la base de datos cerrada');
    }
  }
}

// Ejecutar la función principal
main()
  .then(() => console.log('✨ Proceso completado con éxito.'))
  .catch(error => console.error('❌ Error general:', error));