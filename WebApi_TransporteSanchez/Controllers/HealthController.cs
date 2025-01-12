using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using System.Data.SqlClient;
using System.Web.Mvc;
using ControllerBase = Microsoft.AspNetCore.Mvc.ControllerBase;
using HttpGetAttribute = Microsoft.AspNetCore.Mvc.HttpGetAttribute;
using RouteAttribute = Microsoft.AspNetCore.Mvc.RouteAttribute;


namespace WebApi_TransporteSanchez.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HealthController : ControllerBase
    {
        private readonly string _connectionString;

        public HealthController()
        {
            // Utiliza la conexión dinámica
            _connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");
        }

        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    if (connection.State == System.Data.ConnectionState.Open)
                    {
                        return Ok(new { status = "Conexion DB Ok" });
                    }
                    else
                    {
                        return StatusCode(500, new { status = "Conexion DB Fallida" });
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = "Error en la conexion DB", error = ex.Message });
            }
        }
    }
}