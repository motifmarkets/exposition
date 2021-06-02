// Copyright (c) 2021 - Paritech Wealth Technology Pty Ltd
// This source code is available at https://github.com/motifmarkets under the MIT license agreement stated in LICENSE.txt
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Logging;

namespace MotifMarkets.Exposition.Web.Pages.Access
{
    [AllowAnonymous]
    [RequireHttps]
    public class LoginModel : PageModel
    {
        private readonly ILogger journalLogger;
        private readonly IHttpContextAccessor httpContext;

        public LoginModel(ILogger<LoginModel> logger, IHttpContextAccessor httpContextAccessor)
        {
            journalLogger = logger;
            httpContext = httpContextAccessor;
        }

        public async Task OnGet(string returnUrl = "/")
        {
            journalLogger.LogInformation("Issuing authentication challenge");
            await HttpContext.ChallengeAsync("oidc", new AuthenticationProperties() { RedirectUri = returnUrl });
        }
    }
}