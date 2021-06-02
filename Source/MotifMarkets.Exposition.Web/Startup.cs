// Copyright (c) 2021 - Paritech Wealth Technology Pty Ltd
// This source code is available at https://github.com/motifmarkets under the MIT license agreement stated in LICENSE.txt
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Reflection;
using IdentityModel.AspNetCore.AccessTokenManagement;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using MotifMarkets.Exposition.Web.Configuration;
using MotifMarkets.Exposition.Web.Models;
using MotifMarkets.Exposition.Web.Services;
using Serilog;

namespace MotifMarkets.Exposition.Web
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.Configure<ForwardedHeadersOptions>(options =>
            {
                // This is required for HTTPS redirect to work correctly through load balancers
                options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            });

            services.AddHttpsRedirection(options =>
            {
                options.HttpsPort = 443;
            });

            services.Configure<CookiePolicyOptions>(options =>
            {
                // This lambda determines whether user consent for non-essential cookies is needed for a given request.
                options.CheckConsentNeeded = context => true;
            });

            JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

            services.AddHttpContextAccessor();
            services.AddSingleton<IActionContextAccessor, ActionContextAccessor>();

            // Settings
            var siteSection = Configuration.GetSection("Site");
            var siteSettings = siteSection.Get<SiteSettings>() ?? new SiteSettings();
            services.AddSingleton(siteSettings);

            var clientTokenIssueSection = Configuration.GetSection("UserTokenIssue");
            var clientTokenIssueSettings = clientTokenIssueSection.Get<UserTokenIssueSettings>() ?? new UserTokenIssueSettings();
            services.AddSingleton(clientTokenIssueSettings);

            services.AddHttpClient("UserHTTP").AddHttpMessageHandler<UserAccessTokenHandler>();
            services.AddHttpClient();

            // This should be a persistent store. For testing purposes, the data will be saved to an ephemeral target.
            services.AddSingleton<ISettingsService, SettingsService>();

            services
                .AddAccessTokenManagement(options =>
                {
                    options.User.RefreshBeforeExpiration = TimeSpan.FromSeconds(15);
                })
                .ConfigureBackchannelHttpClient(client =>
                {
                    client.Timeout = TimeSpan.FromSeconds(10);
                });

            services
                .AddAuthentication(options =>
                {
                    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = "oidc";
                })
                .AddCookie(CookieAuthenticationDefaults.AuthenticationScheme)
                .AddOpenIdConnect("oidc", options =>
                {
                    options.Authority = clientTokenIssueSettings.TokenServiceUrl;
                    options.RequireHttpsMetadata = true;
                    options.ClientId = clientTokenIssueSettings.ClientId;
                    options.SaveTokens = true;
                    options.GetClaimsFromUserInfoEndpoint = true;
                    options.ResponseType = "code id_token";
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        NameClaimType = "name",
                        RoleClaimType = "role"
                    };

                    options.Scope.Add("roles");
                    options.Scope.Add("offline_access");
                    foreach (var scope in clientTokenIssueSettings.Scopes)
                    {
                        options.Scope.Add(scope);
                    }
                    options.ClaimActions.MapJsonKey("role", "role", "role");
                });

            services.AddSingleton(new VersionModel() { Version = Assembly.GetExecutingAssembly().GetName().Version.ToString(3) });

            services.AddControllers();
            services.AddRazorPages().AddRazorRuntimeCompilation();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            app.UseForwardedHeaders();

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseSerilogRequestLogging();

            app.UseAuthentication();
            app.UseHttpsRedirection();
            app.UseDefaultFiles();
            app.UseStaticFiles();
            app.UseCookiePolicy();

            app.UseRouting();
            app.UseAuthorization();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                endpoints.MapRazorPages();
            });
        }
    }
}
