using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApi_TransporteSanchez
{
    public static class JwtConfig
    {
        public const string SecretKey = "7aqmj&/Sk)l)FOJUN3f5JHD98shkd7@!skd*+Hms78kL";
        public const string Issuer = "*";
        public const string Audience = "*";
        public const int ExpirationMinutes = 30;
    }
}