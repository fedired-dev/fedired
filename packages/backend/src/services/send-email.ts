import * as nodemailer from "nodemailer";
import { fetchMeta } from "backend-rs";
import Logger from "@/services/logger.js";
import { config } from "@/config.js";
import { inspect } from "node:util";

export const logger = new Logger("email");

export async function sendEmail(
	to: string,
	subject: string,
	html: string,
	text: string,
) {
	const instanceMeta = await fetchMeta();

	const iconUrl = `${config.url}/static-assets/mi-white.png`;
	const emailSettingUrl = `${config.url}/settings/email`;

	const enableAuth =
		instanceMeta.smtpUser != null && instanceMeta.smtpUser !== "";

	const transporter = nodemailer.createTransport({
		host: instanceMeta.smtpHost,
		port: instanceMeta.smtpPort,
		secure: instanceMeta.smtpSecure,
		ignoreTLS: !enableAuth,
		proxy: config.proxySmtp,
		auth: enableAuth
			? {
					user: instanceMeta.smtpUser,
					pass: instanceMeta.smtpPass,
				}
			: undefined,
	} as any);

	try {
		const info = await transporter.sendMail({
			from: instanceMeta.email!,
			to: to,
			subject: subject,
			text: text,
			html: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
  </head>
  <body style="background-color: #161620; margin: 0; padding: 0; font-family: Arial, sans-serif; color: #BAD5FA;">
    <table role="presentation" style="width: 100%; border-spacing: 0; border-collapse: collapse; background-color: #161620; padding: 0; margin: 0;">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <!-- Main container -->
          <table role="presentation" style="width: 600px; max-width: 100%; background-color: #1d1d27; border-radius: 16px; box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.2); overflow: hidden; padding: 20px;">
            <!-- Header -->
            <tr>
              <td style="background-color: #858AFA; padding: 16px; text-align: left; border-bottom: 2px solid rgba(255, 255, 255, 0.1);">
                <table role="presentation" style="width: 100%; border-spacing: 0;">
                  <tr>
                    <td style="text-align: left;">
                      <img src="${instanceMeta.logoImageUrl || instanceMeta.iconUrl || iconUrl}" alt="Logo" style="max-width: 80px; border-radius: 8px;" />
                    </td>
                    <td style="text-align: right; font-size: 1.5rem; font-weight: bold; color: #1e1e2e;">
                      ${instanceMeta.name}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding: 20px;">
                <h1 style="color: #f38ba8; font-size: 1.5rem; margin-bottom: 16px; font-weight: bold;">${subject}</h1>
                <p style="color: #6364FF; margin-bottom: 16px;">${html}</p>
                <p style="color: #bac2de;">Gestiona tus preferencias en tu <a href="${emailSettingUrl}" style="color: #6364FF; text-decoration: none;">configuración de correo electrónico</a>.</p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background-color: #313244; color: #a6adc8; padding: 20px; text-align: center; font-size: 0.9rem;">
                <p>Visita nuestra página: <a href="${config.url}" style="color: #74c7ec; text-decoration: none;">${config.host}</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>


`,
		});

		logger.info(`Message sent: ${info.messageId}`);
	} catch (err) {
		logger.error(inspect(err));
		throw err;
	}
}
