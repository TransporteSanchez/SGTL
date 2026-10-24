using System;
using System.Data;
using System.Data.Entity.Core.EntityClient;
using System.Data.SqlClient;
using System.Globalization;
using System.Net;
using System.Web.Http;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

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
            {
                cmd.Parameters.Add("@id", SqlDbType.Int).Value = id;
                cn.Open();
                if (cmd.ExecuteNonQuery() == 0) return Content(HttpStatusCode.Conflict, new { error = "No se puede eliminar el presupuesto: no existe o ya tiene un viaje generado." });
                return Ok();
            }
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
                {
                    cn.Open(); EnviosPresupuestosController.ValidarUsuario(Request, cn);
                    cmd.Parameters.AddWithValue("@estado", request.Estado); cmd.Parameters.AddWithValue("@id", id);
                    if (cmd.ExecuteNonQuery() == 0) return Content(HttpStatusCode.Conflict, new { error = "El presupuesto no existe o ya tiene un viaje generado." });
                    return Ok(new { Estado = request.Estado });
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
                        var p = JObject.Parse(json); int cliente, origen, destino, camion, tarifa = 0, tarifario, vuelta; decimal km, importe; DateTime inicio, fin;
                        string tipo = (string)p["tipoTarifa"];
                        // Desde el 24/10 el presupuesto se calcula con la tabla de tarifas (tarifarioId, fija o por km, y la vuelta);
                        // los de antes traen tarifaId de una tarifa fija por recorrido o de una tarifa por km.
                        bool conTabla = int.TryParse((string)p["tarifarioId"], out tarifario) && tarifario > 0;
                        int? vueltaViaje = int.TryParse((string)p["vuelta"], out vuelta) && (vuelta == 1 || vuelta == 2) ? vuelta : (int?)null;
                        if (!int.TryParse((string)p["clienteId"], out cliente) || cliente <= 0 || !int.TryParse((string)p["origenId"], out origen) || origen <= 0 || !int.TryParse((string)p["destinoId"], out destino) || destino <= 0 || !int.TryParse((string)p["camionId"], out camion) || camion <= 0 || (!conTabla && (!int.TryParse((string)p["tarifaId"], out tarifa) || tarifa <= 0)) || (tipo != "km" && tipo != "fija") || !decimal.TryParse((string)p["importe"], NumberStyles.Number, CultureInfo.InvariantCulture, out importe) || importe < 0 || !decimal.TryParse((string)p["distancia"], NumberStyles.Number, CultureInfo.InvariantCulture, out km) || km <= 0 || !DateTime.TryParse((string)p["fechaInicio"], CultureInfo.InvariantCulture, DateTimeStyles.None, out inicio) || !DateTime.TryParse((string)p["fechaFin"], CultureInfo.InvariantCulture, DateTimeStyles.None, out fin) || fin < inicio)
                            return BadRequest("El presupuesto no tiene todos los datos necesarios para crear el viaje. Volvé a Pendiente y completalos.");
                        using (var validar = new SqlCommand(@"SELECT CASE WHEN EXISTS (SELECT 1 FROM dbo.ORIGEN WHERE Origen_ID=@origen AND ClienteID=@cliente)
 AND EXISTS (SELECT 1 FROM dbo.DESTINO WHERE Destino_ID=@destino AND ClienteID=@cliente)
 AND EXISTS (SELECT 1 FROM dbo.CAMIONES WHERE Camion_ID=@camion)
 AND EXISTS (SELECT 1 FROM dbo.CHOFERES WHERE Chofer_ID=@chofer AND EstadoChofer='Activo')
 AND ((@tarifario > 0 AND EXISTS (SELECT 1 FROM dbo.TARIFARIOS WHERE Tarifario_ID=@tarifario)) OR (@tarifario = 0 AND ((@tipo='km' AND EXISTS (SELECT 1 FROM dbo.TARIFAS_KM WHERE TarifaKm_ID=@tarifa)) OR (@tipo='fija' AND EXISTS (SELECT 1 FROM dbo.TARIFAS_FIJAS WHERE TarifaFija_ID=@tarifa AND ClienteID=@cliente AND OrigenID=@origen AND DestinoID=@destino))))) THEN 1 ELSE 0 END", cn, tx))
                        {
                            validar.Parameters.AddWithValue("@origen", origen); validar.Parameters.AddWithValue("@destino", destino); validar.Parameters.AddWithValue("@cliente", cliente); validar.Parameters.AddWithValue("@camion", camion); validar.Parameters.AddWithValue("@chofer", request.ChoferID); validar.Parameters.AddWithValue("@tipo", tipo); validar.Parameters.AddWithValue("@tarifa", tarifa); validar.Parameters.AddWithValue("@tarifario", conTabla ? tarifario : 0);
                            if (Convert.ToInt32(validar.ExecuteScalar()) != 1) return BadRequest("Revisá el chofer activo y los datos de cliente, ruta, camión y tarifa del presupuesto.");
                        }
                        int viajeId;
                        // El viaje guarda el importe del presupuesto (database/tarifas/02_*.sql): es el que aceptó el cliente.
                        using (var crear = new SqlCommand(@"INSERT dbo.VIAJES (OrigenID,DestinoID,Distancia_KM,Num_Remito,Num_de_Carga,Fecha_Inicio,Fecha_Fin,ChoferID,CamionID,TarifaFijaID,TarifaKmID,ClienteID,Fecha_Alta,Usu_Alta,Fecha_Modi,Usu_Modi,TarifarioID,Tarifa_Modo,Vuelta,Importe_Base,Tarifa_Detalle,Importe,Importe_Detalle)
OUTPUT INSERTED.Viaje_ID VALUES (@origen,@destino,@km,'','',@inicio,@fin,@chofer,@camion,@fija,@tarifakm,@cliente,GETDATE(),@usuario,GETDATE(),@usuario,@tarifario,@modo,@vuelta,@importe,@detalle,@importe,@detalleImporte)", cn, tx))
                        {
                            crear.Parameters.AddWithValue("@origen", origen); crear.Parameters.AddWithValue("@destino", destino); crear.Parameters.AddWithValue("@km", km.ToString(CultureInfo.InvariantCulture)); crear.Parameters.AddWithValue("@inicio", inicio); crear.Parameters.AddWithValue("@fin", fin); crear.Parameters.AddWithValue("@chofer", request.ChoferID); crear.Parameters.AddWithValue("@camion", camion); crear.Parameters.AddWithValue("@fija", !conTabla && tipo == "fija" ? (object)tarifa : DBNull.Value); crear.Parameters.AddWithValue("@tarifakm", !conTabla && tipo == "km" ? (object)tarifa : DBNull.Value);
                            crear.Parameters.AddWithValue("@tarifario", conTabla ? (object)tarifario : DBNull.Value); crear.Parameters.AddWithValue("@modo", conTabla ? (object)(tipo == "km" ? "Km" : "Fija") : DBNull.Value);
                            crear.Parameters.AddWithValue("@vuelta", conTabla && tipo == "fija" && vueltaViaje.HasValue ? (object)vueltaViaje.Value : DBNull.Value);
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
