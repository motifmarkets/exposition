// Copyright (c) 2021 - Paritech Wealth Technology Pty Ltd
// This source code is available at https://github.com/motifmarkets under the MIT license agreement stated in LICENSE.txt
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Logging;

namespace MotifMarkets.Exposition.Web.Pages.Access
{
    [Authorize]
    [RequireHttps]
    public class LogoutModel : PageModel
    {
        private readonly ILogger journalLogger;
        private readonly IHttpContextAccessor httpContext;

        public LogoutModel(ILogger<LogoutModel> logger, IHttpContextAccessor httpContextAccessor)
        {
            journalLogger = logger;
            httpContext = httpContextAccessor;
        }

        public async Task OnGet()
        {
            var username = User.GetCurrentUsername();
            journalLogger.LogInformation($"Logout \"{username}\".");

            await HttpContext.SignOutAsync("oidc", new AuthenticationProperties
            {
                // Indicate here where Exposition should redirect the user after a logout.
                RedirectUri = $"{this.Request.Scheme}://{this.Request.Host}"
            });
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        }
    }
}