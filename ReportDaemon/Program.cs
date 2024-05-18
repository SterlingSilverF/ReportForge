using ReportDaemon;
using ReportManager.Models.SettingsModels;
using ReportManager.Services;
using Serilog;
using Serilog.Events;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.Hosting.Lifetime", LogEventLevel.Warning)
    .WriteTo.File("logs/ReportDaemon_log_.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

var builder = Host.CreateApplicationBuilder(args);
builder.Logging.ClearProviders();
builder.Logging.AddSerilog();

builder.Services.Configure<ConnectionSettings>(builder.Configuration.GetSection("ConnectionSettings"));
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JWTSettings"));
builder.Services.AddSingleton<ConnectionService>();
builder.Services.AddSingleton<AppDatabaseService>();
builder.Services.AddSingleton<GroupManagementService>();
builder.Services.AddSingleton<ReportManagementService>();
builder.Services.AddSingleton<FolderManagementService>();
builder.Services.AddSingleton<DatabaseService>();
builder.Services.AddSingleton<SharedService>();
builder.Services.AddSingleton<EmailService>();
builder.Services.AddTransient<Worker>();
builder.Services.AddAuthentication(Microsoft.AspNetCore.Authentication.Negotiate.NegotiateDefaults.AuthenticationScheme)
    .AddNegotiate();

var host = builder.Build();

using (var scope = host.Services.CreateScope())
{
    var worker = scope.ServiceProvider.GetRequiredService<Worker>();

    string taskType = "both";
    if (args.Length > 0)
    {
        taskType = args[0].ToLower();
    }

    await worker.TriggerWorker(taskType, CancellationToken.None);
}

await host.RunAsync();