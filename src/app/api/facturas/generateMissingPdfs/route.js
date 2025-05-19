import { NextResponse } from "next/server";
import { pool } from "@/app/api/lib/db";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";

export async function POST(request) {
  try {
    let connection;
    const generatedPDFs = [];
    const errors = [];

    console.log('🚀 Iniciando generación masiva de PDFs...');
    
    // Conectar a la base de datos
    connection = await pool.getConnection();
    
    // Buscar todas las facturas que no tienen PDF o que necesitan regeneración
    const [facturas] = await connection.query(`
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
    `);

    if (facturas.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No se encontraron facturas para procesar",
        generated: 0
      });
    }

    console.log(`📋 Procesando ${facturas.length} facturas...`);

    // Procesar cada factura
    for (const factura of facturas) {
      try {
        // Verificar si ya tiene ruta PDF definida
        if (!factura.Ruta_pdf) {
          // Generar una ruta de PDF
          const año = new Date(factura.Fecha_emision).getFullYear();
          const departamentoCodigo = factura.Departamento.substring(0, 3).toLowerCase();
          const numeroFacturaLimpio = factura.Num_factura.toLowerCase().replace(/[^a-z0-9]/g, '');
          const nombreArchivo = `fac-${numeroFacturaLimpio}.pdf`;
          const rutaPdf = `/facturas/${año}/${departamentoCodigo}/${nombreArchivo}`;
          
          // Actualizar la ruta en la base de datos
          await connection.query(
            'UPDATE Factura SET Ruta_pdf = ? WHERE idFactura = ?',
            [rutaPdf, factura.idFactura]
          );
          
          factura.Ruta_pdf = rutaPdf;
          console.log(`✅ Ruta PDF generada para factura ${factura.Num_factura}: ${rutaPdf}`);
        }

        // Normalizar la ruta del PDF
        let rutaRelativa = factura.Ruta_pdf;
        if (rutaRelativa.startsWith('/')) {
          rutaRelativa = rutaRelativa.substring(1);
        }

        // Construir la ruta completa
        const rutaCompleta = path.join(process.cwd(), "public", rutaRelativa);

        // Verificar si el archivo ya existe
        const pdfExists = fs.existsSync(rutaCompleta);
        
        if (!pdfExists) {
          // Generar el PDF
          await generateEnhancedInvoicePDF(factura, rutaCompleta);
          
          generatedPDFs.push({
            facturaId: factura.idFactura,
            numeroFactura: factura.Num_factura,
            rutaPdf: factura.Ruta_pdf
          });
          
          console.log(`✅ PDF generado: ${factura.Num_factura}`);
        } else {
          console.log(`📄 PDF ya existe: ${factura.Num_factura}`);
        }

      } catch (error) {
        console.error(`❌ Error procesando factura ${factura.Num_factura}:`, error);
        errors.push({
          facturaId: factura.idFactura,
          numeroFactura: factura.Num_factura,
          error: error.message
        });
      }
    }

    // Liberar conexión
    connection.release();

    return NextResponse.json({
      success: true,
      message: `Proceso completado. ${generatedPDFs.length} PDFs generados, ${errors.length} errores.`,
      generated: generatedPDFs.length,
      errors: errors.length,
      details: {
        generated: generatedPDFs,
        errors: errors
      }
    });

  } catch (error) {
    console.error("Error en generación masiva de PDFs:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud: " + error.message },
      { status: 500 }
    );
  }
}

