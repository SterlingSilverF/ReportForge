using System;
using System.ServiceProcess;

namespace ReportDaemon
{
    internal static class Program
    {
        /// <summary>
        /// The main entry point for the application.
        /// </summary>
        static void Main()
        {
            ServiceBase[] ServicesToRun;
            ServicesToRun = new ServiceBase[]
            {
                new ReportDaemonService(/* Inject dependencies here */)
            };

            try
            {
                ServiceBase.Run(ServicesToRun);
            }
            catch (Exception ex)
            {
                // Log the exception
                // ...
            }
        }
    }
}