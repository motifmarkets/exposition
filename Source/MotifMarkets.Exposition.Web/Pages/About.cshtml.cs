// Copyright (c) 2021 - Paritech Wealth Technology Pty Ltd
// This source code is available at https://github.com/motifmarkets under the MIT license agreement stated in LICENSE.txt
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Logging;
using MotifMarkets.Exposition.Web.Configuration;

namespace MotifMarkets.Exposition.Web.Pages
{
    [RequireHttps]
    public class AboutModel : PageModel
    {
        private readonly ILogger journalLogger;
        private readonly IActionContextAccessor actionContextAccessor;
        private readonly SiteSettings siteSettings;

        public AboutModel(ILogger<AboutModel> logger, IActionContextAccessor accessor, SiteSettings siteConfig)
        {
            journalLogger = logger;
            actionContextAccessor = accessor;
            siteSettings = siteConfig;
        }

        public void OnGet()
        {

        }
    }
}