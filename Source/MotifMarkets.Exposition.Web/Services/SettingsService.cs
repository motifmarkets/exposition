// Copyright (c) 2021 - Paritech Wealth Technology Pty Ltd
// This source code is available at https://github.com/motifmarkets under the MIT license agreement stated in LICENSE.txt
using System;
using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.Extensions.Logging;
using MotifMarkets.Exposition.Web.DTO;

namespace MotifMarkets.Exposition.Web.Services
{
    public class SettingsService : ISettingsService
    {
        private readonly ILogger journalLogger;
        private readonly ConcurrentDictionary<string, string> settingsCache;

        public SettingsService(ILogger<SettingsService> logger)
        {
            journalLogger = logger;
            settingsCache = new ConcurrentDictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        }

        public async Task<QueryResult<string>> GetUserSetting(RecallSettingRequest request, CancellationToken cancelToken = default)
        {
            try
            {
                settingsCache.TryGetValue(request.Key, out string value);
                var response = new QueryResult<string>()
                {
                    Successful = true,
                    Data = value ?? ""
                };
                return await Task.FromResult(response);
            }
            catch (Exception e)
            {
                journalLogger.LogError(e, "SettingsService.GetUserSetting");
                var errorResponse = new QueryResult<string>()
                {
                    Successful = false,
                    Reason = $"Exception: {e.GetType()}"
                };
                return await Task.FromResult(errorResponse);
            }
        }

        public async Task<QueryResult> SetUserSetting(SaveSettingRequest request, CancellationToken cancelToken = default)
        {
            try
            {
                settingsCache.AddOrUpdate(request.Key, request.Value, (k, v) => request.Value);
                var response = new QueryResult<string>() { Successful = true };
                return await Task.FromResult(response);
            }
            catch (Exception e)
            {
                journalLogger.LogError(e, "SettingsService.SetUserSetting");
                var errorResponse = new QueryResult<string>()
                {
                    Successful = false,
                    Reason = $"Exception: {e.GetType()}"
                };
                return await Task.FromResult(errorResponse);
            }
        }
    }
}
