export function verifyEmailTemplate(
  name: string,
  verificationUrl: string,
): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Verifique seu email — InkStudio</title>
      </head>
      <body style="margin:0; padding:0; background:#09090b; color:#f4f4f5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="max-width:600px; margin:0 auto; padding:40px 20px;">
          <div style="text-align:center; margin-bottom:32px;">
            <h1 style="margin:0; font-size:28px; font-weight:700; color:#f43f5e;">InkStudio</h1>
          </div>

          <div style="background:#18181b; border:1px solid #27272a; border-radius:12px; padding:32px;">
            <h2 style="margin:0 0 16px; font-size:20px; font-weight:600; color:#f4f4f5;">
              Olá, ${name}! 👋
            </h2>
            <p style="margin:0 0 24px; font-size:15px; line-height:1.6; color:#a1a1aa;">
              Obrigado por se cadastrar no InkStudio. Para ativar sua conta, confirme seu endereço de email clicando no botão abaixo:
            </p>

            <div style="text-align:center; margin:32px 0;">
              <a
                href="${verificationUrl}"
                style="display:inline-block; background:#e11d48; color:#ffffff; padding:14px 32px; border-radius:8px; text-decoration:none; font-size:15px; font-weight:600; letter-spacing:0.025em;"
              >
                Verificar Email
              </a>
            </div>

            <p style="margin:24px 0 0; font-size:13px; line-height:1.6; color:#71717a;">
              Se o botão não funcionar, copie e cole este link no seu navegador:
            </p>
            <p style="margin:8px 0 0; font-size:12px; color:#71717a; word-break:break-all;">
              ${verificationUrl}
            </p>

            <hr style="margin:24px 0; border:none; border-top:1px solid #27272a;" />

            <p style="margin:0; font-size:12px; color:#52525b; line-height:1.6;">
              Este link é válido por <strong style="color:#71717a;">24 horas</strong>.
              Se você não criou uma conta no InkStudio, ignore este email com segurança.
            </p>
          </div>

          <p style="text-align:center; margin-top:24px; font-size:12px; color:#52525b;">
            © ${new Date().getFullYear()} InkStudio. Todos os direitos reservados.
          </p>
        </div>
      </body>
    </html>
  `;
}
