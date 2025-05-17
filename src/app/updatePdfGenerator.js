const fs = require('fs');
const path = require('path');

// Este es un PDF válido simple codificado en base64
const VALID_PDF_BASE64 = "JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSIAogICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2JqCgo1IDAgb2JqICAlIHBhZ2UgY29udGVudAo8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9GMSAxMiBUZgooRmFjdHVyYSBTYWxlc2lhbm9zKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCgp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA3OSAwMDAwMCBuIAowMDAwMDAwMTczIDAwMDAwIG4gCjAwMDAwMDAzMDEgMDAwMDAgbiAKMDAwMDAwMDM4MCAwMDAwMCBuIAp0cmFpbGVyCjw8CiAgL1NpemUgNgogIC9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0OTIKJSVFT0YK";

// Ruta al archivo route.js que queremos modificar
const routeFilePath = path.join(process.cwd(), 'src', 'app', 'api', 'debug', 'generarPDFs', 'route.js');

try {
  // Leer el archivo
  let content = fs.readFileSync(routeFilePath, 'utf8');
  
  // Buscar la definición de SAMPLE_PDF_BASE64 y reemplazarla
  content = content.replace(
    /const SAMPLE_PDF_BASE64 = "([^"]*)"/,
    `const SAMPLE_PDF_BASE64 = "${VALID_PDF_BASE64}"`
  );
  
  // Escribir el archivo de nuevo
  fs.writeFileSync(routeFilePath, content, 'utf8');
  
  console.log("✅ Archivo actualizado correctamente!");
  console.log("Ahora ejecuta http://localhost:3000/api/debug/generarPDFs para regenerar los PDFs");
} catch (error) {
  console.error("❌ Error al actualizar el archivo:", error);
}