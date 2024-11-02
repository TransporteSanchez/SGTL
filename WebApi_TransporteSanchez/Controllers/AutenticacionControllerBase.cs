namespace WebApi_TransporteSanchez.Controllers
{
    public class AutenticacionControllerBase
    {
        private readonly YourDbContext _context = new YourDbContext();

        [HttpPost]
        [Route("api/login")]
        public IHttpActionResult Login([FromBody] UserLoginModel login)
        {
            // Validar el usuario en la base de datos
            var user = _context.Usuarios.FirstOrDefault(u => u.Email == login.Email);
            if (user == null || !VerifyPassword(login.Password, user.Contraseña))
                return Unauthorized();

            // Crear JWT
            var token = GenerateJwtToken(user);

            // Devolver el token
            return Ok(new { Token = token });
        }

        private string GenerateJwtToken(Usuario user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes("tu_clave_secreta_super_segura"); // Debe estar en un lugar seguro (appsettings)
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new Claim[]
                {
                new Claim(ClaimTypes.Name, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email)
                }),
                Expires = DateTime.UtcNow.AddHours(1), // Token expira en 1 hora
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        private bool VerifyPassword(string inputPassword, string storedPassword)
        {
            // Aquí debes implementar la lógica para verificar la contraseña, que puede incluir comparar con el hash (SHA-256)
            return inputPassword == storedPassword;
        }
    }
}