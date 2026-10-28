using System;
using System.Linq;

namespace WebApi_TransporteSanchez.Controllers
{
    /// <summary>Ordena la búsqueda de clientes antes de aplicar la paginación.</summary>
    public static class ClientesOrden
    {
        public static IOrderedQueryable<CLIENTES> Aplicar(IQueryable<CLIENTES> query, string orden, string direccion)
        {
            var sentido = (direccion ?? "").Trim().ToLowerInvariant();
            if (sentido != "asc" && sentido != "desc")
                return query.OrderByDescending(c => c.Cliente_ID);

            var descendente = sentido == "desc";
            switch ((orden ?? "").Trim().ToLowerInvariant())
            {
                case "razonsocial":
                    return descendente
                        ? query.OrderByDescending(c => c.Razon_Social).ThenByDescending(c => c.Cliente_ID)
                        : query.OrderBy(c => c.Razon_Social).ThenByDescending(c => c.Cliente_ID);
                case "cuit":
                    return descendente
                        ? query.OrderByDescending(c => c.CUIT_Cliente).ThenByDescending(c => c.Cliente_ID)
                        : query.OrderBy(c => c.CUIT_Cliente).ThenByDescending(c => c.Cliente_ID);
                case "fechaalta":
                    return descendente
                        ? query.OrderByDescending(c => c.Fecha_Alta).ThenByDescending(c => c.Cliente_ID)
                        : query.OrderBy(c => c.Fecha_Alta).ThenByDescending(c => c.Cliente_ID);
                default:
                    return query.OrderByDescending(c => c.Cliente_ID);
            }
        }
    }
}
