// ============================================================
// MÓDULO api.js: toda la comunicación con el backend
// (la capa de servicios del front — estándar desde la C14).
// ============================================================
const API_URL = "/api";

async function pedirJson(url, opciones) {
    const respuesta = await fetch(url, opciones);
    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(datos.mensaje || "Error al comunicarse con la API.");
    }

    return datos;
}

export function obtenerMateriales() {
    return pedirJson(`${API_URL}/materiales`);
}

export function obtenerPresupuestos() {
    return pedirJson(`${API_URL}/presupuestos`);
}

export function guardarPresupuesto(cliente, items) {
    return pedirJson(`${API_URL}/presupuestos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente, items })
    });
}
