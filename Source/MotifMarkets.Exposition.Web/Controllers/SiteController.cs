// Copyright (c) 2021 - Paritech Wealth Technology Pty Ltd
// This source code is available at https://github.com/motifmarkets under the MIT license agreement stated in LICENSE.txt
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.Extensions.Logging;
using MotifMarkets.Exposition.Web.Configuration;
using MotifMarkets.Exposition.Web.DTO;
using MotifMarkets.Exposition.Web.Helpers;
using MotifMarkets.Exposition.Web.Models;
using MotifMarkets.Exposition.Web.Services;

namespace MotifMarkets.Exposition.Web.Controllers
{
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    [RequireHttps]
    public class SiteController : Controller
    {
        private readonly ILogger journalLogger;
        private readonly IActionContextAccessor actionContextAccessor;
        private readonly IHttpClientFactory httpClientFactory;
        private readonly SiteSettings siteSettings;
        private readonly ISettingsService settingsApi;
        private readonly VersionModel versionInfo;

        public SiteController(ILogger<SiteController> logger,
            IActionContextAccessor accessor,
            IHttpClientFactory clientFactory,
            SiteSettings siteConfig,
            ISettingsService settingsService,
            VersionModel versionModel)
        {
            journalLogger = logger;
            actionContextAccessor = accessor;
            httpClientFactory = clientFactory;
            siteSettings = siteConfig;
            settingsApi = settingsService;
            versionInfo = versionModel;
        }

        [HttpPost]
        [Route("ExecuteIQ")]
        public async Task<QueryResult<string>> ExecuteIQ([FromBody] IQRequest request)
        {
            try
            {
                journalLogger.LogDebug($"IQ: {request.Statement.Trim().Replace("\r\n", " ").Replace("\n", " ")}");

                var uriQuery = new Uri(new Uri(siteSettings.IqUrl), "query");
                var accessToken = await actionContextAccessor.ActionContext.HttpContext.GetUserAccessTokenAsync();

                var timeout = new CancellationTokenSource();
                timeout.CancelAfter(TimeSpan.FromSeconds(15));
                var http = httpClientFactory.CreateClient();

                http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                http.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("Exposition", versionInfo.Version));
                try
                {
                    var response = await http.PostAsync(uriQuery, new StringContent(request.Statement), timeout.Token);
                    if (response.IsSuccessStatusCode)
                    {
                        var reply = await response.Content.ReadAsStringAsync();
                        return ResultsHelper.CreateQueryResult(reply, null);
                    }
                    else
                    {
                        var body = await response.Content.ReadAsStringAsync();
                        var reason = $"Command failed: {response.StatusCode} {body}";
                        journalLogger.LogWarning($"IQRequest: {reason}");
                        return ResultsHelper.CreateQueryResult<string>(null, new Exception(reason));
                    }
                }
                catch (OperationCanceledException)
                {
                    var reason = "Command timed out without response";
                    journalLogger.LogWarning($"IQRequest: {reason}");
                    return ResultsHelper.CreateQueryResult<string>(null, new Exception(reason));
                }
                catch (Exception e)
                {
                    var reason = $"Command failed: {e} {e.Message}";
                    journalLogger.LogWarning($"IQRequest: {reason}");
                    return ResultsHelper.CreateQueryResult<string>(null, new Exception(reason));
                }
            }
            catch (Exception e)
            {
                journalLogger.LogError(e, "ExecuteIQ");
                return ResultsHelper.CreateQueryResult<string>(null, e);
            }
        }

        [HttpPost]
        [Route("GetSetting")]
        public async Task<QueryResult<string>> GetSetting(RecallSettingRequest request)
        {
            try
            {
                var qr = await settingsApi.GetUserSetting(request, actionContextAccessor.ActionContext.HttpContext.RequestAborted);
                return qr.Cast<string>();
            }
            catch (Exception e)
            {
                journalLogger.LogError(e, "GetSetting");
                return ResultsHelper.CreateQueryResult<string>(null, e);
            }
        }

        [HttpPost]
        [Route("SaveSetting")]
        public async Task<QueryResult> SaveSetting(SaveSettingRequest request)
        {
            try
            {
                journalLogger.LogDebug($"Save: {request.Key}={request.Value}");
                var qr = await settingsApi.SetUserSetting(request, actionContextAccessor.ActionContext.HttpContext.RequestAborted);
                return qr;
            }
            catch (Exception e)
            {
                journalLogger.LogError(e, "SaveSetting");
                return ResultsHelper.CreateQueryResult<string>(null, e);
            }
        }
    }
}
