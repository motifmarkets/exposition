// Copyright (c) 2021 - Paritech Wealth Technology Pty Ltd
// This source code is available at https://github.com/motifmarkets under the MIT license agreement stated in LICENSE.txt
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Logging;
using MotifMarkets.Exposition.Web.Configuration;

namespace MotifMarkets.Exposition.Web.Pages
{
    [Authorize]
    [RequireHttps]
    public class HoldingsModel : PageModel
    {
        private readonly ILogger journalLogger;
        private readonly IActionContextAccessor actionContextAccessor;
        private readonly SiteSettings siteSettings;

        public HoldingsModel(ILogger<HoldingsModel> logger, IActionContextAccessor accessor, SiteSettings siteConfig)
        {
            journalLogger = logger;
            actionContextAccessor = accessor;
            siteSettings = siteConfig;
        }

        [BindProperty]
        public string UniqueUserId { get; set; }

        [BindProperty]
        public string IQEndpoint { get; set; }

        public void OnGet()
        {
            UniqueUserId = actionContextAccessor.ActionContext.HttpContext.User.GetCurrentIdentityId();
            IQEndpoint = siteSettings.IqUrl;

        }
    }
}