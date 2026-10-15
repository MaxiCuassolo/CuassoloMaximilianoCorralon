// ============================================================
// LA NOVEDAD DE LA CLASE 12: manejo CENTRALIZADO de errores.
//
// Hasta hoy, cada controlador repetía su try/catch con la misma
// traducción de errores. Desde hoy, esa lógica vive en UN solo
// lugar: este middleware. Express lo reconoce como manejador de
// errores porque tiene CUATRO parámetros (err, req, res, next).
// ============================================================
const fs = require("fs");
const path = require("path");

// Códigos de negocio que significan "no existe" -> 404
const NO_EXISTE = [50017, 50018, 50022, 50024];

const CARPETA_LOGS = path.join(__dirname, "../../logs");
const ARCHIVO_ERRORES = path.join(CARPETA_LOGS, "errores.log");

// Registra el error en logs/errores.log (además de la consola)
function registrarError(error, req) {
  const linea = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
    + ` -> ${error.number || "sin código"} | ${error.message}\n`;

  try {
    if (!fs.existsSync(CARPETA_LOGS)) {
      fs.mkdirSync(CARPETA_LOGS);
    }
    fs.appendFileSync(ARCHIVO_ERRORES, linea);
  } catch (errorDeLog) {
    // Si el log falla, no puede tirar abajo la respuesta
    console.error("No se pudo escribir el log:", errorDeLog.message);
  }
}

// ------------------------------------------------------------
// El middleware de errores: el catch de 3 niveles, UNA sola vez
// ------------------------------------------------------------
function manejadorErrores(err, req, res, next) {
  registrarError(err, req);

  // 1) Errores de negocio "no existe" -> 404
  if (NO_EXISTE.includes(err.number)) {
    return res.status(404).json({ mensaje: err.message });
  }

  // 2) Cualquier otro error de negocio de la cátedra -> 400
  if (err.number >= 50000) {
    return res.status(400).json({ mensaje: err.message });
  }

  // 3) Error inesperado -> 500 (el detalle queda en el log, no
  //    viaja al cliente: nunca se filtra información interna)
  console.error("Error inesperado:", err);
  return res.status(500).json({ mensaje: "Error interno del servidor." });
}

// ------------------------------------------------------------
// Manejador de rutas inexistentes (se monta al final de todo)
// ------------------------------------------------------------
function rutaNoEncontrada(req, res) {
  res.status(404).json({ mensaje: `No existe la ruta ${req.method} ${req.originalUrl}.` });
}

module.exports = { manejadorErrores, rutaNoEncontrada };
