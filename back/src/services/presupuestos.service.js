// ============================================================
// CAPA DE SERVICIOS - Corralón Don Pedro
// El carrito viaja al SP como UN parámetro JSON (@Items).
// JSON.stringify acá <-> OPENJSON en el SP: mismo idioma.
// ============================================================
const { sql, getConnection } = require("../config/db");

async function listarMateriales() {
  const pool = await getConnection();
  const resultado = await pool.request().execute("usp_ListarMateriales");
  return resultado.recordset;
}

async function listarPresupuestos() {
  const pool = await getConnection();
  const resultado = await pool.request().execute("usp_ListarPresupuestos");
  return resultado.recordset;
}

async function crear({ cliente, items }) {
  const pool = await getConnection();

  const resultado = await pool.request()
    .input("Cliente", sql.NVarChar(80), cliente)
    .input("Items", sql.NVarChar(sql.MAX), JSON.stringify(items))
    .output("IdPresupuesto", sql.Int)
    .output("Total", sql.Decimal(12, 2))
    .execute("usp_CrearPresupuesto");

  // DOS parámetros OUTPUT: el id y el total que calculó la base
  return {
    idPresupuesto: resultado.output.IdPresupuesto,
    total: resultado.output.Total
  };
}

module.exports = { listarMateriales, listarPresupuestos, crear };
