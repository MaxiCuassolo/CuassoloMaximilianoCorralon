// ============================================================
// COMPONENTE: fila del catálogo de materiales.
// ============================================================
import { formatearPrecio } from "../formato.js";

export default function crearFilaMaterial(material, cantidadEnCarrito) {
    const sinStock = material.Stock === 0;

    return `
        <tr class="${sinStock ? "fila-agotada" : ""}">
            <td>${material.Nombre}</td>
            <td>${material.Unidad}</td>
            <td>${formatearPrecio(material.Precio)}</td>
            <td>${sinStock ? '<span class="sin-stock">SIN STOCK</span>' : material.Stock}</td>
            <td>
                ${sinStock
                    ? "—"
                    : `<button class="btn btn-agregar" data-accion="agregar"
                        data-id="${material.IdMaterial}">
                        ${cantidadEnCarrito > 0 ? `Agregar (${cantidadEnCarrito})` : "Agregar"}
                    </button>`
                }
            </td>
        </tr>
    `;
}
