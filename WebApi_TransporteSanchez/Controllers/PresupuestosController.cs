using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity.Core.EntityClient;
using System.Data.SqlClient;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Web.Http;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using WebApi_TransporteSanchez.Tarifas;
using WebApi_TransporteSanchez.Viajes;

namespace WebApi_TransporteSanchez.Controllers
{
    [RoutePrefix("api/Presupuestos")]
    public class PresupuestosController : ApiController
    {
        private static string Cn()
        {
            return new EntityConnectionStringBuilder(
                ConnectionStringHelper.GetConnectionString("SGTLEntities")).ProviderConnectionString;
        }

        [HttpGet, Route("")]
        public IHttpActionResult Listar()
        {
            var resultado = new JArray();
            using (var cn = new SqlConnection(Cn()))
            using (var cmd = new SqlCommand("SELECT Presupuesto_ID, Datos, Estado, ViajeID FROM dbo.PRESUPUESTOS ORDER BY Presupuesto_ID DESC", cn))
            {
                cn.Open();
                using (var lector = cmd.ExecuteReader())
                    while (lector.Read())
                    {
                        var item = JObject.Parse(lector.GetString(1));
                        item["id"] = lector.GetInt32(0);
                        item["estado"] = lector.GetString(2);
                        item["viajeId"] = lector.IsDBNull(3) ? (JToken)JValue.CreateNull() : new JValue(lector.GetInt32(3));
                        resultado.Add(item);
                    }
            }
            return Ok(resultado);
        }

        [HttpPost, Route("")]
        public IHttpActionResult Crear([FromBody] JObject datos) { return Guardar(0, datos); }

        [HttpPut, Route("{id:int}")]
        public IHttpActionResult Actualizar(int id, [FromBody] JObject datos) { return Guardar(id, datos); }

        [HttpDelete, Route("{id:int}")]
        public IHttpActionResult Eliminar(int id)
        {
            using (var cn = new SqlConnection(Cn()))
            using (var cmd = new SqlCommand("DELETE FROM dbo.PRESUPUESTOS WHERE Presupuesto_ID=@id AND ViajeID IS NULL", cn))
            using (var db = new System.Data.Entity.DbContext(Cn()))
            {
                cmd.Parameters.Add("@id", SqlDbType.Int).Value = id;
                cn.Open();
                // Si estaba aceptado, libera su lugar en el día (§43): los otros viajes de su grupo se acomodan.
                string causa;
                var plan = PlanAlCambiar(db, id, EstadoActual(cn, id), "Eliminado", out causa);
                if (cmd.ExecuteNonQuery() == 0) return Content(HttpStatusCode.Conflict, new { error = "No se puede eliminar el presupuesto: no existe o ya tiene un viaje generado." });
                return Ok(new { Orden = AplicarOrden(db, plan, causa, null) });
            }
        }

        // ---------------------------------------------------------------- Precio por orden del día (§43, OrdenDelDia)
        // Un presupuesto aceptado que todavía no generó su viaje reserva su lugar en el día de su cliente y recorrido (1ª o 2ª
        // vuelta): al aceptarlo, los viajes de ese día que no salieron se acomodan y los demás quedan para revisar; al
        // rechazarlo, volverlo a Pendiente o eliminarlo, lo libera. El cálculo es el de viajes (Tarifas/OrdenDelDia.cs).

        private static string EstadoActual(SqlConnection cn, int id)
        {
            using (var cmd = new SqlCommand("SELECT Estado FROM dbo.PRESUPUESTOS WHERE Presupuesto_ID=@id AND ViajeID IS NULL", cn))
            {
                cmd.Parameters.AddWithValue("@id", id);
                return cmd.ExecuteScalar() as string;
            }
        }

        private static OrdenDelDia.Plan PlanAlCambiar(System.Data.Entity.DbContext db, int id, string estadoActual, string estadoNuevo, out string causa)
        {
            causa = null;
            bool eraAceptado = estadoActual == "Aceptado", quedaAceptado = estadoNuevo == "Aceptado";
            if (estadoActual == null || eraAceptado == quedaAceptado) return null;
            var sujeto = OrdenDelDia.SujetoDePresupuesto(db, id);
            if (sujeto == null || !sujeto.Aplica) return null;
            if (quedaAceptado)
            {
                causa = "se aceptó el presupuesto #" + id;
                sujeto.Estado = "Aceptado";
                return OrdenDelDia.Planificar(db, sujeto, null, causa);
            }
            causa = estadoNuevo == "Pendiente" ? "el presupuesto #" + id + " volvió a Pendiente"
                : estadoNuevo == "Eliminado" ? "se eliminó el presupuesto #" + id : "se rechazó el presupuesto #" + id;
            return OrdenDelDia.Planificar(db, null, sujeto, causa);
        }

