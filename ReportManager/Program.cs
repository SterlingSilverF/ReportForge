using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Server.IISIntegration;
using ReportManager.Services;
using ReportManager.API;
using Serilog;
using Serilog.Events;
using FluentValidation.AspNetCore;
using ReportManager.Models.SettingsModels;
using System.Configuration;
using System.Text.Json;

var loggerConfiguration = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/reportforgelog.txt", rollingInterval: RollingInterval.Day);

Log.Logger = loggerConfiguration.CreateLogger();

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog();

// SERVICES
builder.Services.AddControllersWithViews().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.WithOrigins("https://reportforgedemo.com")
               .AllowAnyHeader()
               .AllowAnyMethod();
    });
});

builder.Services.Configure<ConnectionSettings>(builder.Configuration.GetSection("ConnectionSettings"));
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JWTSettings"));
builder.Services.AddSingleton<ConnectionService>();
builder.Services.AddScoped<AppDatabaseService>();
builder.Services.AddScoped<SharedService>();
builder.Services.AddScoped<FolderManagementService>();
builder.Services.AddScoped<ReportManagementService>();
builder.Services.AddScoped<UserManagementService>();
builder.Services.AddScoped<GroupManagementService>();
builder.Services.AddScoped<DatabaseService>();
//builder.Services.AddAuthentication(Microsoft.AspNetCore.Authentication.Negotiate.NegotiateDefaults.AuthenticationScheme)
//    .AddNegotiate();

var app = builder.Build();
Log.Information("Application Starting");

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller}/{action=Index}/{id?}");

app.MapFallbackToFile("index.html");
app.Run();

// When app.Run is finished, this will be called
Log.Information("Application is shutting down");
Log.CloseAndFlush();