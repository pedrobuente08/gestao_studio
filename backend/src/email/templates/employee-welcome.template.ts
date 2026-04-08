import { escapeHtml } from './escape-html';

export const employeeWelcomeTemplate = (name: string, inviteUrl: string) => {
  const safeName = escapeHtml(name);
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px; }
    .header { text-align: center; margin-bottom: 30px; }
    .btn { display: inline-block; background-color: #f43f5e; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    .footer { font-size: 12px; color: #666; margin-top: 30px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color: #f43f5e; margin: 0;">Bem-vindo(a) ao Gestão Studio!</h1>
    </div>

    <p>Olá, <strong>${safeName}</strong>!</p>

    <p>Você foi convidado(a) para fazer parte de uma equipe no Gestão Studio.</p>

    <p>Clique no botão abaixo para definir sua senha e ativar sua conta:</p>

    <div style="text-align: center;">
      <a href="${inviteUrl}" class="btn">Ativar minha conta</a>
    </div>

    <p style="font-size: 13px; color: #888;">Este link é válido por 72 horas. Caso não consiga clicar no botão, copie e cole o endereço abaixo no seu navegador:</p>
    <p style="font-size: 12px; word-break: break-all; color: #aaa;">${inviteUrl}</p>

    <div class="footer">
      <p>Equipe Gestão Studio</p>
      <p>&copy; 2024 Gestão Studio. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
`;
};
