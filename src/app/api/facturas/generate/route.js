import { NextResponse } from "next/server";
import { pool } from "@/app/api/lib/db";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";

export async function GET(request) {
  try {
    // Obtener ID de la factura de los parámetros de consulta
    const { searchParams } = new URL(request.url);
    const facturaId = searchParams.get("id");

    if (!facturaId) {
      return NextResponse.json(
        { error: "ID de factura no proporcionado" },
        { status: 400 }
      );
    }

    // Buscar la factura en la base de datos
    const [facturas] = await pool.query(
      `SELECT 
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
        d.Nombre AS Departamento,
        e.Tipo AS Estado
      FROM Factura f
      JOIN Orden o ON f.idOrdenFK = o.idOrden
      JOIN Proveedor p ON o.id_ProveedorFK = p.idProveedor
      JOIN Departamento d ON o.id_DepartamentoFK = d.id_Departamento
      JOIN Estado e ON f.idEstadoFK = e.idEstado
      WHERE f.idFactura = ?`,
      [facturaId]
    );

    if (facturas.length === 0) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      );
    }

    const factura = facturas[0];

    // Verificar si hay una ruta de PDF definida
    if (!factura.Ruta_pdf) {
      return NextResponse.json(
        { error: "No hay ruta de PDF definida para esta factura" },
        { status: 400 }
      );
    }

    // Normalizar la ruta
    let rutaRelativa = factura.Ruta_pdf;
    if (rutaRelativa.startsWith('/')) {
      rutaRelativa = rutaRelativa.substring(1);
    }
    
    // Construir la ruta completa
    const rutaCompleta = path.join(process.cwd(), "public", rutaRelativa);
    
    // Asegurarse de que el directorio existe
    const directorio = path.dirname(rutaCompleta);
    if (!fs.existsSync(directorio)) {
      fs.mkdirSync(directorio, { recursive: true });
    }
    
    // Generar el PDF simplificado
    const success = await generateSimpleInvoicePDF(factura, rutaCompleta);
    
    if (!success) {
      return NextResponse.json(
        { error: "Error al generar el PDF" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: "PDF generado correctamente",
      ruta: factura.Ruta_pdf,
      factura: factura.Num_factura
    });
  } catch (error) {
    console.error("Error en la API de generación de PDF:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud: " + error.message },
      { status: 500 }
    );
  }
}

/**
 * Función para generar un PDF de factura simplificado
 * @param {Object} facturaData - Datos de la factura
 * @param {string} outputPath - Ruta completa donde guardar el PDF
 * @returns {Promise<boolean>} - true si se generó correctamente
 */
async function generateSimpleInvoicePDF(facturaData, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      // Crear directorio si no existe
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Crear PDF con opciones básicas
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        info: {
          Title: `Factura ${facturaData.Num_factura}`,
          Author: 'Salesianos Zaragoza'
        }
      });
      
      const writeStream = fs.createWriteStream(outputPath);
      
      // Configurar eventos
      writeStream.on('finish', () => resolve(true));
      writeStream.on('error', reject);
      
      // Pipe del PDF al stream de escritura
      doc.pipe(writeStream);
      
      // CONSTANTES DE ESTILO
      const COLOR = {
        primary: '#E02D39',
        text: '#333333'
      };
      
      // CONTENIDO SIMPLIFICADO
      
      // 1. TÍTULO Y NÚMERO DE FACTURA
      doc.fontSize(22)
         .fillColor(COLOR.primary)
         .font('Helvetica-Bold')
         .text('FACTURA', 50, 50)
         .fontSize(16)
         .text(`Nº ${facturaData.Num_factura}`, 50, 80);
      
      // 2. INFORMACIÓN BÁSICA - formato de tabla simple
      doc.fontSize(12)
         .fillColor(COLOR.text)
         .moveDown(1.5);
      
      // Crear tabla simple con datos principales
      const infoData = [
        ['Fecha:', formatDate(facturaData.Fecha_emision)],
        ['Departamento:', facturaData.Departamento],
        ['Proveedor:', facturaData.Proveedor],
        ['NIF Proveedor:', facturaData.NIF || 'No disponible'],
        ['Dirección:', facturaData.Direccion || 'No disponible'],
        ['Orden de Compra:', facturaData.Num_orden],
        ['Estado:', facturaData.Estado]
      ];
      
      // Posición inicial de la tabla
      let yPosition = 120;
      const lineHeight = 25;
      
      // Dibujar cada fila de información
      infoData.forEach((row, index) => {
        // Alternar fondo para mejor legibilidad
        if (index % 2 === 0) {
          doc.rect(50, yPosition, 500, lineHeight).fill('#f9f9f9');
        }
        
        // Nombre del campo (izquierda)
        doc.font('Helvetica-Bold')
           .text(row[0], 60, yPosition + 7, { width: 150 });
        
        // Valor del campo (derecha)
        doc.font('Helvetica')
           .text(row[1], 210, yPosition + 7, { width: 330 });
        
        yPosition += lineHeight;
      });
      
      // 3. INFORMACIÓN DE IMPORTES
      yPosition += 20;
      
      // Calcular importes
      const subtotal = facturaData.Importe || 0;
      const iva = subtotal * 0.21;
      const total = subtotal + iva;
      
      // Crear cuadro de totales
      doc.rect(300, yPosition, 250, 100).stroke('#cccccc');
      
      // Datos de importes
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('IMPORTE:', 320, yPosition + 20)
         .font('Helvetica')
         .text(`${subtotal.toFixed(2)} €`, 450, yPosition + 20, { align: 'right' });
      
      doc.font('Helvetica-Bold')
         .text('IVA (21%):', 320, yPosition + 45)
         .font('Helvetica')
         .text(`${iva.toFixed(2)} €`, 450, yPosition + 45, { align: 'right' });
      
      // Línea separadora
      doc.moveTo(320, yPosition + 70)
         .lineTo(530, yPosition + 70)
         .stroke();
      
      // Importe total
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor(COLOR.primary)
         .text('TOTAL:', 320, yPosition + 75)
         .text(`${total.toFixed(2)} €`, 450, yPosition + 75, { align: 'right' });
      
      // Finalizar el documento
      doc.end();
    } catch (error) {
      console.error('Error generando PDF:', error);
      reject(error);
    }
  });
}

/**
 * Formatea una fecha para mostrar en formato dd/mm/yyyy
 * @param {string|Date} dateString - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
function formatDate(dateString) {
  if (!dateString) return "-";
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  } catch (error) {
    return dateString || "-";
  }
}