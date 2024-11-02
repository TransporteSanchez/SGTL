using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApi_TransporteSanchez
{
    public static class JwtConfig
    {

      public const string SecretKey = "7aqmj&/Sk)l)FOJUN3f5"; // Cambia esto por una clave segura y larga.
      public const int ExpirationMinutes = 30; // Tiempo de expiración del token en minutos.

    }
}