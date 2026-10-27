using System;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Globalization;
using System.Linq;

namespace WebApi_TransporteSanchez.Tarifas
{
    // Importe de un viaje (24/10/2026). Un solo cálculo para Gestionar viajes, presupuestos, el guardado del viaje y la
    // tabla de tarifas.
    //
    // Tabla de tarifas por tipo de camión ("Tarifas a agosto 2026", database/tarifas/02 y 03; en el código, "tarifario"):
    // el precio sale del tipo de camión, del año del modelo (antes o desde el año de corte) y de los km de ida, de una de
    // dos formas (decisión de Rocío con Claudia, 24/10):
    //   - Tarifa fija: el precio por viaje de la banda (hasta Km_Banda1 con 1ª o 2ª vuelta, hasta Km_Banda2, hasta
    //     Km_Banda3). Más de Km_Banda3: la fija de Km_Banda3 más los km que pasan × el precio por km.
    //   - Tarifa por km: todo el viaje × el precio por km.
    // La 1ª o 2ª vuelta no se calcula acá: la decide OrdenDelDia (§43), con el primer viaje del día del mismo cliente y
    // recorrido.
    // Más dos adicionales: falso flete (un % del viaje) y módulos de estadía. Cada banda va de más del mínimo hasta el
    // máximo inclusive, como las tarifas por km de antes.
    //
    // Cada tabla es general (para todos los clientes) o propia de algunos clientes (TARIFARIO_CLIENTES). Para un viaje
    // vale la propia de su cliente vigente en el inicio; si no tiene, la general (Vigente).
    //
    // El viaje guarda el importe (Importe_Base, Importe y sus detalles): cambiar después una tarifa no cambia los viajes ya
    // calculados (§33 de PENDIENTES). Los adicionales se aplican sobre cualquier tarifa, con el tarifario vigente.
    public static class TarifarioCalculo
    {
        public static readonly string[] TiposVehiculo = { "Furgón", "Balancín (3 ejes)", "Chasis (2 ejes)", "Liviano" };

        public const int MaxEstadiaModulos = 99;

        private static readonly CultureInfo EsAr = new CultureInfo("es-AR");

        public class Tarifario
        {
            public int Tarifario_ID { get; set; }
            public string Nombre { get; set; }
            public DateTime Vigente_Desde { get; set; }
            public bool Para_Todos { get; set; }
            public int Anio_Corte { get; set; }
            public int Km_Banda1 { get; set; }
            public int Km_Banda2 { get; set; }
            public int Km_Banda3 { get; set; }
            public decimal Estadia_Modulo { get; set; }
            public int Estadia_Horas_Modulo { get; set; }
            public int Estadia_Desde_Horas { get; set; }
            public int Estadia_Desde_Horas_Larga { get; set; }
            public decimal Falso_Flete_Porcentaje { get; set; }
        }

        public class Valores
        {
            public int Tarifario_ID { get; set; }
            public bool Modelo_Nuevo { get; set; }
            public string Tipo_Vehiculo { get; set; }
            public decimal Valor_Banda1_Vuelta1 { get; set; }
            public decimal Valor_Banda1_Vuelta2 { get; set; }
            public decimal Valor_Banda2 { get; set; }
            public decimal Valor_Banda3 { get; set; }
            public decimal Valor_Km { get; set; }
        }

        private class CamionTarifa
        {
            public string Dominio { get; set; }
            public string Tipo { get; set; }
            public int AñoModelo { get; set; }
        }

        // Lo que define la tarifa del viaje con la tabla de tarifas: fija o por km, cliente, camión, km, inicio y vuelta.
        public class Pedido
        {
            public int ViajeId { get; set; }            // 0 en un viaje nuevo
            public int ClienteID { get; set; }          // define si vale una tabla propia del cliente o la general
            public bool UsaTarifario { get; set; }      // false: el viaje no tiene tarifa
            public bool PorKm { get; set; }             // true = tarifa por km; false = tarifa fija
            public DateTime FechaInicio { get; set; }
            public int CamionID { get; set; }
            public decimal? Km { get; set; }
            public int? Vuelta { get; set; }
            public bool FalsoFlete { get; set; }
            public int EstadiaModulos { get; set; }
        }

        public class Resultado
        {
            public bool Ok { get; set; }
            public string Mensaje { get; set; }            // por qué no se pudo calcular (para la pantalla)

