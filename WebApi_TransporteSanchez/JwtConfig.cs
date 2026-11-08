using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Configuration;

namespace WebApi_TransporteSanchez
{
    public static class JwtConfig
    {
        public static readonly string SecretKey = ConfigurationManager.AppSettings["JwtClave"];
        public const string Issuer = "*";
        public const string Audience = "*";
        public const int ExpirationMinutes = 30;
    }
}