// ============================================================
// Servidor principal - Corralón Don Pedro
// Clase 15: estado y eventos (el carrito del presupuestador)
//
// NOVEDAD: el servidor ahora también SIRVE EL FRONT.
// Los ES Modules no funcionan abriendo el archivo con doble
// clic (file:// bloquea los import por seguridad): el front
// tiene que llegar por HTTP. Desde hoy, la página se abre en
//     http://localhost:3000
// y la API sigue viviendo en /api. Un solo servidor para todo,
// como en producción.
// ============================================================
const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const logger = require("./middlewares/logger");
const { manejadorErrores, rutaNoEncontrada } = require("./middlewares/errores");
const presupuestosRoutes = require("./routes/presupuestos.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger);

// El front (carpeta hermana) se sirve como archivos estáticos:
// index.html, estilos.css y los módulos de js/
app.use(express.static(path.join(__dirname, "../../front")));

app.use("/api", presupuestosRoutes);

app.use(rutaNoEncontrada);
app.use(manejadorErrores);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Sistema completo en http://localhost:${PORT}`);
  console.log("(el front y la API salen del mismo servidor)");
});
