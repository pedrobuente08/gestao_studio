import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { auth } from '../config/better-auth.config';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email já cadastrado');
    }

    // Cria o tenant com os campos customizados (tenantType/tenantName)
    const tenant = await this.prisma.tenant.create({
      data: {
        type: dto.tenantType,
        name: dto.tenantName,
      },
    });

    // Cria o usuário diretamente via Prisma (bypassa databaseHooks)
    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: dto.email,
        name: dto.name,
        role: 'OWNER',
        status: 'ACTIVE',
        emailVerified: false,
      },
    });

    // Cria a conta com senha no formato Better Auth
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    await this.prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        password: hashedPassword,
      },
    });

    // Better Auth envia o email de verificação
    try {
      await auth.api.sendVerificationEmail({
        body: {
          email: dto.email,
          callbackURL: `${process.env.APP_URL || 'http://localhost:3000'}/login`,
        },
      });
    } catch {
      // Não falha o registro se o email não puder ser enviado
    }

    return { message: 'Verifique seu email para ativar a conta' };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...dto,
        mustChangePassword: false,
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
        accounts: { where: { providerId: 'credential' } },
      },
    });

    if (!user || user.accounts.length === 0) {
      throw new BadRequestException('Usuário não encontrado');
    }

    const account = user.accounts[0];
    const isPasswordValid = await bcrypt.compare(dto.currentPassword, account.password!);

    if (!isPasswordValid) {
      throw new BadRequestException('Senha atual incorreta');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

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
}
