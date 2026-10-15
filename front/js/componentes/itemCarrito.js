// ============================================================
// COMPONENTE: item del carrito, con sus controles + / - / quitar.
// Recibe el MATERIAL ya resuelto y la cantidad: no busca nada.
// ============================================================
import { formatearPrecio } from "../formato.js";

export default function crearItemCarrito(material, cantidad) {
    const subtotal = material.Precio * cantidad;

    return `
        <li class="item-carrito">
            <div class="item-info">
                <span class="item-nombre">${material.Nombre}</span>
                <span class="item-subtotal">
                    ${cantidad} × ${formatearPrecio(material.Precio)}
                    = <strong>${formatearPrecio(subtotal)}</strong>
                </span>
            </div>
            <div class="item-controles">
                <button class="btn btn-mini" data-accion="restar"
                    data-id="${material.IdMaterial}">−</button>
                <span class="item-cantidad">${cantidad}</span>
                <button class="btn btn-mini" data-accion="sumar"
                    data-id="${material.IdMaterial}">+</button>
                <button class="btn btn-mini btn-quitar" data-accion="quitar"
                    data-id="${material.IdMaterial}">✕</button>
            </div>
        </li>
    `;
}
