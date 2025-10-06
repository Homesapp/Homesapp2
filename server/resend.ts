import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

export async function getUncachableResendClient() {
  const { apiKey } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: connectionSettings.settings.from_email
  };
}

export async function sendVerificationEmail(to: string, verificationCode: string) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const result = await client.emails.send({
      from: fromEmail,
      to,
      subject: 'Código de verificación - HomesApp',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b;">Bienvenido a HomesApp</h2>
          <p>Gracias por registrarte en nuestra plataforma de gestión inmobiliaria.</p>
          <p>Tu código de verificación es:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b;">${verificationCode}</span>
            </div>
          </div>
          <p>Ingresa este código en la página de verificación para activar tu cuenta.</p>
          <p style="color: #64748b; font-size: 14px; margin-top: 30px;">Este código expirará en 15 minutos.</p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">Si no creaste esta cuenta, puedes ignorar este email.</p>
        </div>
      `,
    });
    
    return result;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}
