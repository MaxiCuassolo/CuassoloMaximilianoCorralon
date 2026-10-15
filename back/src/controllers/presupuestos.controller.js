// ============================================================
// CAPA DE CONTROLADORES - Corralón Don Pedro
// ============================================================
const presupuestosService = require("../services/presupuestos.service");

// GET /api/materiales
async function listarMateriales(req, res) {
  const materiales = await presupuestosService.listarMateriales();
  res.json(materiales);
}

// GET /api/presupuestos
async function listarPresupuestos(req, res) {
  const presupuestos = await presupuestosService.listarPresupuestos();
  res.json(presupuestos);
}

// POST /api/presupuestos
async function crearPresupuesto(req, res) {
  const { cliente, items } = req.body;

  if (!cliente || cliente.trim() === "") {
    return res.status(400).json({ mensaje: "El nombre del cliente es obligatorio." });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ mensaje: "El presupuesto debe tener al menos un item." });
  }

  const itemsLimpios = [];
  for (const item of items) {
    const id = Number(item.id);
    const cantidad = Number(item.cantidad);

    if (Number.isNaN(id) || Number.isNaN(cantidad) || cantidad <= 0) {
      return res.status(400).json({
        mensaje: "Cada item debe tener id numérico y cantidad mayor a cero."
      });
    }
    itemsLimpios.push({ id, cantidad });
  }

  const { idPresupuesto, total } = await presupuestosService.crear({
    cliente: cliente.trim(),
    items: itemsLimpios
  });

  res.status(201).json({
    idPresupuesto,
    total,
    mensaje: `Presupuesto N° ${idPresupuesto} guardado.`
  });
}

module.exports = { listarMateriales, listarPresupuestos, crearPresupuesto };