        private static object AplicarOrden(System.Data.Entity.DbContext db, OrdenDelDia.Plan plan, string causa, string usuario)
        {
            if (plan == null || !plan.Cambios.Any()) return null;
            plan.Causa = causa;
            var hecho = OrdenDelDia.Aplicar(db, plan, usuario, ConnectionStringHelper.GetConnectionString("SGTLEntities"));
            return new
            {
                Actualizados = hecho.Actualizados.Select(c => new { c.Quien.Id, Importe = c.ImporteNuevo }).ToList(),
                ParaRevisar = hecho.ParaRevisar.Select(c => new { c.Quien.Clase, c.Quien.Id }).ToList()
            };
        }

        // El camión y el chofer del presupuesto ya tienen otro viaje (o presupuesto aceptado) en ese horario.
        private static List<Ocupacion.Error> Ocupado(System.Data.Entity.DbContext db, string datos, int id, int choferId)
        {
            JObject p;
            try { p = JObject.Parse(datos ?? ""); } catch { return new List<Ocupacion.Error>(); }
            int camion; DateTime inicio, fin;
            if (!int.TryParse((string)p["camionId"], out camion)) camion = 0;
            if (choferId <= 0 && !int.TryParse((string)p["choferId"], out choferId)) choferId = 0;
            if (!DateTime.TryParse((string)p["fechaInicio"], CultureInfo.InvariantCulture, DateTimeStyles.None, out inicio)
                || !DateTime.TryParse((string)p["fechaFin"], CultureInfo.InvariantCulture, DateTimeStyles.None, out fin)) return new List<Ocupacion.Error>();
            return Ocupacion.Errores(db, camion, choferId, inicio, fin, 0, id);
        }

        private static string Datos(SqlConnection cn, int id)
        {
            using (var cmd = new SqlCommand("SELECT Datos FROM dbo.PRESUPUESTOS WHERE Presupuesto_ID=@id", cn))
            {
                cmd.Parameters.AddWithValue("@id", id);
                return cmd.ExecuteScalar() as string;
            }
        }

        // GET api/Presupuestos/{id}/AlCambiarEstado?estado=X (o estado=Eliminado): qué pasa con los viajes del día al hacerlo,
        // para la confirmación, y si el camión o el chofer están ocupados (no se puede aceptar).
        [HttpGet, Route("{id:int}/AlCambiarEstado")]
        public IHttpActionResult AlCambiarEstado(int id, string estado)
        {
            try
            {
                using (var cn = new SqlConnection(Cn()))
                using (var db = new System.Data.Entity.DbContext(Cn()))
                {
                    cn.Open();
                    string actual = EstadoActual(cn, id), causa;
                    var plan = PlanAlCambiar(db, id, actual, estado, out causa);
                    var ocupado = estado == "Aceptado" && actual != "Aceptado" ? Ocupado(db, Datos(cn, id), id, 0) : new List<Ocupacion.Error>();
                    return Ok(new { Mensaje = plan == null ? "" : OrdenDelDia.QuePasa(plan), Errores = ocupado });
                }
            }
            catch { return Content(HttpStatusCode.InternalServerError, new { error = "No se pudo revisar el día del presupuesto." }); }
        }
        public class EstadoRequest { public string Estado { get; set; } }
        public class GenerarViajeRequest { public int ChoferID { get; set; } }

