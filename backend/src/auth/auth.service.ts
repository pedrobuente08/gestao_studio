import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse } from './dto/auth-response.dto';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET não está definido no .env');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const tenant = await this.prisma.tenant.create({
      data: {
        type: dto.tenantType,
        name: dto.tenantName,
      },
    });

    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: dto.email,
        name: dto.name,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    await this.prisma.authCredential.create({
      data: {
        userId: user.id,
        type: 'password',
        hashedPassword,
      },
    });

    return this.generateAuthResponse(user.id, user.tenantId);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        authCredentials: {
          where: { type: 'password' },
        },
      },
    });

    if (!user || user.authCredentials.length === 0) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const credential = user.authCredentials[0];

    if (!credential.hashedPassword) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      credential.hashedPassword,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.status === 'PENDING_VERIFICATION') {
      throw new UnauthorizedException(
        'Email não verificado. Verifique sua caixa de entrada.',
      );
    }

    return this.generateAuthResponse(user.id, user.tenantId);
  }

  async loginWithGoogle(googleUser: {
    providerAccountId: string;
    email: string;
    name: string;
  }): Promise<AuthResponse> {
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
      include: {
        authCredentials: {
          where: { type: 'google' },
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
          authCredentials: {
            where: { type: 'google' },
          },
        },
      });

      await this.prisma.authCredential.create({
        data: {
          userId: user.id,
          type: 'google',
          providerAccountId: googleUser.providerAccountId,
        },
      });
    } else {
      if (user.name !== googleUser.name) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { name: googleUser.name },
        });
      }

      if (user.authCredentials.length === 0) {
        await this.prisma.authCredential.create({
          data: {
            userId: user.id,
            type: 'google',
            providerAccountId: googleUser.providerAccountId,
          },
        });
      }

      if (user.status !== 'ACTIVE') {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { status: 'ACTIVE' },
        });
      }
    }

    return this.generateAuthResponse(user.id, user.tenantId);
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        authCredentials: {
          where: { type: 'password' },
        },
      },
    });

    if (user && user.authCredentials.length > 0) {
      const resetToken = randomBytes(32).toString('hex');
      const resetTokenExpiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      );

      await this.prisma.authCredential.update({
        where: { id: user.authCredentials[0].id },
        data: { resetToken, resetTokenExpiresAt },
      });
    }

    return { message: 'Se o email existir, um link de reset será enviado.' };
  }

  async validateResetToken(token: string) {
    const credential = await this.prisma.authCredential.findUnique({
      where: { resetToken: token },
    });

    if (!credential || !credential.resetTokenExpiresAt) {
      return { valid: false };
    }

    if (credential.resetTokenExpiresAt < new Date()) {
      return { valid: false };
    }

    return { valid: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const credential = await this.prisma.authCredential.findUnique({
      where: { resetToken: token },
    });

    if (!credential || !credential.resetTokenExpiresAt) {
      throw new BadRequestException('Token inválido');
    }

    if (credential.resetTokenExpiresAt < new Date()) {
      throw new BadRequestException('Token expirado');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.authCredential.update({
      where: { id: credential.id },
      data: {
        hashedPassword,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    });

    return { message: 'Senha alterada com sucesso' };
  }

  async verifyEmail(token: string) {
    const credential = await this.prisma.authCredential.findUnique({
      where: { verificationToken: token },
    });

    if (!credential || !credential.verificationTokenExpiresAt) {
      throw new BadRequestException('Token de verificação inválido');
    }

    if (credential.verificationTokenExpiresAt < new Date()) {
      throw new BadRequestException('Token de verificação expirado');
    }

    await this.prisma.user.update({
      where: { id: credential.userId },
      data: { status: 'ACTIVE' },
    });

    await this.prisma.authCredential.update({
      where: { id: credential.id },
      data: {
        verificationToken: null,
        verificationTokenExpiresAt: null,
      },
    });

    return { message: 'Email verificado com sucesso' };
  }

  async validateToken(token: string) {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = jwt.verify(token, secret!) as {
        userId: string;
        tenantId: string;
      };

      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
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
    } catch {
      return null;
    }
  }

  private async generateAuthResponse(
    userId: string,
    tenantId: string,
  ): Promise<AuthResponse> {
    const token = jwt.sign(
      { userId, tenantId },
      JWT_SECRET as jwt.Secret,
      { expiresIn: JWT_EXPIRATION } as jwt.SignOptions,
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.authSession.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
      },
    });

    return { token, user };
  }
}
