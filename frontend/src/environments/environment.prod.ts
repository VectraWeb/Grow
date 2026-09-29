// Variables de entorno para producción: API URL, modo debug desactivado
// Configuración para deployment en servidores de producción
// IMPORTANTE: Cambiar esta URL por la de tu servidor antes de deployar
export const environment = {
  production: true,
  apiUrl: "https://ferreteria-backend-iq4m.onrender.com/api",
};

// Agregar número de WhatsApp y mensaje por defecto para el botón flotante
export const whatsappConfig = {
  number: "5491123456789", // Poné el mismo número de tu environment de desarrollo
  defaultMessage: "Hola, tengo una consulta sobre un producto.",
};
