import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse } from './dto/auth-response.dto';
import {
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    // Verifica se o email já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Cria o tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        type: dto.tenantType,
        name: dto.tenantName,
      },
    });

    // Cria o usuário
    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: dto.email,
        name: dto.name,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    // Cria a conta com senha — emailVerified null até verificar
    await this.prisma.account.create({
      data: {
        userId: user.id,
        type: 'email',
        provider: 'credentials',
        password: hashedPassword,
        emailVerified: null,
      },
    });

    // Gera token de verificação (24 horas)
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.verificationToken.create({
      data: {
        identifier: `email-verify:${user.email}`,
        token,
        expires,
      },
    });

    // Envia email de verificação
    await this.emailService.sendVerificationEmail(user.email, user.name, token);

    return { message: 'Verifique seu email para ativar a conta' };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    // Busca o usuário com a conta
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        accounts: {
          where: {
            type: 'email',
            provider: 'credentials',
          },
        },
        tenant: {
          select: {
            type: true,
          },
        },
      },
    });

    if (!user || user.accounts.length === 0) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const account = user.accounts[0];

    if (!account.password) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Valida a senha
    const isPasswordValid = await bcrypt.compare(dto.password, account.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Usuário inválido ou inativo');
    }

    // Verifica se o email foi verificado
    if (!account.emailVerified) {
      throw new UnauthorizedException(
        'Email não verificado. Verifique sua caixa de entrada.',
      );
    }

    // Busca ou cria sessão
    const session = await this.findOrCreateSession(user.id);

    return {
      token: session.token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenantType: user.tenant.type,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    // Busca o token de verificação
    const verificationToken = await this.prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken || verificationToken.expires < new Date()) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    // Extrai o email do identifier (formato: email-verify:{email})
    const email = verificationToken.identifier.replace('email-verify:', '');

    // Busca o usuário
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        accounts: {
          where: { type: 'email', provider: 'credentials' },
        },
      },
    });

    if (!user || user.accounts.length === 0) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const account = user.accounts[0];

    // Marca o email como verificado
    await this.prisma.account.update({
      where: { id: account.id },
      data: { emailVerified: new Date() },
    });

    // Deleta o token usado
    await this.prisma.verificationToken.delete({
      where: { token },
    });

    return { message: 'Email verificado com sucesso. Agora você pode fazer login.' };
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        accounts: {
          where: { type: 'email', provider: 'credentials' },
        },
      },
    });

    // Retorna sucesso mesmo se não encontrar (segurança)
    if (!user || user.accounts.length === 0) {
      return { message: 'Se o email existir, você receberá um novo link de verificação' };
    }

    const account = user.accounts[0];

    // Se já verificado, não reenvia
    if (account.emailVerified) {
      return { message: 'Email já verificado. Faça login normalmente.' };
    }

    // Invalida tokens anteriores
    await this.prisma.verificationToken.deleteMany({
      where: { identifier: `email-verify:${email}` },
    });

    // Gera novo token (24 horas)
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.verificationToken.create({
      data: {
        identifier: `email-verify:${email}`,
        token,
        expires,
      },
    });

    await this.emailService.sendVerificationEmail(user.email, user.name, token);

    return { message: 'Email de verificação reenviado com sucesso' };
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const genericMessage = { message: 'Se o email existir, você receberá as instruções de recuperação' };

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Retorna mensagem genérica mesmo se não encontrar (segurança)
    if (!user) {
      return genericMessage;
    }

    // Invalida tokens anteriores de reset
    await this.prisma.verificationToken.deleteMany({
      where: { identifier: `password-reset:${email}` },
    });

    // Gera token (1 hora)
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.verificationToken.create({
      data: {
        identifier: `password-reset:${email}`,
        token,
        expires,
      },
    });

    await this.emailService.sendPasswordResetEmail(user.email, user.name, token);

    return genericMessage;
  }

  async validateResetToken(token: string): Promise<{ valid: boolean }> {
    const verificationToken = await this.prisma.verificationToken.findUnique({
      where: { token },
    });

    if (
      !verificationToken ||
      !verificationToken.identifier.startsWith('password-reset:') ||
      verificationToken.expires < new Date()
    ) {
      return { valid: false };
    }

    return { valid: true };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const verificationToken = await this.prisma.verificationToken.findUnique({
      where: { token },
    });

    if (
      !verificationToken ||
      !verificationToken.identifier.startsWith('password-reset:') ||
      verificationToken.expires < new Date()
    ) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    // Extrai o email do identifier
    const email = verificationToken.identifier.replace('password-reset:', '');

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        accounts: {
          where: { type: 'email', provider: 'credentials' },
        },
      },
    });

    if (!user || user.accounts.length === 0) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const account = user.accounts[0];

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualiza a senha
    await this.prisma.account.update({
      where: { id: account.id },
      data: { password: hashedPassword },
    });

    // Deleta o token usado
    await this.prisma.verificationToken.delete({
      where: { token },
    });

    // Invalida todas as sessões ativas do usuário
    await this.prisma.session.deleteMany({
      where: { userId: user.id },
    });

    return { message: 'Senha redefinida com sucesso' };
  }

  async loginWithGoogle(googleUser: {
    email: string;
    name: string;
    providerAccountId: string;
  }): Promise<AuthResponse> {
    // Busca ou cria usuário
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
      include: {
        tenant: {
          select: {
            type: true,
          },
        },
      },
    });

    if (!user) {
      const tenant = await this.prisma.tenant.create({
        data: {
          type: 'AUTONOMO',
          name: googleUser.name,
        },
      });

      user = await this.prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: googleUser.email,
          name: googleUser.name,
          role: 'OWNER',
          status: 'ACTIVE',
        },
        include: {
          tenant: {
            select: {
              type: true,
            },
          },
        },
      });
    }

    // Cria ou busca conta OAuth
    let account = await this.prisma.account.findFirst({
      where: {
        userId: user.id,
        provider: 'google',
        providerAccountId: googleUser.providerAccountId,
      },
    });

    if (!account) {
      account = await this.prisma.account.create({
        data: {
          userId: user.id,
          type: 'oauth',
          provider: 'google',
          providerAccountId: googleUser.providerAccountId,
          emailVerified: new Date(), // OAuth já verifica o email
        },
      });
    }

    const session = await this.createSession(user.id);

    return {
      token: session.token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenantType: user.tenant.type,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  async validateToken(token: string) {
    const session = await this.prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        status: true,
        mustChangePassword: true,
        tenant: {
          select: {
            type: true,
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      tenantType: user.tenant.type,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
    };
  }

  async logout(token: string) {
    await this.prisma.session.deleteMany({
      where: { token },
    });
    return { message: 'Logout realizado com sucesso' };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...dto,
        mustChangePassword: false, // Se o usuário está atualizando o perfil, assumimos que ele já lidou com as pendências
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        age: true,
        gender: true,
        profilePhotoUrl: true,
        tenantId: true,
        mustChangePassword: true,
      },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          where: { type: 'email', provider: 'credentials' },
        },
      },
    });

    if (!user || user.accounts.length === 0) {
      throw new BadRequestException('Usuário não encontrado');
    }

    const account = user.accounts[0];

    // Valida senha atual
    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      account.password!,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Senha atual incorreta');
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // Atualiza a senha e remove a flag mustChangePassword
    await this.prisma.account.update({
      where: { id: account.id },
      data: { password: hashedPassword },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { mustChangePassword: false },
    });

    return { message: 'Senha alterada com sucesso' };
  }

  private async createSession(userId: string) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias
    const token = crypto.randomBytes(32).toString('hex');

    return await this.prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  private async findOrCreateSession(userId: string) {
    const existingSession = await this.prisma.session.findFirst({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingSession) {
      return existingSession;
    }

    return await this.createSession(userId);
  }
}
