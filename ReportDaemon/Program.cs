using ReportDaemon;
using ReportManager.Models.SettingsModels;
using ReportManager.Services;
using Serilog;
using Serilog.Events;

Environment.SetEnvironmentVariable("DOTNET_ENVIRONMENT", "Production");

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.Hosting.Lifetime", LogEventLevel.Warning)
    .WriteTo.File("logs/ReportDaemon_log_.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

var configuration = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.ReportDaemon.json", optional: false, reloadOnChange: true)
    .AddEnvironmentVariables()
    .Build();

var builder = Host.CreateApplicationBuilder(args);
builder.Configuration.Sources.Clear();
builder.Configuration
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.ReportDaemon.json", optional: false, reloadOnChange: true)
    .AddEnvironmentVariables();
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