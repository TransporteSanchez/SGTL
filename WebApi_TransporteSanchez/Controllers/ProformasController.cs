using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Data.Entity.Validation;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Web.Http;

namespace WebApi_TransporteSanchez.Controllers
{
    // Fase 3: Facturacion. Una proforma resume los viajes de un cliente en un rango de fechas.
    // La tabla PROFORMAS guarda solo el resumen (ImporteTotal, CantidadViajes); el detalle
    // de viajes se recalcula al vuelo a partir de ClienteID + FechaDesde + FechaHasta.
    public class ProformasController : ApiController
    {
        // ---------- DTOs ----------
        public class ViajeDetalleDto
        {
            public int Viaje_ID { get; set; }
            public System.DateTime Fecha_Inicio { get; set; }
            public string Origen { get; set; }
            public string Destino { get; set; }
            public string Num_Remito { get; set; }
            public string Distancia_KM { get; set; }
            public string TipoTarifa { get; set; }
            public decimal Importe { get; set; }
        }

        public class PreviaDto
        {
            public int ClienteID { get; set; }
            public string ClienteRazon { get; set; }
            public System.DateTime FechaDesde { get; set; }
            public System.DateTime FechaHasta { get; set; }
            public int CantidadViajes { get; set; }
            public decimal ImporteTotal { get; set; }
            public List<ViajeDetalleDto> Viajes { get; set; }
        }

        public class ProformaDto
        {
            public int Proforma_ID { get; set; }
            public int? ClienteID { get; set; }
            public string ClienteRazon { get; set; }
            public System.DateTime? FechaDesde { get; set; }
            public System.DateTime? FechaHasta { get; set; }
            public decimal? ImporteTotal { get; set; }
            public string CantidadViajes { get; set; }
            public System.DateTime? FechaCreacion { get; set; }
        }

        public class GenerarProformaDto
        {
            public int ClienteID { get; set; }
            public string FechaDesde { get; set; }
            public string FechaHasta { get; set; }
        }

        private static string Cn()
        {
            return ConnectionStringHelper.GetConnectionString("SGTLEntities");
        }

        private static decimal ParseDec(string raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return 0;
            var s = raw.Trim().Replace(',', '.');
            decimal v;
            return decimal.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out v) ? v : 0;
        }

