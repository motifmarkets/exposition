// Copyright (c) 2021 - Paritech Wealth Technology Pty Ltd
// This source code is available at https://github.com/motifmarkets under the MIT license agreement stated in LICENSE.txt
using System.Threading;
using System.Threading.Tasks;
using MotifMarkets.Exposition.Web.DTO;

namespace MotifMarkets.Exposition.Web.Services
{
    public interface ISettingsService
    {
        Task<QueryResult<string>> GetUserSetting(RecallSettingRequest request, CancellationToken cancelToken);
        Task<QueryResult> SetUserSetting(SaveSettingRequest request, CancellationToken cancelToken);
    }
}
