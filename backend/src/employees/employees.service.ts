import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { hashPassword } from 'better-auth/crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId, role: { in: ['EMPLOYEE', 'STAFF'] } },
      include: {
        serviceType: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      emailVerified: u.emailVerified,
      serviceTypeId: u.serviceTypeId,
      serviceType: u.serviceType,
      studioPercentage: u.studioPercentage,
      createdAt: u.createdAt,
    }));
  }

  async create(tenantId: string, dto: CreateEmployeeDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email já cadastrado');

    // Senha temporária gerada automaticamente — o colaborador define a própria via link de convite
    const temporaryPassword = dto.password ?? randomBytes(16).toString('hex');
    const hashedPassword = await hashPassword(temporaryPassword);

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        name: dto.name,
        role: dto.role,
        status: 'ACTIVE',
        emailVerified: true,
        serviceTypeId: dto.serviceTypeId,
        mustChangePassword: true,
      },
      include: {
        serviceType: { select: { id: true, name: true } },
      },
    });

    await this.prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        password: hashedPassword,
      },
    });

    // Gera token de convite e persiste na tabela Verification (better-auth).
    // O colaborador define a própria senha ao clicar no link — a senha temporária nunca trafega por email.
    const inviteToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 horas

    await this.prisma.verification.create({
      data: {
        identifier: `invite:${user.id}`,
        value: inviteToken,
        expiresAt,
      },
    });

    await this.emailService.sendEmployeeWelcomeEmail(dto.email, dto.name, inviteToken);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      serviceTypeId: user.serviceTypeId,
      serviceType: user.serviceType,
      createdAt: user.createdAt,
    };
  }

  async update(id: string, tenantId: string, dto: UpdateEmployeeDto) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('Prestador não encontrado');
    if (user.role === 'OWNER') throw new ForbiddenException('Não é possível editar o proprietário');

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: { id: true, name: true, email: true, role: true, status: true, serviceTypeId: true, studioPercentage: true, createdAt: true },
    });
  }

  async deactivate(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('Prestador não encontrado');
    if (user.role === 'OWNER') throw new ForbiddenException('Não é possível desativar o proprietário');

    return this.prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
      select: { id: true, name: true, email: true, role: true, status: true, serviceTypeId: true, createdAt: true },
    });
  }

  async firstAccess(token: string, newPassword: string) {
    const verification = await this.prisma.verification.findUnique({
      where: { value: token },
    });

    if (!verification || !verification.identifier.startsWith('invite:')) {
      throw new BadRequestException('Link de convite inválido ou já utilizado');
    }

    if (verification.expiresAt < new Date()) {
      throw new BadRequestException('Link de convite expirado. Peça ao administrador que reenvie o convite');
    }

    const userId = verification.identifier.replace('invite:', '');

    const hashedPassword = await hashPassword(newPassword);

    await this.prisma.$transaction(async (tx) => {
      // Deleta o token primeiro para evitar uso duplo
      await tx.verification.delete({ where: { value: token } });

      // Busca conta existente pelo userId
      const existingAccount = await tx.account.findFirst({ where: { userId } });

      if (existingAccount) {
        await tx.account.update({
          where: { id: existingAccount.id },
          data: { password: hashedPassword },
        });
      } else {
        // Conta não foi criada no cadastro — cria agora
        await tx.account.create({
          data: {
            userId,
            accountId: userId,
            providerId: 'credential',
            password: hashedPassword,
          },
        });
      }

      await tx.user.update({
        where: { id: userId },
        data: { mustChangePassword: false },
      });
    });

    return { success: true };
  }

  async remove(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('Prestador não encontrado');
    if (user.role === 'OWNER') throw new ForbiddenException('Não é possível excluir o proprietário');
    if (user.status !== 'INACTIVE') throw new BadRequestException('Desative o prestador antes de excluí-lo');

    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
}
