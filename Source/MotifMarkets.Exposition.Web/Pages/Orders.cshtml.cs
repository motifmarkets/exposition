// Copyright (c) 2021 - Paritech Wealth Technology Pty Ltd
// This source code is available at https://github.com/motifmarkets under the MIT license agreement stated in LICENSE.txt
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Logging;
using MotifMarkets.Exposition.Web.Configuration;
using MotifMarkets.Exposition.Web.Models;

namespace MotifMarkets.Exposition.Web.Pages
{
    [Authorize]
    [RequireHttps]
    public class OrdersModel : PageModel
    {
        private readonly ILogger journalLogger;
        private readonly IActionContextAccessor actionContextAccessor;
        private readonly SiteSettings siteSettings;

        public OrdersModel(ILogger<OrdersModel> logger, IActionContextAccessor accessor, SiteSettings siteConfig)
        {
            journalLogger = logger;
            actionContextAccessor = accessor;
            siteSettings = siteConfig;
        }

        [BindProperty]
        public string UniqueUserId { get; set; }

        [BindProperty]
        public string IQEndpoint { get; set; }

        [BindProperty]
        public bool ShowNewOrder { get; set; }

        [BindProperty]
        public NewOrderModel NewOrderDetails { get; set; }

        public IActionResult OnGet()
        {
            SetCommonSettings();
            ShowNewOrder = false;
            NewOrderDetails = null;
            return Page();
        }

        public IActionResult OnPost(NewOrderModel model)
        {
            SetCommonSettings();
            if (model != null)
            {
                ShowNewOrder = true;
                NewOrderDetails = model;
                journalLogger.LogInformation($"Call for new order: {model.Side} {model.Account ?? "Unspecified-Account"} {model.Symbol} {model.SymbolName}");
            }
            return Page();
        }

        private void SetCommonSettings()
        {
            UniqueUserId = actionContextAccessor.ActionContext.HttpContext.User.GetCurrentIdentityId();
            IQEndpoint = siteSettings.IqUrl;
        }
    }
}