        // Nucleo: arma el detalle (viajes + importes) para un cliente y rango.
        private PreviaDto Calcular(DbContext db, int clienteId, DateTime desde, DateTime hasta)
        {
            var hastaFin = hasta.Date.AddDays(1).AddTicks(-1); // incluir todo el dia

            // Tarifas precargadas para no consultar por cada viaje
            var fijas = db.Set<TARIFAS_FIJAS>()
                .Select(t => new { t.TarifaFija_ID, t.ValorFijoNeto })
                .ToDictionary(t => t.TarifaFija_ID, t => t.ValorFijoNeto);

            var kms = db.Set<TARIFAS_KM>()
                .Select(t => new { t.TarifaKm_ID, t.ValorKm })
                .ToList()
                .ToDictionary(t => t.TarifaKm_ID, t => t.ValorKm);

            var filas = (from v in db.Set<VIAJES>()
                         join o in db.Set<ORIGEN>() on v.OrigenID equals o.Origen_ID into oj
                         from o in oj.DefaultIfEmpty()
                         join d in db.Set<DESTINO>() on v.DestinoID equals d.Destino_ID into dj
                         from d in dj.DefaultIfEmpty()
                         where v.ClienteID == clienteId && v.Fecha_Inicio >= desde && v.Fecha_Inicio <= hastaFin
                         orderby v.Fecha_Inicio
                         select new
                         {
                             v.Viaje_ID,
                             v.Fecha_Inicio,
                             Origen = o != null ? o.Descripcion : "",
                             Destino = d != null ? d.Descripcion : "",
                             v.Num_Remito,
                             v.Distancia_KM,
                             v.TarifaFijaID,
                             v.TarifaKmID
                         }).ToList();

            var detalle = new List<ViajeDetalleDto>();
            decimal total = 0;

            foreach (var f in filas)
            {
                decimal importe = 0;
                string tipo = "Sin tarifa";

                if (f.TarifaFijaID.HasValue && f.TarifaFijaID.Value > 0 && fijas.ContainsKey(f.TarifaFijaID.Value))
                {
                    importe = fijas[f.TarifaFijaID.Value];
                    tipo = "Fija";
                }
                else if (f.TarifaKmID.HasValue && f.TarifaKmID.Value > 0 && kms.ContainsKey(f.TarifaKmID.Value))
                {
                    importe = kms[f.TarifaKmID.Value] * ParseDec(f.Distancia_KM);
                    tipo = "Por km";
                }

                importe = decimal.Round(importe, 2, MidpointRounding.AwayFromZero);
                total += importe;

                detalle.Add(new ViajeDetalleDto
                {
                    Viaje_ID = f.Viaje_ID,
                    Fecha_Inicio = f.Fecha_Inicio,
                    Origen = f.Origen,
                    Destino = f.Destino,
                    Num_Remito = f.Num_Remito,
                    Distancia_KM = f.Distancia_KM,
                    TipoTarifa = tipo,
                    Importe = importe
                });
            }

            var cli = db.Set<CLIENTES>().Where(c => c.Cliente_ID == clienteId).Select(c => c.Razon_Social).FirstOrDefault();

            return new PreviaDto
            {
                ClienteID = clienteId,
                ClienteRazon = cli ?? "",
                FechaDesde = desde,
                FechaHasta = hasta,
                CantidadViajes = detalle.Count,
                ImporteTotal = decimal.Round(total, 2, MidpointRounding.AwayFromZero),
                Viajes = detalle
            };
        }

