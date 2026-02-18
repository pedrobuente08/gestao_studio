import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
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

    // Cria o usuário no nosso sistema
    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: dto.email,
        name: dto.name,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    // Cria a conta com senha no modelo Account (compatível com Better-Auth)
    await this.prisma.account.create({
      data: {
        userId: user.id,
        type: 'email',
        provider: 'credentials',
        password: hashedPassword,
      },
    });

    // Cria sessão
    const session = await this.createSession(user.id);

    return {
      token: session.token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
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
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      account.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Usuário inválido ou inativo');
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
      },
    };
  }

  async loginWithGoogle(googleUser: {
    email: string;
    name: string;
    providerAccountId: string;
  }): Promise<AuthResponse> {
    // Busca ou cria usuário
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      // Cria tenant e usuário
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
        },
      });
    }

    // Cria sessão
    const session = await this.createSession(user.id);

    return {
      token: session.token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
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
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    return user;
  }

  async logout(token: string) {
    await this.prisma.session.deleteMany({
      where: { token },
    });
    return { message: 'Logout realizado com sucesso' };
  }

  private async createSession(userId: string) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias
    const token = this.generateToken();

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

  private generateToken(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }
}
