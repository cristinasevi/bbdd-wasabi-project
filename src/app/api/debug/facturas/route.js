import { NextResponse } from "next/server";
import { pool } from "@/app/api/lib/db";
import fs from "fs";
import path from "path";

export async function GET(request) {
  try {
    // Obtener ID de la factura de los parámetros de consulta
    const { searchParams } = new URL(request.url);
    const facturaId = searchParams.get("id");
    
    let query = `
      SELECT 
        f.idFactura, 
        f.Ruta_pdf, 
        f.Num_factura, 
        p.Nombre as NombreProveedor, 
        d.Nombre as Departamento,
        f.Fecha_emision,
        o.Num_orden
      FROM Factura f
      JOIN Orden o ON f.idOrdenFK = o.idOrden
      JOIN Proveedor p ON o.id_ProveedorFK = p.idProveedor
      JOIN Departamento d ON o.id_DepartamentoFK = d.id_Departamento
    `;
    
    // Parámetros para la consulta
    const params = [];
    
    // Si se proporcionó un ID específico, filtramos por él
    if (facturaId) {
      query += " WHERE f.idFactura = ?";
      params.push(facturaId);
    }
    
    // Limitar a 100 registros para no sobrecargar la respuesta
    query += " LIMIT 100";
    
    // Ejecutar la consulta
    const [facturas] = await pool.query(query, params);
    
    if (facturas.length === 0) {
      return NextResponse.json(
        { error: facturaId ? "Factura no encontrada" : "No hay facturas registradas" },
        { status: 404 }
      );
    }
    
    // Verificar archivos y preparar resultados
    const resultados = await Promise.all(facturas.map(async (factura) => {
      // Información básica
      const resultado = { 
        id: factura.idFactura,
        num_factura: factura.Num_factura,
        proveedor: factura.NombreProveedor,
        departamento: factura.Departamento,
        fecha: factura.Fecha_emision?.toISOString().split('T')[0] || null,
        num_orden: factura.Num_orden,
        ruta_pdf: factura.Ruta_pdf
      };
      
      // Verificar si hay ruta de PDF
      if (!factura.Ruta_pdf) {
        resultado.estado = "Sin PDF asociado";
        return resultado;
      }
      
      // Verificar ruta absoluta para asegurarnos de que está correcta
      try {
        const rutaRelativa = factura.Ruta_pdf.startsWith('/') 
          ? factura.Ruta_pdf.substring(1) 
          : factura.Ruta_pdf;
        
        const rutaCompleta = path.join(process.cwd(), "public", rutaRelativa);
        resultado.ruta_completa = rutaCompleta;
        
        // Verificar si el archivo existe
        if (fs.existsSync(rutaCompleta)) {
          // Obtener información del archivo
          const stats = fs.statSync(rutaCompleta);
          resultado.estado = "PDF encontrado";
          resultado.tamano = stats.size;
          resultado.ultima_modificacion = stats.mtime;
        } else {
          resultado.estado = "PDF no encontrado";
        }
      } catch (error) {
        resultado.estado = "Error al verificar archivo";
        resultado.error = error.message;
      }
      
      return resultado;
    }));
    
    // Añadir información del entorno
    const infoSistema = {
      directorio_trabajo: process.cwd(),
      directorio_publico: path.join(process.cwd(), "public"),
      directorios_facturas: [
        path.join(process.cwd(), "public", "facturas"),
        // Añadir algunos subdirectorios comunes para verificar
        ...Array.from({ length: 3 }, (_, i) => {
          const year = new Date().getFullYear() - i;
          return path.join(process.cwd(), "public", "facturas", year.toString());
        })
      ].map(dir => {
        try {
          const existe = fs.existsSync(dir);
          return {
            ruta: dir,
            existe: existe,
            accesible: existe ? fs.accessSync(dir, fs.constants.R_OK | fs.constants.W_OK) || true : false
          };
        } catch (error) {
          return {
            ruta: dir,
            existe: fs.existsSync(dir),
            accesible: false,
            error: error.message
          };
        }
      }),
      nodejs_version: process.version,
      platform: process.platform
    };
    
    return NextResponse.json({
      total_facturas: resultados.length,
      sistema: infoSistema,
      facturas: resultados
    });
  } catch (error) {
    console.error("Error en API de diagnóstico de facturas:", error);
    return NextResponse.json(
      { 
        error: "Error al procesar la solicitud: " + error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}