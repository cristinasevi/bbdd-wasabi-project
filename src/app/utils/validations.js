// src/app/utils/validations.js
// Utilidades de validación para NIF/CIF y otros campos

export const validateNIF = (nif) => {
  if (!nif) return { valid: false, error: "El NIF/CIF es obligatorio" };
  
  // Eliminar espacios y convertir a mayúsculas
  const cleanNIF = nif.trim().toUpperCase();
  
  // Verificar longitud (debe ser entre 8 y 9 caracteres)
  if (cleanNIF.length < 8 || cleanNIF.length > 9) {
    return { valid: false, error: "El NIF/CIF debe tener entre 8 y 9 caracteres" };
  }
  
  // Verificar que no exceda la longitud máxima de la base de datos
  if (cleanNIF.length > 20) {
    return { valid: false, error: "El NIF/CIF es demasiado largo (máximo 20 caracteres)" };
  }
  
  // Patrones para validar diferentes tipos de identificadores españoles
  const patterns = {
    nif: /^[0-9]{8}[A-Z]$/,           // DNI: 8 números + 1 letra
    nie: /^[XYZ][0-9]{7}[A-Z]$/,      // NIE: X/Y/Z + 7 números + 1 letra
    cif: /^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/ // CIF: 1 letra + 7 números + 1 dígito/letra
  };
  
  // Verificar si coincide con algún patrón
  const isNIF = patterns.nif.test(cleanNIF);
  const isNIE = patterns.nie.test(cleanNIF);
  const isCIF = patterns.cif.test(cleanNIF);
  
  if (!isNIF && !isNIE && !isCIF) {
    return { 
      valid: false, 
      error: "Formato no válido. Debe ser: DNI (12345678A), NIE (X1234567A) o CIF (A12345678)" 
    };
  }
  
  // Validación específica del dígito de control para DNI
  if (isNIF) {
    const dni = cleanNIF.substring(0, 8);
    const letter = cleanNIF.substring(8, 9);
    const validLetters = "TRWAGMYFPDXBNJZSQVHLCKE";
    const expectedLetter = validLetters[parseInt(dni) % 23];
    
    if (letter !== expectedLetter) {
      return { valid: false, error: "La letra del DNI no es correcta" };
    }
  }
  
  // Validación específica del dígito de control para NIE
  if (isNIE) {
    let nieNumber = cleanNIF.substring(1, 8);
    const letter = cleanNIF.substring(8, 9);
    const firstChar = cleanNIF.substring(0, 1);
    
    // Convertir primera letra a número para el cálculo
    if (firstChar === 'X') nieNumber = '0' + nieNumber.substring(1);
    else if (firstChar === 'Y') nieNumber = '1' + nieNumber.substring(1);
    else if (firstChar === 'Z') nieNumber = '2' + nieNumber.substring(1);
    
    const validLetters = "TRWAGMYFPDXBNJZSQVHLCKE";
    const expectedLetter = validLetters[parseInt(nieNumber) % 23];
    
    if (letter !== expectedLetter) {
      return { valid: false, error: "La letra del NIE no es correcta" };
    }
  }
  
  return { valid: true, formatted: cleanNIF };
};

// Función para validar email
export const validateEmail = (email) => {
  if (!email) return { valid: true }; // Email es opcional
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: "El formato del email no es válido" };
  }
  
  if (email.length > 100) {
    return { valid: false, error: "El email es demasiado largo (máximo 100 caracteres)" };
  }
  
  return { valid: true };
};

// Función para validar teléfono
export const validatePhone = (telefono) => {
  if (!telefono) return { valid: true }; // Teléfono es opcional
  
  const cleanPhone = telefono.replace(/\s/g, '');
  if (!/^[+]?[0-9]{9,15}$/.test(cleanPhone)) {
    return { valid: false, error: "El formato del teléfono no es válido (9-15 dígitos)" };
  }
  
  return { valid: true };
};

// Función principal para validar todo el formulario de proveedor
export const validateProveedorForm = (formData, existingProveedores = [], currentId = null) => {
  const errors = {};
  
  // Validar nombre
  if (!formData.nombre || formData.nombre.trim().length === 0) {
    errors.nombre = "El nombre es obligatorio";
  } else if (formData.nombre.trim().length > 100) {
    errors.nombre = "El nombre es demasiado largo (máximo 100 caracteres)";
  }
  
  // Validar NIF
  const nifValidation = validateNIF(formData.nif);
  if (!nifValidation.valid) {
    errors.nif = nifValidation.error;
  } else {
    // Verificar si el NIF ya existe (excluyendo el proveedor actual en modo edición)
    const nifExists = existingProveedores.some(p => 
      p.NIF && p.NIF.toUpperCase() === nifValidation.formatted && p.idProveedor !== currentId
    );
    if (nifExists) {
      errors.nif = "Ya existe un proveedor con este NIF/CIF";
    }
  }
  
  // Validar email (si se proporciona)
  if (formData.email && formData.email.trim().length > 0) {
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.valid) {
      errors.email = emailValidation.error;
    } else {
      // Verificar si el email ya existe (excluyendo el proveedor actual en modo edición)
      const emailExists = existingProveedores.some(p => 
        p.Email && p.Email.toLowerCase() === formData.email.trim().toLowerCase() && p.idProveedor !== currentId
      );
      if (emailExists) {
        errors.email = "Ya existe un proveedor con este email";
      }
    }
  }
  
  // Validar teléfono (si se proporciona)
  if (formData.telefono && formData.telefono.trim().length > 0) {
    const phoneValidation = validatePhone(formData.telefono);
    if (!phoneValidation.valid) {
      errors.telefono = phoneValidation.error;
    } else {
      // Verificar si el teléfono ya existe (excluyendo el proveedor actual en modo edición)
      const cleanPhone = formData.telefono.replace(/\s/g, '');
      const phoneExists = existingProveedores.some(p => 
        p.Telefono && p.Telefono.replace(/\s/g, '') === cleanPhone && p.idProveedor !== currentId
      );
      if (phoneExists) {
        errors.telefono = "Ya existe un proveedor con este número de teléfono";
      }
    }
  }
  
  // Validar dirección
  if (formData.direccion && formData.direccion.length > 200) {
    errors.direccion = "La dirección es demasiado larga (máximo 200 caracteres)";
  }
  
  // Validar departamento
  if (!formData.departamento || formData.departamentos.length === 0) {
    errors.departamento = "Debe seleccionar al menos un departamento";
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};