        [HttpPut, Route("{id:int}/estado")]
        public IHttpActionResult CambiarEstado(int id, [FromBody] EstadoRequest request)
        {
            if (request == null || (request.Estado != "Pendiente" && request.Estado != "Aceptado" && request.Estado != "Rechazado"))
                return BadRequest("Seleccioná un estado válido.");
            try
            {
                using (var cn = new SqlConnection(Cn()))
                using (var cmd = new SqlCommand("UPDATE dbo.PRESUPUESTOS SET Estado=@estado, FechaModificacion=GETDATE() WHERE Presupuesto_ID=@id AND ViajeID IS NULL", cn))
                using (var db = new System.Data.Entity.DbContext(Cn()))
                {
                    cn.Open(); var usuario = EnviosPresupuestosController.ValidarUsuario(Request, cn);
                    // Precio por orden del día (§43): aceptar reserva su lugar (si el camión o el chofer no están ocupados) y
                    // acomoda a los otros; dejar de estar aceptado lo libera.
                    string actual = EstadoActual(cn, id), causa;
                    if (request.Estado == "Aceptado" && actual != null && actual != "Aceptado")
                    {
                        var ocupado = Ocupado(db, Datos(cn, id), id, 0);
                        if (ocupado.Any())
                            return Content(HttpStatusCode.Conflict, new { error = "No se puede aceptar el presupuesto. " + string.Join(" ", ocupado.Select(e => e.ErrorMessage)) });
                    }
                    var plan = PlanAlCambiar(db, id, actual, request.Estado, out causa);
                    cmd.Parameters.AddWithValue("@estado", request.Estado); cmd.Parameters.AddWithValue("@id", id);
                    if (cmd.ExecuteNonQuery() == 0) return Content(HttpStatusCode.Conflict, new { error = "El presupuesto no existe o ya tiene un viaje generado." });
                    // Vuelto a Pendiente desde "Precio para revisar": se recalcula con la vuelta que le corresponde y queda para reenviar.
                    decimal? importeNuevo = request.Estado == "Pendiente" && actual == "Aceptado" ? OrdenDelDia.PresupuestoAPendiente(db, id, usuario) : null;
                    return Ok(new
                    {
                        Estado = request.Estado,
                        Orden = AplicarOrden(db, plan, causa, usuario),
                        Message = importeNuevo.HasValue
                            ? "Presupuesto #" + id + " en Pendiente, con el precio actualizado a " + OrdenDelDia.Pesos(importeNuevo) + ". Es necesario que se lo envíes de nuevo al cliente."
                            : null
                    });
                }
            }
            catch (EnviosPresupuestosController.AccesoException ex) { return Content(ex.Codigo, new { error = ex.Message }); }
            catch { return Content(HttpStatusCode.InternalServerError, new { error = "No se pudo actualizar el estado del presupuesto." }); }
        }

