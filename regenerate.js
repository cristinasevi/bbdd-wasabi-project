const fs = require('fs');
const path = require('path');
const https = require('http');

// IDs de facturas a regenerar
const facturaIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; // Añade todos los IDs que necesites

// Función para hacer petición a la API para cada factura
async function regenerarFactura(id) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/facturas/generate?id=${id}`,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`✅ Factura ${id} regenerada`);
        resolve(data);
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Error regenerando factura ${id}:`, error.message);
      reject(error);
    });

    req.end();
  });
}

// Función principal
async function regenerarTodasLasFacturas() {
  console.log('🚀 Iniciando regeneración de PDFs...');
  
  for (const id of facturaIds) {
    try {
      await regenerarFactura(id);
    } catch (error) {
      console.error(`Error con factura ${id}:`, error);
    }
  }
  
  console.log('✅ Proceso finalizado');
}

// Ejecutar el proceso
regenerarTodasLasFacturas();