            public int? TarifarioID { get; set; }           // el tarifario usado (también para los adicionales)
            public string Tarifario { get; set; }
            public string TipoVehiculo { get; set; }
            public bool? ModeloNuevo { get; set; }
            public string Banda { get; set; }               // "hasta 130 km", "más de 250 km"…
            public bool AplicaVuelta { get; set; }          // fija hasta Km_Banda1: hay 1ª y 2ª vuelta
            public int? Vuelta { get; set; }

            public decimal ImporteBase { get; set; }
            public string TarifaDetalle { get; set; }       // de dónde sale la base, sin el importe
            public decimal FalsoFlete { get; set; }         // descuento: base × (1 − %); 0 sin falso flete
            public decimal? FalsoFletePorcentaje { get; set; }
            public decimal Estadia { get; set; }
            public decimal? EstadiaModulo { get; set; }
            public decimal Importe { get; set; }
            public string ImporteDetalle { get; set; }
        }

        private static SqlParameter P(string n, object v) { return new SqlParameter(n, v ?? DBNull.Value); }

        public static string Pesos(decimal v) { return "$ " + v.ToString("N2", EsAr); }
        public static string Km(decimal v) { return v.ToString("0.#", EsAr); }

        public static decimal Redondear(decimal v) { return decimal.Round(v, 2, MidpointRounding.AwayFromZero); }

        public static bool TipoValido(string tipo) { return TiposVehiculo.Contains((tipo ?? "").Trim()); }

        public static string Antiguedad(Tarifario t, bool modeloNuevo)
        {
            return "modelo " + Modelos(t, modeloNuevo);
        }

        // "2019 en adelante" o "2018 o anterior".
        public static string Modelos(Tarifario t, bool modeloNuevo)
        {
            return modeloNuevo ? t.Anio_Corte + " en adelante" : (t.Anio_Corte - 1) + " o anterior";
        }

        private const string COLUMNAS_TARIFARIO =
            "t.Tarifario_ID, t.Nombre, t.Vigente_Desde, t.Para_Todos, t.Anio_Corte, t.Km_Banda1, t.Km_Banda2, t.Km_Banda3, t.Estadia_Modulo, " +
            "t.Estadia_Horas_Modulo, t.Estadia_Desde_Horas, t.Estadia_Desde_Horas_Larga, t.Falso_Flete_Porcentaje ";

        // La tabla que vale el día del inicio del viaje para ese cliente: su tabla propia más reciente hasta ese día y, si
        // no tiene, la general más reciente. Sin cliente (clienteId = 0), la general.
        public static Tarifario Vigente(DbContext db, DateTime fecha, int clienteId = 0)
        {
            return db.Database.SqlQuery<Tarifario>(
                "SELECT TOP (1) " + COLUMNAS_TARIFARIO + "FROM dbo.TARIFARIOS t " +
                "WHERE t.Vigente_Desde <= @f AND (t.Para_Todos = 1 OR EXISTS (SELECT 1 FROM dbo.TARIFARIO_CLIENTES tc " +
                "WHERE tc.Tarifario_ID = t.Tarifario_ID AND tc.ClienteID = @c)) " +
                "ORDER BY t.Para_Todos, t.Vigente_Desde DESC", P("@f", fecha.Date), P("@c", clienteId)).FirstOrDefault();
        }

        // Tarifa sin adicionales.
        public static Resultado CalcularBase(DbContext db, Pedido p)
        {
            var r = new Resultado();

            if (p.ViajeId > 0)
            {
                // Viaje generado desde un presupuesto aceptado: vale el importe que aceptó el cliente.
                var presupuesto = db.Database.SqlQuery<PresupuestoRow>(
                    "SELECT TOP (1) Presupuesto_ID, Datos FROM dbo.PRESUPUESTOS WHERE ViajeID=@id AND Estado='Aceptado' ORDER BY Presupuesto_ID DESC",
                    P("@id", p.ViajeId)).FirstOrDefault();
                if (presupuesto != null)
                {
                    decimal importe;
                    if (!ImportePresupuesto(presupuesto.Datos, out importe))
                        return Falla("El presupuesto #" + presupuesto.Presupuesto_ID + " del viaje no tiene un importe válido.");
                    r.Ok = true;
                    r.ImporteBase = importe;
                    r.TarifaDetalle = "Presupuesto #" + presupuesto.Presupuesto_ID;
                    return r;
                }
            }

            if (p.UsaTarifario)
                return CalcularTarifario(db, p);

            return Falla("Asigná una tarifa al viaje.");
        }

