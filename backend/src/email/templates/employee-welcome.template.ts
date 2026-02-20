export const employeeWelcomeTemplate = (name: string, email: string, password: string, verificationUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px; }
    .header { text-align: center; margin-bottom: 30px; }
    .btn { display: inline-block; padding: 12px 24px; background-color: #f43f5e; color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .credentials { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px dashed #ccc; }
    .footer { font-size: 12px; color: #666; margin-top: 30px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color: #f43f5e; margin: 0;">Bem-vindo(a) ao InkStudio!</h1>
    </div>
    
    <p>Olá, <strong>${name}</strong>!</p>
    
    <p>Você foi convidado(a) para fazer parte de uma equipe no InkStudio. Abaixo estão seus dados de acesso temporários:</p>
    
    <div class="credentials">
      <p style="margin: 0;"><strong>Email:</strong> ${email}</p>
      <p style="margin: 5px 0 0 0;"><strong>Senha Temporária:</strong> ${password}</p>
    </div>
    
    <p><strong>Importante:</strong> Para sua segurança, você deve ativar sua conta clicando no botão abaixo antes de tentar fazer login. Após o primeiro acesso, recomendamos que você altere sua senha no menu de perfil.</p>
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="${verificationUrl}" class="btn">Ativar Minha Conta</a>
    </div>
    
    <p style="margin-top: 30px;">Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:</p>
    <p style="word-break: break-all; color: #666; font-size: 14px;">${verificationUrl}</p>
    
    <p>Desejamos muito sucesso em sua jornada conosco!</p>
    
    <div class="footer">
      <p>Equipe InkStudio</p>
      <p>&copy; 2024 InkStudio. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
`;
