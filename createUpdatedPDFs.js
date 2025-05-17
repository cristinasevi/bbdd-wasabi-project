const fs = require('fs');
const path = require('path');

// Crea un PDF simple en memoria (este es un PDF mínimo válido)
const createSimplePDF = () => {
  return Buffer.from(
    '%PDF-1.4\n' +
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<<>>>>endobj\n' +
    'xref\n' +
    '0 4\n' +
    '0000000000 65535 f\n' +
    '0000000010 00000 n\n' +
    '0000000053 00000 n\n' +
    '0000000102 00000 n\n' +
    'trailer<</Size 4/Root 1 0 R>>\n' +
    'startxref\n' +
    '183\n' +
    '%%EOF',
    'utf-8'
  );
};

// Nuevas rutas actualizadas
const updatedPaths = [
  {id: 1, path: "public/facturas/2025/inf/fac-inf-123456.pdf", name: "FAC-INF-123456"},
  {id: 2, path: "public/facturas/2025/inf/fac-inf-789012.pdf", name: "FAC-INF-789012"},
  {id: 3, path: "public/facturas/2025/inf/fac-inf-234567.pdf", name: "FAC-INF-234567"},
  {id: 4, path: "public/facturas/2025/mec/fac-mec-345678.pdf", name: "FAC-MEC-345678"},
  {id: 5, path: "public/facturas/2025/mec/fac-mec-456789.pdf", name: "FAC-MEC-456789"},
  {id: 6, path: "public/facturas/2025/ele/fac-ele-567890.pdf", name: "FAC-ELE-567890"},
  {id: 7, path: "public/facturas/2025/ele/fac-ele-678901.pdf", name: "FAC-ELE-678901"},
  {id: 8, path: "public/facturas/2025/rob/fac-rob-789012.pdf", name: "FAC-ROB-789012"},
  {id: 9, path: "public/facturas/2025/rob/fac-rob-890123.pdf", name: "FAC-ROB-890123"},
  {id: 10, path: "public/facturas/2025/aut/fac-aut-901234.pdf", name: "FAC-AUT-901234"},
  {id: 11, path: "public/facturas/2025/aut/fac-aut-012345.pdf", name: "FAC-AUT-012345"}
];

let createdCount = 0;
const pdfContent = createSimplePDF();

// Intentar crear el PDF de ejemplo en la carpeta actual
fs.writeFileSync('sample.pdf', pdfContent);
console.log('✅ Creado PDF de muestra en la carpeta actual: sample.pdf');

// Crear los PDFs en las ubicaciones correctas
updatedPaths.forEach(({ id, path: pdfPath, name }) => {
  try {
    const fullPath = path.join(process.cwd(), pdfPath);
    const directory = path.dirname(fullPath);
    
    // Crear directorio si no existe
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
      console.log(`📁 Directorio creado: ${directory}`);
    }
    
    // Guardar el archivo PDF
    fs.writeFileSync(fullPath, pdfContent);
    console.log(`✅ PDF creado: ${fullPath} (Factura ${name})`);
    createdCount++;
  } catch (error) {
    console.error(`❌ Error creando PDF para factura ${id} (${name}):`, error.message);
  }
});

console.log(`\n📊 Resumen: ${createdCount}/${updatedPaths.length} PDFs creados correctamente.`);
console.log('\n🔍 Si los PDFs no se visualizan correctamente en la aplicación, puedes usar el PDF de muestra (sample.pdf) creado en la raíz del proyecto y copiarlo manualmente a las ubicaciones necesarias.');