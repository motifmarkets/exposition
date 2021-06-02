// Copyright (c) 2021 - Paritech Wealth Technology Pty Ltd
// This source code is available at https://github.com/motifmarkets under the MIT license agreement stated in LICENSE.txt
namespace MotifMarkets.Exposition.Web.Models
{
    public class NewOrderModel
    {
        public string Side { get; set; }
        public string Symbol { get; set; }
        public string SymbolName { get; set; }
        public string Account { get; set; }
    }
}
