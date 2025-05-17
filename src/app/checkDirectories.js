const fs = require('fs');
const path = require('path');

// Función para verificar o crear directorios
function checkAndCreateDirectory(dirPath) {
  try {
    // Verificar si existe el directorio
    if (!fs.existsSync(dirPath)) {
      console.log(`Directorio no encontrado: ${dirPath}`);
      console.log(`Creando directorio: ${dirPath}`);
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Directorio creado exitosamente: ${dirPath}`);
    } else {
      console.log(`✅ Directorio encontrado: ${dirPath}`);
      
      // Verificar permisos de escritura
      try {
        const testFile = path.join(dirPath, '.write-test');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        console.log(`✅ El directorio tiene permisos de escritura: ${dirPath}`);
      } catch (error) {
        console.error(`❌ El directorio no tiene permisos de escritura: ${dirPath}`);
        console.error(error.message);
      }
    }
  } catch (error) {
    console.error(`❌ Error al verificar/crear directorio: ${dirPath}`);
    console.error(error.message);
  }
}

// Directorios a verificar
const rootDir = path.join(process.cwd(), 'public');
const facturasDir = path.join(rootDir, 'facturas');
// Agregar ejemplos para subdirectorios comunes
const year = new Date().getFullYear();
const yearDir = path.join(facturasDir, `${year}`);
// Verificar algunos departamentos comunes
const depDirs = ['info', 'cont', 'admi', 'meca'].map(dep => path.join(yearDir, dep));

// Verificar/crear directorios
console.log('Verificando estructura de directorios para facturas...');
checkAndCreateDirectory(rootDir);
checkAndCreateDirectory(facturasDir);
checkAndCreateDirectory(yearDir);
depDirs.forEach(dir => checkAndCreateDirectory(dir));

console.log('\nInstrucciones:');
console.log('1. Si algún directorio no se pudo crear, crea los directorios manualmente.');
console.log('2. Asegúrate de que el usuario que ejecuta la aplicación tenga permisos de escritura en estos directorios.');
console.log('3. Una vez que la estructura de directorios esté correcta, podrás subir y acceder a los PDFs.');