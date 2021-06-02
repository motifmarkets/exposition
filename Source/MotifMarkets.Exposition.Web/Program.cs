// Copyright (c) 2021 - Paritech Wealth Technology Pty Ltd
// This source code is available at https://github.com/motifmarkets under the MIT license agreement stated in LICENSE.txt
using System;
using System.Reflection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Serilog;

namespace MotifMarkets.Exposition.Web
{
    public class Program
    {
        public static void Main(string[] args)
        {
            Log.Logger = new LoggerConfiguration()
                .WriteTo.Console()
                .CreateBootstrapLogger();

            var execAssembly = Assembly.GetExecutingAssembly().GetName();

            try
            {
                var host = CreateHostBuilder(args).Build();
                Log.Information($">>>> Website Starting (v{execAssembly.Version.ToString(3)}) <<<<<");
                host.Run();
            }
            catch (Exception e)
            {
                Log.Fatal(e, "An unhandled exception occured during bootstrapping");
            }
            finally
            {
                Log.Information($">>>> Website Finishing (v{execAssembly.Version.ToString(3)}) <<<<<");
                Log.CloseAndFlush();
            }
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .UseSerilog((context, services, configuration) => configuration
                    .ReadFrom.Configuration(context.Configuration)
                    .ReadFrom.Services(services)
                    .Enrich.FromLogContext()
                    .WriteTo.Console()
                )
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                });
    }
}
