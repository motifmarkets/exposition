// Copyright (c) 2021 - Paritech Wealth Technology Pty Ltd
// This source code is available at https://github.com/motifmarkets under the MIT license agreement stated in LICENSE.txt
using System.Collections.Generic;

namespace MotifMarkets.Exposition.Web.Configuration
{
    internal class UserTokenIssueSettings
    {
        public string TokenServiceUrl { get; set; }
        public string ClientId { get; set; }
        public List<string> Scopes { get; set; }

        public string Scope
        {
            get
            {
                if (Scopes == null) return "";
                return string.Join(" ", Scopes);
            }
        }
    }
}