        // GET: api/Proformas/Previsualizar?clienteId=&fechaDesde=&fechaHasta=
        // Devuelve el detalle SIN guardar (para mostrar antes de generar).
        [HttpGet]
        [Route("api/Proformas/Previsualizar")]
        public IHttpActionResult Previsualizar(int clienteId, string fechaDesde, string fechaHasta)
        {
            DateTime desde, hasta;
            if (clienteId <= 0) return BadRequest("Debe seleccionar un cliente.");
            if (!DateTime.TryParse(fechaDesde, out desde)) return BadRequest("La fecha desde no es válida.");
            if (!DateTime.TryParse(fechaHasta, out hasta)) return BadRequest("La fecha hasta no es válida.");
            if (hasta < desde) return BadRequest("La fecha hasta no puede ser anterior a la fecha desde.");

            try
            {
                using (var db = new DbContext(Cn()))
                {
                    return Ok(Calcular(db, clienteId, desde, hasta));
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // POST: api/Proformas  -> genera y GUARDA la proforma
        [HttpPost]
        [Route("api/Proformas")]
        public IHttpActionResult Generar([FromBody] GenerarProformaDto dto)
        {
            if (dto == null) return BadRequest("No se recibieron datos.");
            DateTime desde, hasta;
            if (dto.ClienteID <= 0) return BadRequest("Debe seleccionar un cliente.");
            if (!DateTime.TryParse(dto.FechaDesde, out desde)) return BadRequest("La fecha desde no es válida.");
            if (!DateTime.TryParse(dto.FechaHasta, out hasta)) return BadRequest("La fecha hasta no es válida.");
            if (hasta < desde) return BadRequest("La fecha hasta no puede ser anterior a la fecha desde.");

            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var previa = Calcular(db, dto.ClienteID, desde, hasta);

                    if (previa.CantidadViajes == 0)
                        return Content(HttpStatusCode.BadRequest, new { Message = "No hay viajes para ese cliente en el período seleccionado." });

                    var p = new PROFORMAS
                    {
                        ClienteID = dto.ClienteID,
                        FechaDesde = desde,
                        FechaHasta = hasta,
                        ImporteTotal = previa.ImporteTotal,
                        CantidadViajes = previa.CantidadViajes.ToString(),
                        FechaCreacion = DateTime.Now
                    };

                    db.Set<PROFORMAS>().Add(p);
                    db.SaveChanges();

                    return Ok(new { p.Proforma_ID, Message = "Proforma generada correctamente.", previa.ImporteTotal, previa.CantidadViajes });
                }
            }
            catch (DbEntityValidationException ex)
            {
                var errs = ex.EntityValidationErrors.SelectMany(e => e.ValidationErrors)
                    .Select(e => new { e.PropertyName, e.ErrorMessage }).ToList();
                return Content(HttpStatusCode.BadRequest, errs);
            }
            catch (DbUpdateException ex)
            {
                var msg = ex.InnerException?.InnerException?.Message ?? ex.InnerException?.Message ?? ex.Message;
                return InternalServerError(new Exception(msg));
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // GET: api/Proformas  -> lista de proformas guardadas
        [HttpGet]
        [Route("api/Proformas")]
        public IHttpActionResult Listar()
        {
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var olist = (from p in db.Set<PROFORMAS>()
                                 join c in db.Set<CLIENTES>() on p.ClienteID equals c.Cliente_ID into cj
                                 from c in cj.DefaultIfEmpty()
                                 orderby p.Proforma_ID descending
                                 select new ProformaDto
                                 {
                                     Proforma_ID = p.Proforma_ID,
                                     ClienteID = p.ClienteID,
                                     ClienteRazon = c != null ? c.Razon_Social : "",
                                     FechaDesde = p.FechaDesde,
                                     FechaHasta = p.FechaHasta,
                                     ImporteTotal = p.ImporteTotal,
                                     CantidadViajes = p.CantidadViajes,
                                     FechaCreacion = p.FechaCreacion
                                 }).ToList();

                    return Ok(olist);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // GET: api/Proformas/{id}  -> proforma + detalle recalculado (para ver/imprimir)
        [HttpGet]
        [Route("api/Proformas/{id:int}")]
        public IHttpActionResult Detalle(int id)
        {
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var p = db.Set<PROFORMAS>().Find(id);
                    if (p == null) return NotFound();

                    PreviaDto detalle = null;
                    if (p.ClienteID.HasValue && p.FechaDesde.HasValue && p.FechaHasta.HasValue)
                        detalle = Calcular(db, p.ClienteID.Value, p.FechaDesde.Value, p.FechaHasta.Value);

                    var cli = p.ClienteID.HasValue
                        ? db.Set<CLIENTES>().Where(c => c.Cliente_ID == p.ClienteID.Value).Select(c => c.Razon_Social).FirstOrDefault()
                        : "";

                    return Ok(new
                    {
                        Proforma = new ProformaDto
                        {
                            Proforma_ID = p.Proforma_ID,
                            ClienteID = p.ClienteID,
                            ClienteRazon = cli ?? "",
                            FechaDesde = p.FechaDesde,
                            FechaHasta = p.FechaHasta,
                            ImporteTotal = p.ImporteTotal,
                            CantidadViajes = p.CantidadViajes,
                            FechaCreacion = p.FechaCreacion
                        },
                        Detalle = detalle
                    });
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // DELETE: api/Proformas/{id}
        [HttpDelete]
        [Route("api/Proformas/{id:int}")]
        public IHttpActionResult Eliminar(int id)
        {
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var p = db.Set<PROFORMAS>().Find(id);
                    if (p == null) return NotFound();

                    db.Set<PROFORMAS>().Remove(p);
                    db.Configuration.ValidateOnSaveEnabled = false;
                    db.SaveChanges();
                    return Ok(new { Message = "Proforma eliminada correctamente." });
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}