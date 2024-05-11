using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ReportManager.Services
{
    public class EmailService
    {
        private readonly ILogger<EmailService> _logger;
        private readonly string _smtpServer;
        private readonly int _smtpPort;
        private readonly string _smtpUsername;
        private readonly string _fromEmail;
        private static readonly string _smtpPassword = Environment.GetEnvironmentVariable("ReportManager_SMTP");

        public EmailService(ILogger<EmailService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _smtpServer = configuration["EmailSettings:SmtpServer"];
            _smtpPort = int.Parse(configuration["EmailSettings:SmtpPort"]!);
            _smtpUsername = configuration["EmailSettings:SmtpUsername"];
            _fromEmail = configuration["EmailSettings:FromEmail"];
        }

        public async Task SendEmailAsync(List<string> recipients, string subject, string body, EmailAttachment attachment = null)
        {
            try
            {
                using (var smtpClient = new SmtpClient(_smtpServer, _smtpPort))
                {
                    smtpClient.EnableSsl = true;
                    smtpClient.Credentials = new NetworkCredential(_smtpUsername, _smtpPassword);

                    using (var mailMessage = new MailMessage())
                    {
                        mailMessage.From = new MailAddress(_fromEmail);
                        recipients.ForEach(recipient => mailMessage.To.Add(recipient));
                        mailMessage.Subject = subject;
                        mailMessage.Body = body;
                        mailMessage.IsBodyHtml = true;

                        if (attachment != null && attachment.Content != null)
                        {
                            attachment.Content.Position = 0;
                            var emailAttachment = new Attachment(attachment.Content, attachment.FileName, attachment.ContentType);
                            mailMessage.Attachments.Add(emailAttachment);
                        }

                        await smtpClient.SendMailAsync(mailMessage);
                    }
                }

                _logger.LogInformation("Email sent successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending email.");
                throw;
            }
        }
    }

    public class EmailAttachment
    {
        public Stream Content { get; set; }
        public string ContentType { get; set; }
        public string FileName { get; set; }
    }
}