// Función para generar PDF mejorado (reutilizada de tus scripts existentes)
async function generateEnhancedInvoicePDF(facturaData, outputPath) {
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
      
      // CABECERA - Controlar posición vertical
      let yPos = 40;
      
      // Logo (intentar cargar)
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
      
      // Número de factura y fecha
      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(`Factura Nº: ${facturaData.Num_factura}`, 50, yPos);
      
      // Formatear fecha
      let fechaEmision;
      if (facturaData.Fecha_emision) {
        try {
          fechaEmision = new Date(facturaData.Fecha_emision).toLocaleDateString('es-ES');
        } catch (e) {
          fechaEmision = new Date().toLocaleDateString('es-ES');
        }
      } else {
        fechaEmision = new Date().toLocaleDateString('es-ES');
      }
      
      doc.fontSize(11)
         .font('Helvetica')
         .text(`Fecha: ${fechaEmision}`, 300, yPos);
      
      yPos += 25;
      
      // INFORMACIÓN DE CABECERA
      doc.rect(50, yPos, doc.page.width - 100, 70)
         .fillAndStroke('#f6f6f6', '#cccccc');
      
      doc.fillColor('#000000')
         .fontSize(10)
         .text('INFORMACIÓN', 60, yPos + 10, { underline: true });
      
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
         .text(`Teléfono: ${facturaData.Telefono || 'Información no disponible'}`, 50, yPos + 45);
      
      yPos += 75;
      
      // DESCRIPCIÓN DE LA ORDEN
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('Descripción de la Orden de Compra', 50, yPos);
      
      yPos += 20;
      
      // Tabla de descripción
      const tableTop = yPos;
      const tableHeaders = ['Descripción', 'Cantidad', 'Importe Unitario', 'Importe Total'];
      
      const descripcion = facturaData.Descripcion || 'Orden de compra estándar';
      const cantidad = facturaData.Cantidad || 1;
      const importe = facturaData.Importe || 0;
      const importeUnitario = cantidad ? importe / cantidad : importe;
      
      const tableData = [
        [
          descripcion, 
          cantidad.toString(), 
          `${importeUnitario.toFixed(2)}€`, 
          `${importe.toFixed(2)}€`
        ]
      ];
      
      // Cabecera de tabla
      doc.fontSize(10)
         .font('Helvetica-Bold');
      
      const columnWidth = (doc.page.width - 100) / tableHeaders.length;
      
      // Fondo de cabecera
      doc.rect(50, tableTop, doc.page.width - 100, 20)
         .fill('#E02D39');
      
      // Texto de cabecera
      doc.fillColor('#FFFFFF');
      tableHeaders.forEach((header, i) => {
        doc.text(header, 50 + (i * columnWidth), tableTop + 5, { 
          width: columnWidth, 
          align: 'center'
        });
      });
      
      // Datos de tabla
      doc.fillColor('#000000')
         .font('Helvetica');
      
      tableData.forEach((row, rowIndex) => {
        const rowY = tableTop + 20 + (rowIndex * 20);
        
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
      
      // Subtotal
      doc.fontSize(10)
         .font('Helvetica')
         .text('Subtotal:', 350, yPos, { width: 100, align: 'right' })
         .text(`${importe.toFixed(2)}€`, 450, yPos, { align: 'right' });
      
      // IVA
      const iva = importe * 0.21;
      doc.text('IVA (21%):', 350, yPos + 15, { width: 100, align: 'right' })
         .text(`${iva.toFixed(2)}€`, 450, yPos + 15, { align: 'right' });
      
      // Línea separadora
      doc.moveTo(350, yPos + 30)
         .lineTo(500, yPos + 30)
         .stroke();
      
      // Total
      const total = importe * 1.21;
      doc.font('Helvetica-Bold')
         .text('TOTAL:', 350, yPos + 40, { width: 100, align: 'right' })
         .text(`${total.toFixed(2)}€`, 450, yPos + 40, { align: 'right' });
      
      // Estado de la factura
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
      doc.moveTo(50, pageHeight - 140)
         .lineTo(doc.page.width - 50, pageHeight - 140)
         .stroke('#cccccc');
      
      // Texto del pie
      doc.fontSize(9)
         .fillColor('#666666')
         .text('Esta factura fue generada automáticamente por el sistema.', 50, pageHeight - 130)
         .text('Sin el sello y la firma correspondiente, este documento carece de valor contable.', 50, pageHeight - 115);
      
      // Copyright
      doc.fontSize(8)
         .text('© 2025 Salesianos Zaragoza', 0, pageHeight - 90, { align: 'center' });
      
      // Finalizar documento
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}