        [HttpPost, Route("{id:int}/viaje")]
        public IHttpActionResult GenerarViaje(int id, [FromBody] GenerarViajeRequest request)
        {
            if (request == null || request.ChoferID <= 0) return BadRequest("Seleccioná un chofer para generar el viaje.");
            try
            {
                using (var cn = new SqlConnection(Cn()))
                {
                    cn.Open(); var usuario = EnviosPresupuestosController.ValidarUsuario(Request, cn);
                    // Antes de la transacción (§43): si el precio quedó para revisar por el orden del día, primero se revisa; y el
                    // camión y el chofer no pueden estar ocupados en ese horario.
                    using (var db = new System.Data.Entity.DbContext(Cn()))
                    {
                        if (db.Database.SqlQuery<int>(
                            "SELECT CASE WHEN COL_LENGTH(N'dbo.TARIFARIO_REVISAR', N'Vuelta_Nueva') IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.TARIFARIO_REVISAR r " +
                            "JOIN dbo.TARIFARIO_CAMBIOS c ON c.Cambio_ID = r.Cambio_ID WHERE c.Tipo = N'Orden del día' AND r.Presupuesto_ID = @id " +
                            "AND r.Resuelto_Fecha IS NULL AND r.Tipo = N'Presupuesto' AND r.Vuelta_Nueva IS NOT NULL) THEN 1 ELSE 0 END",
                            new SqlParameter("@id", id)).First() == 1)
                            return Content(HttpStatusCode.Conflict, new { error = "No se puede generar el viaje: el precio del presupuesto está para revisar." });
                        var ocupado = Ocupado(db, Datos(cn, id), id, request.ChoferID);
                        if (ocupado.Any()) return Content(HttpStatusCode.BadRequest, ocupado);
                    }
                    using (var tx = cn.BeginTransaction(IsolationLevel.Serializable))
                    {
                        string json, estado; int? existente;
                        using (var leer = new SqlCommand("SELECT Datos, Estado, ViajeID FROM dbo.PRESUPUESTOS WITH (UPDLOCK,HOLDLOCK) WHERE Presupuesto_ID=@id", cn, tx))
                        {
                            leer.Parameters.AddWithValue("@id", id);
                            using (var r = leer.ExecuteReader()) { if (!r.Read()) return NotFound(); json = r.GetString(0); estado = r.GetString(1); existente = r.IsDBNull(2) ? (int?)null : r.GetInt32(2); }
                        }
                        if (existente.HasValue) return Content(HttpStatusCode.Conflict, new { error = "Este presupuesto ya generó el viaje #" + existente.Value + "." });
                        if (estado != "Aceptado") return Content(HttpStatusCode.Conflict, new { error = "El presupuesto debe estar aceptado para generar un viaje." });
                        var p = JObject.Parse(json); int cliente, origen, destino, camion, tarifario, vuelta; decimal km, importe; DateTime inicio, fin;
                        string tipo = (string)p["tipoTarifa"];
                        // El presupuesto se calcula con la tabla de tarifas (tarifarioId, fija o por km, y la vuelta).
                        bool conTabla = int.TryParse((string)p["tarifarioId"], out tarifario) && tarifario > 0;
                        int? vueltaViaje = int.TryParse((string)p["vuelta"], out vuelta) && (vuelta == 1 || vuelta == 2) ? vuelta : (int?)null;
                        if (!int.TryParse((string)p["clienteId"], out cliente) || cliente <= 0 || !int.TryParse((string)p["origenId"], out origen) || origen <= 0 || !int.TryParse((string)p["destinoId"], out destino) || destino <= 0 || !int.TryParse((string)p["camionId"], out camion) || camion <= 0 || !conTabla || (tipo != "km" && tipo != "fija") || !decimal.TryParse((string)p["importe"], NumberStyles.Number, CultureInfo.InvariantCulture, out importe) || importe < 0 || !decimal.TryParse((string)p["distancia"], NumberStyles.Number, CultureInfo.InvariantCulture, out km) || km <= 0 || !DateTime.TryParse((string)p["fechaInicio"], CultureInfo.InvariantCulture, DateTimeStyles.None, out inicio) || !DateTime.TryParse((string)p["fechaFin"], CultureInfo.InvariantCulture, DateTimeStyles.None, out fin) || fin < inicio)
                            return BadRequest("El presupuesto no tiene todos los datos necesarios para crear el viaje. Volvé a Pendiente y completalos.");
                        using (var validar = new SqlCommand(@"SELECT CASE WHEN EXISTS (SELECT 1 FROM dbo.ORIGEN WHERE Origen_ID=@origen AND ClienteID=@cliente)
 AND EXISTS (SELECT 1 FROM dbo.DESTINO WHERE Destino_ID=@destino AND ClienteID=@cliente)
 AND EXISTS (SELECT 1 FROM dbo.CAMIONES WHERE Camion_ID=@camion)
 AND EXISTS (SELECT 1 FROM dbo.CHOFERES WHERE Chofer_ID=@chofer AND EstadoChofer='Activo')
 AND EXISTS (SELECT 1 FROM dbo.TARIFARIOS WHERE Tarifario_ID=@tarifario) THEN 1 ELSE 0 END", cn, tx))
                        {
                            validar.Parameters.AddWithValue("@origen", origen); validar.Parameters.AddWithValue("@destino", destino); validar.Parameters.AddWithValue("@cliente", cliente); validar.Parameters.AddWithValue("@camion", camion); validar.Parameters.AddWithValue("@chofer", request.ChoferID); validar.Parameters.AddWithValue("@tarifario", tarifario);
                            if (Convert.ToInt32(validar.ExecuteScalar()) != 1) return BadRequest("Revisá el chofer activo y los datos de cliente, ruta, camión y tarifa del presupuesto.");
                        }
                        int viajeId;
                        // El viaje guarda el importe del presupuesto (database/tarifas/02_*.sql): es el que aceptó el cliente.
                        using (var crear = new SqlCommand(@"INSERT dbo.VIAJES (OrigenID,DestinoID,Distancia_KM,Num_Remito,Num_de_Carga,Fecha_Inicio,Fecha_Fin,ChoferID,CamionID,ClienteID,Fecha_Alta,Usu_Alta,Fecha_Modi,Usu_Modi,TarifarioID,Tarifa_Modo,Vuelta,Importe_Base,Tarifa_Detalle,Importe,Importe_Detalle)
OUTPUT INSERTED.Viaje_ID VALUES (@origen,@destino,@km,'','',@inicio,@fin,@chofer,@camion,@cliente,GETDATE(),@usuario,GETDATE(),@usuario,@tarifario,@modo,@vuelta,@importe,@detalle,@importe,@detalleImporte)", cn, tx))
                        {
                            crear.Parameters.AddWithValue("@origen", origen); crear.Parameters.AddWithValue("@destino", destino); crear.Parameters.AddWithValue("@km", km.ToString(CultureInfo.InvariantCulture)); crear.Parameters.AddWithValue("@inicio", inicio); crear.Parameters.AddWithValue("@fin", fin); crear.Parameters.AddWithValue("@chofer", request.ChoferID); crear.Parameters.AddWithValue("@camion", camion); crear.Parameters.AddWithValue("@tarifario", tarifario); crear.Parameters.AddWithValue("@modo", tipo == "km" ? "Km" : "Fija");
                            crear.Parameters.AddWithValue("@vuelta", tipo == "fija" && vueltaViaje.HasValue ? (object)vueltaViaje.Value : DBNull.Value);
                            crear.Parameters.AddWithValue("@importe", importe); crear.Parameters.AddWithValue("@detalle", "Presupuesto #" + id);
                            crear.Parameters.AddWithValue("@detalleImporte", "Presupuesto #" + id + " · $ " + importe.ToString("N2", new CultureInfo("es-AR"))); crear.Parameters.AddWithValue("@cliente", cliente); crear.Parameters.AddWithValue("@usuario", usuario);
                            viajeId = Convert.ToInt32(crear.ExecuteScalar());
                        }
                        using (var vincular = new SqlCommand("UPDATE dbo.PRESUPUESTOS SET ViajeID=@viaje, FechaModificacion=GETDATE() WHERE Presupuesto_ID=@id", cn, tx)) { vincular.Parameters.AddWithValue("@viaje", viajeId); vincular.Parameters.AddWithValue("@id", id); vincular.ExecuteNonQuery(); }
                        tx.Commit(); return Ok(new { ViajeID = viajeId });
                    }
                }
            }
            catch (EnviosPresupuestosController.AccesoException ex) { return Content(ex.Codigo, new { error = ex.Message }); }
            catch { return Content(HttpStatusCode.InternalServerError, new { error = "No se pudo generar el viaje. Revisá los datos del presupuesto y volvé a intentar." }); }
        }

        private IHttpActionResult Guardar(int id, JObject datos)
        {
            if (datos == null || String.IsNullOrWhiteSpace((string)datos["cliente"]) ||
                String.IsNullOrWhiteSpace((string)datos["origen"]) || String.IsNullOrWhiteSpace((string)datos["destino"]))
                return BadRequest("Completá cliente, origen y destino.");
            decimal importe;
            if (!Decimal.TryParse((string)datos["importe"], System.Globalization.NumberStyles.Number,
                System.Globalization.CultureInfo.InvariantCulture, out importe) || importe < 0)
                return BadRequest("Ingresá un importe válido.");
            datos.Remove("id");
            datos.Remove("estado");
            datos.Remove("viajeId");
            using (var cn = new SqlConnection(Cn()))
            using (var cmd = new SqlCommand(id == 0
                ? "INSERT dbo.PRESUPUESTOS (Datos) OUTPUT INSERTED.Presupuesto_ID VALUES (@datos)"
                : "UPDATE dbo.PRESUPUESTOS SET Datos=@datos, FechaModificacion=GETDATE() WHERE Presupuesto_ID=@id AND Estado='Pendiente' AND ViajeID IS NULL; SELECT @@ROWCOUNT;", cn))
            {
                cmd.Parameters.Add("@datos", SqlDbType.NVarChar, -1).Value = datos.ToString(Formatting.None);
                if (id != 0) cmd.Parameters.Add("@id", SqlDbType.Int).Value = id;
                cn.Open();
                var resultado = Convert.ToInt32(cmd.ExecuteScalar());
                if (id != 0 && resultado == 0) return Content(HttpStatusCode.Conflict, new { error = "Solo se pueden editar presupuestos pendientes sin viaje generado." });
                return Ok(new { id = id == 0 ? resultado : id });
            }
        }
    }
}
