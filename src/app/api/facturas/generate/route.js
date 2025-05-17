import { NextResponse } from "next/server";
import { pool } from "@/app/api/lib/db";
import path from "path";
import { generateInvoicePDF } from "@/app/utils/pdfGenerator";

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
        p.Nombre AS Proveedor,
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
    
    // Generar el PDF utilizando nuestro generador
    const success = await generateInvoicePDF(factura, rutaCompleta);
    
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