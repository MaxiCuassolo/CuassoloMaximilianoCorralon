// ============================================================
// asyncHandler: el compañero del middleware de errores.
//
// Express NO atrapa solo los errores de funciones async: si una
// promesa rechaza y nadie la ataja, el error se pierde. Este
// envoltorio ejecuta el controlador y, si falla, manda el error
// a next() -> y next(error) lo lleva DIRECTO al manejador
// centralizado de errores.js. Gracias a él, los controladores
// ya no necesitan try/catch.
// ============================================================
function asyncHandler(controlador) {
  return (req, res, next) => {
    Promise.resolve(controlador(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
