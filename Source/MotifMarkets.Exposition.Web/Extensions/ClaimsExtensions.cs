// Copyright (c) 2021 - Paritech Wealth Technology Pty Ltd
// This source code is available at https://github.com/motifmarkets under the MIT license agreement stated in LICENSE.txt
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;

namespace MotifMarkets.Exposition.Web
{
    internal static class ClaimsExtensions
    {
        public static string GetClaimValue(this ClaimsPrincipal currentPrincipal, string key)
        {
            var identity = currentPrincipal.Identity as ClaimsIdentity;
            if (identity == null)
                return null;

            var claim = currentPrincipal.Claims.FirstOrDefault(c => c.Type == key);
            return claim?.Value;
        }

        public static string GetCurrentUsername(this ClaimsPrincipal currentPrincipal)
        {
            return currentPrincipal.GetClaimValue("name");
        }

        public static string GetCurrentIdentityId(this ClaimsPrincipal currentPrincipal)
        {
            return currentPrincipal.GetClaimValue(JwtRegisteredClaimNames.Sub);
        }
    }
}
