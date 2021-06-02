// Copyright (c) 2021 - Paritech Wealth Technology Pty Ltd
// This source code is available at https://github.com/motifmarkets under the MIT license agreement stated in LICENSE.txt
using System;

namespace MotifMarkets.Exposition.Web.Helpers
{
    class ResultsHelper
    {
        public static QueryResult CreateQueryResult(Exception e)
        {
            QueryResult result = new QueryResult() { Successful = (e == null) };
            if (!result.Successful)
            {
                result.Reason = e switch
                {
                    Exception ex when ex is OperationCanceledException => "Operation cancelled",
                    _ => $"{e.GetType().Name} Error: {e.Message}",
                };
            }
            return result;
        }

        public static QueryResult CreateQueryResultError(string errorText)
        {
            QueryResult result = new QueryResult() { Successful = false, Reason = errorText };
            return result;
        }

        public static QueryResult<T> CreateQueryResult<T>(T payload, Exception e)
        {
            QueryResult<T> result = new QueryResult<T>() { Data = payload, Successful = (e == null) };
            if (!result.Successful)
            {
                result.Reason = e switch
                {
                    Exception ex when ex is OperationCanceledException => "Operation cancelled",
                    _ => $"{e.GetType().Name} Error: {e.Message}",
                };
            }
            return result;
        }

        public static QueryResult<T> CreateQueryResultError<T>(string errorText)
        {
            QueryResult<T> result = new QueryResult<T>() { Successful = false, Data = default(T), Reason = errorText };
            return result;
        }
    }
}
