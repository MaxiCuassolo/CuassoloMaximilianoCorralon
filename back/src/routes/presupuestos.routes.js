// ============================================================
// CAPA DE RUTAS - Corralón Don Pedro
// ============================================================
const { Router } = require("express");
const asyncHandler = require("../middlewares/asyncHandler");
const presupuestosController = require("../controllers/presupuestos.controller");

const router = Router();

router.get("/materiales", asyncHandler(presupuestosController.listarMateriales));
router.get("/presupuestos", asyncHandler(presupuestosController.listarPresupuestos));
router.post("/presupuestos", asyncHandler(presupuestosController.crearPresupuesto));

module.exports = router;
