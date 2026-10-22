// ============================================================
// Front - Corralón Don Pedro (Clase 15)
//
// LA CLASE DE HOY, EN TRES REGLAS DE ESTADO:
// 1. Una sola fuente de verdad: el objeto `estado`.
// 2. Lo que se puede CALCULAR no se guarda: el total sale de
//    carrito + materiales en el momento de renderizar.
// 3. Los eventos no editan el DOM: transforman el estado
//    (map / filter / spread) y piden el re-render.
// ============================================================
import { obtenerMateriales, obtenerPresupuestos, guardarPresupuesto } from "./api.js";
import crearFilaMaterial from "./componentes/filaMaterial.js";
import crearItemCarrito from "./componentes/itemCarrito.js";
import { formatearPrecio, formatearFecha } from "./formato.js";

const cuerpoMateriales = document.querySelector("#cuerpoMateriales");
const listaCarrito = document.querySelector("#listaCarrito");
const totalCarrito = document.querySelector("#totalCarrito");
const formPresupuesto = document.querySelector("#formPresupuesto");
const inputCliente = document.querySelector("#cliente");
const btnVaciar = document.querySelector("#btnVaciar");
const mensajeCarrito = document.querySelector("#mensajeCarrito");
const cuerpoPresupuestos = document.querySelector("#cuerpoPresupuestos");

// ------------------------------------------------------------
// ESTADO: la única fuente de verdad
// ------------------------------------------------------------
const estado = {
    materiales: [],
    carrito: []      // [{ id, cantidad }] — NADA más: ni nombres
                     // ni precios ni totales (eso se CALCULA)
};

function mostrarMensaje(texto, tipo) {
    mensajeCarrito.textContent = texto;
    mensajeCarrito.className = `mensaje ${tipo}`;
    setTimeout(() => {
        mensajeCarrito.textContent = "";
        mensajeCarrito.className = "mensaje";
    }, 6000);
}

// ------------------------------------------------------------
// DATOS DERIVADOS: se calculan del estado, nunca se guardan
// ------------------------------------------------------------
function buscarMaterial(id) {
    return estado.materiales.find(m => m.IdMaterial === id);
}

function cantidadEnCarrito(id) {
    const item = estado.carrito.find(i => i.id === id);
    return item ? item.cantidad : 0;
}

function calcularTotal() {
    return estado.carrito.reduce((total, item) => {
        const material = buscarMaterial(item.id);
        return total + (material ? material.Precio * item.cantidad : 0);
    }, 0);
}

// ------------------------------------------------------------
// RENDER
// ------------------------------------------------------------
function renderMateriales() {
    cuerpoMateriales.innerHTML = estado.materiales
        .map(m => crearFilaMaterial(m, cantidadEnCarrito(m.IdMaterial)))
        .join("");
}

function renderCarrito() {
    if (estado.carrito.length === 0) {
        listaCarrito.innerHTML =
            '<li class="carrito-vacio">El carrito está vacío.</li>';
        totalCarrito.textContent = formatearPrecio(0);
        return;
    }

    listaCarrito.innerHTML = estado.carrito
        .map(item => {
            const material = buscarMaterial(item.id);
            return material ? crearItemCarrito(material, item.cantidad) : "";
        })
        .join("");

    totalCarrito.textContent = formatearPrecio(calcularTotal());
}

function renderTodo() {
    renderMateriales();
    renderCarrito();
}

async function renderPresupuestos() {
    try {
        const presupuestos = await obtenerPresupuestos();

        cuerpoPresupuestos.innerHTML = presupuestos.length
            ? presupuestos.map(p => `
                <tr>
                    <td>${p.IdPresupuesto}</td>
                    <td>${p.Cliente}</td>
                    <td>${p.CantidadItems}</td>
                    <td>${formatearPrecio(p.Total)}</td>
                    <td>${formatearFecha(p.Fecha)}</td>
                </tr>
            `).join("")
            : '<tr><td colspan="5">Todavía no hay presupuestos.</td></tr>';
    } catch (error) {
        cuerpoPresupuestos.innerHTML =
            `<tr><td colspan="5">${error.message}</td></tr>`;
        console.error(error);
    }
}

// ------------------------------------------------------------
// TRANSFORMACIONES DEL ESTADO (los eventos solo llaman a estas)
// ------------------------------------------------------------
function agregarAlCarrito(id) {
    const material = buscarMaterial(id);
    if (!material) {
        return;
    }
    const actual = cantidadEnCarrito(id);

    if (actual + 1 > material.Stock) {
        mostrarMensaje(`No hay más stock de ${material.Nombre}.`, "error");
        return;
    }

    if (actual === 0) {
        estado.carrito = [...estado.carrito, { id, cantidad: 1 }];
    } else {
        estado.carrito = estado.carrito.map(item =>
            item.id === id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
    }
}

function restarDelCarrito(id) {
    estado.carrito = estado.carrito
        .map(item => item.id === id
            ? { ...item, cantidad: item.cantidad - 1 }
            : item)
        .filter(item => item.cantidad > 0);   // llegó a 0 -> se va
}

function quitarDelCarrito(id) {
    estado.carrito = estado.carrito.filter(item => item.id !== id);
}

function vaciarCarrito() {
    estado.carrito = [];
}

// ------------------------------------------------------------
// EVENTOS (delegación con data-accion + data-id)
// ------------------------------------------------------------
const ACCIONES = {
    agregar: agregarAlCarrito,
    sumar: agregarAlCarrito,
    restar: restarDelCarrito,
    quitar: quitarDelCarrito
};

function manejarAccion(evento) {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton) {
        return;
    }

    const accion = ACCIONES[boton.dataset.accion];
    if (typeof accion === "function") {
        accion(Number(boton.dataset.id));
        renderTodo();
    }
}

cuerpoMateriales.addEventListener("click", manejarAccion);
listaCarrito.addEventListener("click", manejarAccion);

btnVaciar.addEventListener("click", () => {
    vaciarCarrito();
    renderTodo();
});

formPresupuesto.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    if (estado.carrito.length === 0) {
        mostrarMensaje("Agregá al menos un material.", "error");
        return;
    }

    try {
        const datos = await guardarPresupuesto(inputCliente.value, estado.carrito);

        // datos.total lo calculó la BASE (nunca el front)
        mostrarMensaje(
            `${datos.mensaje} Total: ${formatearPrecio(datos.total)}.`,
            "ok"
        );

        vaciarCarrito();
        formPresupuesto.reset();

        // El stock cambió en la base: se recarga el catálogo
        estado.materiales = await obtenerMateriales();
        renderTodo();
        renderPresupuestos();
    } catch (error) {
        mostrarMensaje(error.message, "error");
        console.error(error);
    }
});

// ------------------------------------------------------------
// Inicio
// ------------------------------------------------------------
async function iniciar() {
    try {
        estado.materiales = await obtenerMateriales();
        renderTodo();
        renderPresupuestos();
    } catch (error) {
        cuerpoMateriales.innerHTML =
            '<tr><td colspan="5">No se pudo conectar con la API.</td></tr>';
        console.error(error);
    }
}

iniciar();
