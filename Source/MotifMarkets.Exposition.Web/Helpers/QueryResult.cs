// Copyright (c) 2021 - Paritech Wealth Technology Pty Ltd
// This source code is available at https://github.com/motifmarkets under the MIT license agreement stated in LICENSE.txt
namespace MotifMarkets.Exposition.Web
{
    public class QueryResult
    {
        public bool Successful { get; set; }
        public string Reason { get; set; } = "";

        public virtual QueryResult<TNew> Cast<TNew>() where TNew : class
        {
            QueryResult<TNew> result = new QueryResult<TNew>();
            result.Successful = Successful;
            result.Reason = Reason;
            return result;
        }
    }

    public class QueryResult<T> : QueryResult
    {
        public T Data { get; set; }

        override public QueryResult<TNew> Cast<TNew>()
        {
            QueryResult<TNew> result = new QueryResult<TNew>();
            result.Successful = Successful;
            result.Reason = Reason;
            if (typeof(T) == typeof(TNew)) result.Data = Data as TNew;
            return result;
        }

        public QueryResult Cast()
        {
            QueryResult result = new QueryResult();
            result.Successful = Successful;
            result.Reason = Reason;
            return result;
        }
    }
}
