import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CompleteSocialRegistrationDto } from './dto/complete-social-registration.dto';
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
        city: dto.city,
        state: dto.state,
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

    // Cria a conta com senha no formato Better Auth (scrypt)
    const hashedPassword = await hashPassword(dto.password);
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
          callbackURL: `${process.env.APP_URL || 'http://localhost:3000'}/verify-email-success`,
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
        name: dto.name,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        gender: dto.gender,
        instagram: dto.instagram,
        phone: dto.phone,
        profilePhotoUrl: dto.profilePhotoUrl,
        mustChangePassword: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        birthDate: true,
        gender: true,
        instagram: true,
        phone: true,
        profilePhotoUrl: true,
        tenantId: true,
        mustChangePassword: true,
        tenant: { select: { type: true } },
      },
    });
  }

  async updateTenant(userId: string, dto: UpdateTenantDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });

    if (!user?.tenantId) {
      throw new NotFoundException('Tenant não encontrado');
    }

    return this.prisma.tenant.update({
      where: { id: user.tenantId },
      data: {
        name: dto.name,
        cnpj: dto.cnpj,
        address: dto.address,
        zipCode: dto.zipCode,
        instagram: dto.instagram,
        phone: dto.phone,
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
    const isPasswordValid = await verifyPassword({ hash: account.password!, password: dto.currentPassword });

    if (!isPasswordValid) {
      throw new BadRequestException('Senha atual incorreta');
    }

    const hashedPassword = await hashPassword(dto.newPassword);

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

  async completeSocialRegistration(userId: string, dto: CompleteSocialRegistrationDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }

    // Bloqueia apenas se já tiver um tenant vinculado
    if (user.tenantId) {
      throw new BadRequestException('Configuração já completada');
    }

    // Cria o tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        type: dto.tenantType,
        name: dto.tenantName,
        city: dto.city,
        state: dto.state,
      },
    });

    // Atualiza o usuário
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        tenantId: tenant.id,
        status: 'ACTIVE',
      },
    });
  }
}
