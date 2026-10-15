// ============================================================
// MÓDULO utilitario: formatos compartidos.
// (El desafío opcional de la C14, ya como estándar.)
// ============================================================
const formatoPrecio = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
});

export function formatearPrecio(valor) {
    return formatoPrecio.format(valor);
}

const formatoFecha = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short"
});

export function formatearFecha(valor) {
    return formatoFecha.format(new Date(valor));
}
