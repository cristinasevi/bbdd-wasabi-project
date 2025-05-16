import { NextResponse } from "next/server";
import { pool } from "@/app/api/lib/db";
import formidable from "formidable";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

// Configurar formidable para manejar archivos
export const config = {
  api: {
    bodyParser: false,
  },
};

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
      `SELECT Ruta_pdf, Num_factura, Proveedor, Fecha_emision 
       FROM Factura f
       JOIN Orden o ON f.idOrdenFK = o.idOrden
       JOIN Proveedor p ON o.id_ProveedorFK = p.idProveedor
       WHERE idFactura = ?`,
      [facturaId]
    );

    if (facturas.length === 0) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      );
    }

    const factura = facturas[0];

    // Verificar si hay una ruta de archivo PDF
    if (!factura.Ruta_pdf) {
      return NextResponse.json(
        { error: "No hay archivo PDF asociado a esta factura" },
        { status: 400 }
      );
    }

    // En un entorno real, aquí buscaríamos y serviríamos el PDF
    // En este caso, simularemos la creación de un PDF demo ya que no podemos
    // acceder al sistema de archivos del servidor en este entorno

    // Crear un nombre de archivo para la descarga basado en los datos de la factura
    const fileName = `Factura_${factura.Num_factura}_${factura.Proveedor.replace(/\s+/g, "_")}.pdf`;

    try {
      // NOTA: En un entorno real, aquí verificaríamos la existencia del archivo
      // y lo leeríamos para enviarlo como respuesta.
      
      // Para esta demo, devolvemos un PDF genérico o una respuesta simulada
      // En un entorno de producción, usaríamos algo como:
      // const filePath = path.join(process.cwd(), "public", factura.Ruta_pdf.replace(/^\//, ""));
      // const fileBuffer = await fs.readFile(filePath);

      // Creamos una respuesta simulada para la demo
      const demoResponse = new NextResponse("PDF Content would be here", {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      });

      return demoResponse;
    } catch (fileError) {
      console.error("Error al procesar el archivo:", fileError);
      return NextResponse.json(
        { error: "No se pudo acceder al archivo PDF" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error en la API de descarga de facturas:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}

// Ruta para subir facturas
export async function POST(request) {
  try {
    // Crear directorio temporal para almacenar archivos
    const uploadDir = path.join(os.tmpdir(), "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    // Configurar formidable para manejar la carga de archivos
    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    // Procesar el archivo y los campos del formulario
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(request, (err, fields, files) => {
        if (err) return reject(err);
        resolve([fields, files]);
      });
    });

    // Obtener el ID de la factura y el archivo cargado
    const facturaId = fields.facturaId[0];
    const file = files.file[0];

    if (!facturaId) {
      return NextResponse.json(
        { error: "ID de factura no proporcionado" },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "No se ha proporcionado un archivo" },
        { status: 400 }
      );
    }

    // Verificar tipo de archivo (debe ser PDF)
    if (file.mimetype !== "application/pdf") {
      await fs.unlink(file.filepath);
      return NextResponse.json(
        { error: "El archivo debe ser un PDF" },
        { status: 400 }
      );
    }

    // En un entorno real, aquí moveríamos el archivo a un directorio permanente
    // y actualizaríamos la ruta en la base de datos
    
    // Generar una ruta para el PDF
    const fecha = new Date();
    const año = fecha.getFullYear();
    
    // Obtener información de la factura
    const [facturas] = await pool.query(
      `SELECT f.Num_factura, p.Nombre as Proveedor, d.Nombre as Departamento
       FROM Factura f
       JOIN Orden o ON f.idOrdenFK = o.idOrden
       JOIN Proveedor p ON o.id_ProveedorFK = p.idProveedor
       JOIN Departamento d ON o.id_DepartamentoFK = d.id_Departamento
       WHERE f.idFactura = ?`,
      [facturaId]
    );
    
    if (facturas.length === 0) {
      await fs.unlink(file.filepath);
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      );
    }
    
    const factura = facturas[0];
    
    // Generar nombre del archivo
    const proveedorCod = factura.Proveedor.substring(0, 3).toLowerCase();
    const departamentoCod = factura.Departamento.substring(0, 4).toLowerCase();
    const nombreArchivo = `fac-${proveedorCod}-${factura.Num_factura.toLowerCase()}.pdf`;
    const rutaPdf = `/facturas/${año}/${departamentoCod}/${nombreArchivo}`;
    
    // Actualizar la ruta del PDF en la base de datos
    await pool.query(
      "UPDATE Factura SET Ruta_pdf = ? WHERE idFactura = ?",
      [rutaPdf, facturaId]
    );

    // Limpiar el archivo temporal (en producción lo moveríamos a otra ubicación)
    await fs.unlink(file.filepath);

    return NextResponse.json({
      success: true,
      message: "Factura subida correctamente",
      ruta: rutaPdf
    });
  } catch (error) {
    console.error("Error en la API de carga de facturas:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}