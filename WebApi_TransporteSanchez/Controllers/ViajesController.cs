using System;
using System.Collections.Generic;
using System.Data.Entity.Validation;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace WebApi_TransporteSanchez.Controllers
{
    public class ViajesController : ApiController
    {

        public class ViajeDto
        {
            public int Viaje_ID { get; set; }
            public int OrigenID { get; set; }
            public int DestinoID { get; set; }
            public string Distancia_KM { get; set; }
            public string Num_Remito { get; set; }
            public string Num_de_Carga { get; set; }
            public System.DateTime Fecha_Inicio { get; set; }
            public System.DateTime Fecha_Fin { get; set; }
            public int ChofCamID { get; set; }
            public int TarifaFijaID { get; set; }
            public int TarifaKmID { get; set; }
            public int ClienteID { get; set; }

        }

        // GET: api/Viajes
        public IHttpActionResult Get()
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    var olist = db.Set<VIAJES>()
                        .Select(c => new ViajeDto
                        {
                            Viaje_ID = c.Viaje_ID,
                            OrigenID = c.OrigenID,
                            DestinoID = c.DestinoID,
                            Distancia_KM = c.Distancia_KM,
                            Num_Remito = c.Num_Remito,
                            Num_de_Carga = c.Num_de_Carga,
                            Fecha_Inicio = c.Fecha_Inicio,
                            Fecha_Fin = c.Fecha_Fin,
                            TarifaFijaID = c.TarifaFijaID,
                            TarifaKmID = c.TarifaKmID,
                            ClienteID = c.ClienteID,
                        })
                        .ToList();

                    if (olist == null || !olist.Any())
                    {
                        return NotFound(); // Retorna 404 si no se encuentran viajes
                    }

                    return Ok(olist); // Retorna 200 OK con la lista de viajes
                }
            }
            catch (DbEntityValidationException ex)
            {
                // Manejo de errores de validación
                var validationErrors = new List<string>();

                foreach (var validationResult in ex.EntityValidationErrors)
                {
                    foreach (var error in validationResult.ValidationErrors)
                    {
                        validationErrors.Add($"Property: {error.PropertyName}, Error: {error.ErrorMessage}");
                    }
                }

                return Content(HttpStatusCode.BadRequest, validationErrors); // Retorna 400 Bad Request con errores de validación
            }
            catch (Exception ex)
            {
                return InternalServerError(ex); // Retorna 500 en caso de error interno
            }
        }

    }
}
