import fs from 'fs';
import path from 'path';

/**
 * Gestiona el almacenamiento de archivos
 */
export const fileStorage = {
  /**
   * Mueve un archivo desde una ubicación temporal a la ubicación definitiva
   * @param {string} sourcePath - Ruta del archivo temporal
   * @param {string} destinationPath - Ruta relativa destino (sin 'public' al inicio)
   * @returns {Promise<boolean>} - Resultado de la operación
   */
  moveFile: async (sourcePath, destinationPath) => {
    try {
      // Asegurar que la ruta destino comienza con '/' pero no tiene 'public'
      let normalizedDestPath = destinationPath;
      if (!normalizedDestPath.startsWith('/')) {
        normalizedDestPath = '/' + normalizedDestPath;
      }
      
      // Construir la ruta completa del destino
      const fullDestPath = path.join(process.cwd(), 'public', normalizedDestPath);
      
      // Crear los directorios necesarios
      const dirPath = path.dirname(fullDestPath);
      await fs.promises.mkdir(dirPath, { recursive: true });
      
      // Copiar el archivo desde la ubicación temporal a la definitiva
      await fs.promises.copyFile(sourcePath, fullDestPath);
      
      // Eliminar el archivo temporal
      await fs.promises.unlink(sourcePath);
      
      return true;
    } catch (error) {
      console.error('Error moviendo archivo:', error);
      return false;
    }
  },
  
  /**
   * Verifica si un archivo existe en una ruta específica
   * @param {string} filePath - Ruta relativa del archivo (sin 'public' al inicio)
   * @returns {Promise<boolean>} - Indica si el archivo existe
   */
  fileExists: async (filePath) => {
    try {
      // Normalizar la ruta
      let normalizedPath = filePath;
      if (normalizedPath.startsWith('/')) {
        normalizedPath = normalizedPath.substring(1);
      }
      
      const fullPath = path.join(process.cwd(), 'public', normalizedPath);
      await fs.promises.access(fullPath, fs.constants.F_OK);
      return true;
    } catch (error) {
      return false;
    }
  },
  
  /**
   * Elimina un archivo de la ruta especificada
   * @param {string} filePath - Ruta relativa del archivo (sin 'public' al inicio)
   * @returns {Promise<boolean>} - Resultado de la operación
   */
  deleteFile: async (filePath) => {
    try {
      // Normalizar la ruta
      let normalizedPath = filePath;
      if (normalizedPath.startsWith('/')) {
        normalizedPath = normalizedPath.substring(1);
      }
      
      const fullPath = path.join(process.cwd(), 'public', normalizedPath);
      
      // Verificar si el archivo existe
      const exists = await fileStorage.fileExists(filePath);
      if (!exists) return false;
      
      // Eliminar el archivo
      await fs.promises.unlink(fullPath);
      return true;
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      return false;
    }
  }
};