        private static Resultado CalcularTarifario(DbContext db, Pedido p)
        {
            var t = Vigente(db, p.FechaInicio, p.ClienteID);
            if (t == null)
                return Falla("No hay una tabla de tarifas vigente el " + p.FechaInicio.ToString("dd/MM/yyyy") + " para este cliente. Cargala en Gestionar tarifas.");

            if (p.CamionID <= 0) return Falla("Elegí el camión para calcular la tarifa.");
            var camion = db.Database.SqlQuery<CamionTarifa>(
                "SELECT RTRIM(ISNULL(Dominio,'')) AS Dominio, ISNULL(Tipo,'') AS Tipo, ISNULL(TRY_CAST(AñoModelo AS int), 0) AS AñoModelo FROM dbo.CAMIONES WHERE Camion_ID=@id",
                P("@id", p.CamionID)).FirstOrDefault();
            if (camion == null) return Falla("El camión elegido ya no existe.");
            if (!TipoValido(camion.Tipo))
                return Falla("El camión " + camion.Dominio + " no tiene un tipo de la tabla (Furgón, Balancín, Chasis o Liviano). Elegilo en Gestionar camiones.");

            if (!p.Km.HasValue || p.Km.Value <= 0) return Falla("Cargá la distancia para calcular la tarifa.");

            bool nuevo = camion.AñoModelo >= t.Anio_Corte;
            var v = db.Database.SqlQuery<Valores>(
                "SELECT Tarifario_ID, Modelo_Nuevo, Tipo_Vehiculo, Valor_Banda1_Vuelta1, Valor_Banda1_Vuelta2, Valor_Banda2, Valor_Banda3, Valor_Km " +
                "FROM dbo.TARIFARIO_VALORES WHERE Tarifario_ID=@t AND Modelo_Nuevo=@n AND Tipo_Vehiculo=@tipo",
                P("@t", t.Tarifario_ID), P("@n", nuevo), P("@tipo", camion.Tipo.Trim())).FirstOrDefault();
            if (v == null)
                return Falla("La tabla \"" + t.Nombre + "\" no tiene valores para " + camion.Tipo.Trim() + ", " + Antiguedad(t, nuevo) + ". Completala en Gestionar tarifas.");

            return BaseConTabla(t, v, camion.Tipo.Trim(), nuevo, p.PorKm, p.Km.Value, p.Vuelta);
        }

        // La base con una tabla y su fila de valores ya elegidas, sin leer la base de datos. La usan el cálculo de un viaje o
        // presupuesto (CalcularTarifario) y el recálculo al editar una tabla (TarifarioImpacto), para que den lo mismo.
        public static Resultado BaseConTabla(Tarifario t, Valores v, string tipo, bool nuevo, bool porKm, decimal km, int? vuelta)
        {
            var r = new Resultado
            {
                Ok = true,
                TarifarioID = t.Tarifario_ID,
                Tarifario = t.Nombre,
                TipoVehiculo = tipo,
                ModeloNuevo = nuevo
            };

            if (porKm)
            {
                r.Banda = "por km (" + Km(km) + " km × " + Pesos(v.Valor_Km) + ")";
                r.ImporteBase = Redondear(v.Valor_Km * km);
            }
            else if (km <= t.Km_Banda1)
            {
                int numero = vuelta == 2 ? 2 : 1;
                r.AplicaVuelta = true;
                r.Vuelta = numero;
                r.Banda = "fija hasta " + t.Km_Banda1 + " km, " + numero + "ª vuelta";
                r.ImporteBase = numero == 2 ? v.Valor_Banda1_Vuelta2 : v.Valor_Banda1_Vuelta1;
            }
            else if (km <= t.Km_Banda2)
            {
                r.Banda = "fija de más de " + t.Km_Banda1 + " y hasta " + t.Km_Banda2 + " km";
                r.ImporteBase = v.Valor_Banda2;
            }
            else if (km <= t.Km_Banda3)
            {
                r.Banda = "fija de más de " + t.Km_Banda2 + " y hasta " + t.Km_Banda3 + " km";
                r.ImporteBase = v.Valor_Banda3;
            }
            else
            {
                // La fija de la última banda y los km que pasan, al precio por km (como lo calcula la empresa).
                decimal excedente = km - t.Km_Banda3;
                r.Banda = "fija hasta " + t.Km_Banda3 + " km (" + Pesos(v.Valor_Banda3) + ") + " + Km(excedente) + " km × " + Pesos(v.Valor_Km);
                r.ImporteBase = v.Valor_Banda3 + Redondear(v.Valor_Km * excedente);
            }

            // "Tarifas a agosto 2026 · Furgón 2019 en adelante, fija hasta 130 km, 1ª vuelta" (M15 de la prueba en la VM del 25/10).
            r.TarifaDetalle = t.Nombre + " · " + tipo + " " + Modelos(t, nuevo) + ", " + r.Banda;
            return r;
        }

