import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
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
      createdAt: u.createdAt,
    }));
  }

  async create(tenantId: string, dto: CreateEmployeeDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email já cadastrado');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

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

    // Envia email de boas-vindas com a senha temporária
    await this.emailService.sendEmployeeWelcomeEmail(dto.email, dto.name, dto.password);

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
      select: { id: true, name: true, email: true, role: true, status: true, serviceTypeId: true, createdAt: true },
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
}
