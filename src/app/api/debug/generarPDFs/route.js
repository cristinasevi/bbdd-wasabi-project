import { NextResponse } from "next/server";
import { pool } from "@/app/api/lib/db";
import fs from "fs";
import path from "path";

// PDF simple base64 (un PDF en blanco muy pequeño)
const SAMPLE_PDF_BASE64 = "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";

export async function GET(request) {
  try {
    // Obtener la lista de facturas de la base de datos
    const [facturas] = await pool.query(`
      SELECT 
        f.idFactura,
        f.Num_factura,
        f.Ruta_pdf, 
        p.Nombre as Proveedor, 
        d.Nombre as Departamento
      FROM Factura f
      JOIN Orden o ON f.idOrdenFK = o.idOrden
      JOIN Proveedor p ON o.id_ProveedorFK = p.idProveedor
      JOIN Departamento d ON o.id_DepartamentoFK = d.id_Departamento
      WHERE f.Ruta_pdf IS NOT NULL
    `);

    if (facturas.length === 0) {
      return NextResponse.json(
        { message: "No hay facturas con rutas de PDF definidas" },
        { status: 404 }
      );
    }

    const resultados = [];
    
    for (const factura of facturas) {
      try {
        // Normalizar la ruta
        let rutaRelativa = factura.Ruta_pdf;
        
        // Limpiar la ruta para eliminar '/public/' si existe
        if (rutaRelativa.startsWith('/public/')) {
          rutaRelativa = rutaRelativa.substring(7); // Quitar '/public/'
        } else if (rutaRelativa.startsWith('public/')) {
          rutaRelativa = rutaRelativa.substring(6); // Quitar 'public/'
        } else if (rutaRelativa.startsWith('/')) {
          rutaRelativa = rutaRelativa.substring(1); // Quitar solo '/'
        }
        
        // Construir la ruta completa
        const rutaCompleta = path.join(process.cwd(), "public", rutaRelativa);
        
        // Obtener el directorio
        const directorioCompleto = path.dirname(rutaCompleta);
        
        // Crear los directorios necesarios
        if (!fs.existsSync(directorioCompleto)) {
          await fs.promises.mkdir(directorioCompleto, { recursive: true });
          resultados.push({ id: factura.idFactura, mensaje: "Directorio creado", directorio: directorioCompleto });
        }
        
        // Comprobar si el archivo ya existe
        if (!fs.existsSync(rutaCompleta)) {
          // Convertir el PDF base64 a un buffer
          const pdfBuffer = Buffer.from(SAMPLE_PDF_BASE64, 'base64');
          
          // Guardar el archivo
          await fs.promises.writeFile(rutaCompleta, pdfBuffer);
          
          resultados.push({ 
            id: factura.idFactura, 
            mensaje: "PDF creado correctamente", 
            ruta: rutaCompleta,
            factura: factura.Num_factura,
            proveedor: factura.Proveedor,
            departamento: factura.Departamento
          });
        } else {
          resultados.push({ 
            id: factura.idFactura, 
            mensaje: "El PDF ya existe", 
            ruta: rutaCompleta,
            factura: factura.Num_factura 
          });
        }
      } catch (error) {
        resultados.push({ 
          id: factura.idFactura, 
          mensaje: "Error creando PDF: " + error.message, 
          error: error 
        });
      }
    }

    return NextResponse.json({
      mensaje: `Proceso completado para ${facturas.length} facturas`,
      pdfs_creados: resultados.filter(r => r.mensaje === "PDF creado correctamente").length,
      directorios_creados: resultados.filter(r => r.mensaje === "Directorio creado").length,
      errores: resultados.filter(r => r.mensaje.startsWith("Error")).length,
      resultados: resultados
    });
  } catch (error) {
    console.error("Error en la API de generación de PDFs:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud: " + error.message },
      { status: 500 }
    );
  }
}