        // Suma los adicionales a una base ya calculada (la recién calculada o la que el viaje tenía guardada).
        public static Resultado Completar(DbContext db, Resultado r, Pedido p)
        {
            if (!r.Ok) return r;
            if (p.EstadiaModulos < 0 || p.EstadiaModulos > MaxEstadiaModulos)
                return Falla("Los módulos de estadía tienen que ser entre 0 y " + MaxEstadiaModulos + ".");

            Tarifario t = null;
            if (p.FalsoFlete || p.EstadiaModulos > 0)
            {
                t = Vigente(db, p.FechaInicio, p.ClienteID);
                if (t == null)
                    return Falla("No hay una tabla de tarifas vigente el " + p.FechaInicio.ToString("dd/MM/yyyy") + " para calcular el falso flete y la estadía. Cargala en Gestionar tarifas.");
            }
            return SumarAdicionales(r, t, p.FalsoFlete, p.EstadiaModulos);
        }

        // Falso flete y estadía con la tabla t (la vigente para el viaje; null si no tiene adicionales), sin leer la base.
        public static Resultado SumarAdicionales(Resultado r, Tarifario t, bool falsoFlete, int estadiaModulos)
        {
            r.FalsoFlete = 0;
            r.Estadia = 0;
            r.FalsoFletePorcentaje = null;
            r.EstadiaModulo = null;
            // "…, 1ª vuelta: $ 645.535,00 · falso flete (60 %): $ 387.321,00 · estadía (1 módulo): $ 96.577,00" (M15, 25/10).
            var detalle = r.TarifaDetalle + ": " + Pesos(r.ImporteBase);
            decimal importe = r.ImporteBase;

            if (t != null && falsoFlete)
            {
                decimal conFalso = Redondear(r.ImporteBase * t.Falso_Flete_Porcentaje / 100m);
                r.FalsoFletePorcentaje = t.Falso_Flete_Porcentaje;
                r.FalsoFlete = conFalso - r.ImporteBase;
                importe = conFalso;
                detalle += " · falso flete (" + t.Falso_Flete_Porcentaje.ToString("0.##", EsAr) + " %): " + Pesos(conFalso);
            }
            if (t != null && estadiaModulos > 0)
            {
                r.EstadiaModulo = t.Estadia_Modulo;
                r.Estadia = Redondear(t.Estadia_Modulo * estadiaModulos);
                importe += r.Estadia;
                detalle += " · estadía (" + estadiaModulos + (estadiaModulos == 1 ? " módulo" : " módulos") + "): " + Pesos(r.Estadia);
            }

            r.Importe = importe;
            r.ImporteDetalle = detalle.Length > 500 ? detalle.Substring(0, 500) : detalle;
            if (r.TarifaDetalle != null && r.TarifaDetalle.Length > 300) r.TarifaDetalle = r.TarifaDetalle.Substring(0, 300);
            return r;
        }

        public static Resultado Calcular(DbContext db, Pedido p)
        {
            return Completar(db, CalcularBase(db, p), p);
        }

        private class PresupuestoRow { public int Presupuesto_ID { get; set; } public string Datos { get; set; } }

        // Mismo criterio que ProformasController.ImporteViaje: "importe" del JSON del presupuesto, en formato invariante.
        private static bool ImportePresupuesto(string datos, out decimal importe)
        {
            importe = 0;
            try
            {
                var json = Newtonsoft.Json.Linq.JObject.Parse(datos ?? "");
                return decimal.TryParse((string)json["importe"], NumberStyles.Number, CultureInfo.InvariantCulture, out importe) && importe >= 0;
            }
            catch { return false; }
        }

        private static Resultado Falla(string mensaje) { return new Resultado { Ok = false, Mensaje = mensaje }; }
    }
}
