# Plano de Implementação: Funcionalidades Studio

## Contexto
O sistema hoje não diferencia Studio de Autônomo na UI. Este plano implementa as features específicas de Studio: gestão de serviços, gestão de funcionários (convite por email), seleção de profissional nas sessões e dashboard de desempenho.

---

## ETAPA 1 — Backend: `tenantType` no auth response

O frontend precisa saber se o tenant é STUDIO ou AUTONOMO para mostrar/ocultar menus.

**Arquivos a modificar:**
- `backend/src/auth/dto/auth-response.dto.ts`
- `backend/src/auth/auth.service.ts`

**`auth-response.dto.ts`** — adicionar `tenantType`:
```ts
import { UserRole, TenantType } from '@prisma/client';

export class AuthUserResponse {
  id!: string;
  email!: string;
  name!: string;
  role!: UserRole;
  tenantId!: string;
  tenantType!: TenantType; // NOVO
}
```

**`auth.service.ts`** — em `login()`, `verifyEmail()`, `loginWithGoogle()`, incluir tenant no select e retornar `tenantType`:

```ts
// Em login(): incluir tenant no findUnique
const user = await this.prisma.user.findUnique({
  where: { email: dto.email },
  include: {
    accounts: { where: { type: 'email', provider: 'credentials' } },
    tenant: { select: { type: true } }, // NOVO
  },
});

// No return do login():
return {
  token: session.token,
  user: {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
    tenantType: user.tenant.type, // NOVO
  },
};
```

Repetir o mesmo padrão em `verifyEmail()` e `loginWithGoogle()` (buscar tenant e incluir `tenantType` no retorno).

**`auth.controller.ts`** — o `getMe()` retorna `req.user` que vem do `validateToken()`. Incluir `tenantType` no `validateToken()` também:

```ts
// auth.service.ts — validateToken()
const user = await this.prisma.user.findUnique({
  where: { id: session.userId },
  select: {
    id: true,
    email: true,
    name: true,
    role: true,
    tenantId: true,
    status: true,
    tenant: { select: { type: true } }, // NOVO
  },
});

// No return do validateToken():
return {
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  tenantId: user.tenantId,
  tenantType: user.tenant.type, // NOVO
  status: user.status,
};
```

---

## ETAPA 2 — Backend: Módulo `employees`

**Arquivos a criar:**
```
backend/src/employees/
  employees.module.ts
  employees.controller.ts
  employees.service.ts
  dto/
    create-employee.dto.ts
    update-employee.dto.ts
```

**`create-employee.dto.ts`:**
```ts
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateEmployeeDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(['EMPLOYEE', 'STAFF'])
  role: 'EMPLOYEE' | 'STAFF';
}
```

**`update-employee.dto.ts`:**
```ts
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole, UserStatus } from '@prisma/client';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['EMPLOYEE', 'STAFF'])
  role?: 'EMPLOYEE' | 'STAFF';

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
```

**`employees.service.ts`:**
```ts
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
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
        accounts: {
          where: { type: 'email', provider: 'credentials' },
          select: { emailVerified: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      emailVerified: u.accounts[0]?.emailVerified ?? null,
      createdAt: u.createdAt,
    }));
  }

  async create(tenantId: string, dto: CreateEmployeeDto) {
    // Verifica se email já existe
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
      },
    });

    await this.prisma.account.create({
      data: {
        userId: user.id,
        type: 'email',
        provider: 'credentials',
        password: hashedPassword,
        emailVerified: null,
      },
    });

    // Token de verificação (24h)
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.verificationToken.create({
      data: {
        identifier: `email-verify:${dto.email}`,
        token,
        expires,
      },
    });

    await this.emailService.sendVerificationEmail(dto.email, dto.name, token);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: null,
      createdAt: user.createdAt,
    };
  }

  async update(id: string, tenantId: string, dto: UpdateEmployeeDto) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('Funcionário não encontrado');
    if (user.role === 'OWNER') throw new ForbiddenException('Não é possível editar o proprietário');

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    });
  }

  async deactivate(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('Funcionário não encontrado');
    if (user.role === 'OWNER') throw new ForbiddenException('Não é possível desativar o proprietário');

    return this.prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    });
  }
}
```

**`employees.controller.ts`:**
```ts
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@Controller('employees')
@UseGuards(AuthGuard, RolesGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @Roles('OWNER', 'STAFF')
  findAll(@CurrentTenant() tenantId: string) {
    return this.employeesService.findAll(tenantId);
  }

  @Post()
  @Roles('OWNER', 'STAFF')
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(tenantId, dto);
  }

  @Patch(':id')
  @Roles('OWNER', 'STAFF')
  update(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @Roles('OWNER')
  deactivate(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.employeesService.deactivate(id, tenantId);
  }
}
```

**`employees.module.ts`:**
```ts
import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, EmailModule, AuthModule],
  controllers: [EmployeesController],
  providers: [EmployeesService],
})
export class EmployeesModule {}
```

**`app.module.ts`** — adicionar `EmployeesModule` nos imports:
```ts
import { EmployeesModule } from './employees/employees.module';
// ... adicionar EmployeesModule ao array imports
```

---

## ETAPA 3 — Backend: Endpoint `GET /sessions/stats`

**`backend/src/sessions/sessions.service.ts`** — adicionar método `getStats()`:

```ts
async getStats(
  tenantId: string,
  filters: {
    serviceTypeId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  },
) {
  const where: any = { tenantId };

  if (filters.serviceTypeId) where.serviceTypeId = filters.serviceTypeId;
  if (filters.userId) where.userId = filters.userId;
  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = new Date(filters.startDate);
    if (filters.endDate) where.date.lte = new Date(filters.endDate + 'T23:59:59');
  }

  const [aggregate, sessions] = await Promise.all([
    this.prisma.tattooSession.aggregate({
      where,
      _sum: { finalPrice: true },
      _count: { id: true },
      _avg: { finalPrice: true },
    }),
    this.prisma.tattooSession.findMany({
      where,
      include: {
        serviceType: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    }),
  ]);

  // Agrupar por tipo de serviço
  const byServiceTypeMap = new Map<string, { serviceTypeId: string; name: string; count: number; revenue: number }>();
  const byEmployeeMap = new Map<string, { userId: string; name: string; count: number; revenue: number }>();

  for (const s of sessions) {
    if (s.serviceType) {
      const key = s.serviceType.id;
      const existing = byServiceTypeMap.get(key) ?? { serviceTypeId: key, name: s.serviceType.name, count: 0, revenue: 0 };
      existing.count++;
      existing.revenue += s.finalPrice;
      byServiceTypeMap.set(key, existing);
    }
    if (s.user) {
      const key = s.user.id;
      const existing = byEmployeeMap.get(key) ?? { userId: key, name: s.user.name, count: 0, revenue: 0 };
      existing.count++;
      existing.revenue += s.finalPrice;
      byEmployeeMap.set(key, existing);
    }
  }

  return {
    totalRevenue: aggregate._sum.finalPrice ?? 0,
    sessionCount: aggregate._count.id,
    avgTicket: Math.round(aggregate._avg.finalPrice ?? 0),
    byServiceType: Array.from(byServiceTypeMap.values()),
    byEmployee: Array.from(byEmployeeMap.values()),
  };
}
```

**`backend/src/sessions/sessions.controller.ts`** — adicionar rota (antes das rotas com `:id`):

```ts
// Adicionar imports necessários: Query, Get
@Get('stats')
@Roles('OWNER', 'STAFF', 'EMPLOYEE')
getStats(
  @CurrentTenant() tenantId: string,
  @Query('serviceTypeId') serviceTypeId?: string,
  @Query('userId') userId?: string,
  @Query('startDate') startDate?: string,
  @Query('endDate') endDate?: string,
) {
  return this.sessionsService.getStats(tenantId, { serviceTypeId, userId, startDate, endDate });
}
```

---

## ETAPA 4 — Frontend: `tenantType` nos tipos

**`frontend/src/types/auth.types.ts`** — adicionar `tenantType` ao `User`:
```ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'STAFF' | 'EMPLOYEE';
  tenantId: string;
  tenantType: 'AUTONOMO' | 'STUDIO'; // NOVO
}
```

O `useAuthStore` não precisa de mudança pois o `user` já é tipado via `User`.

---

## ETAPA 5 — Frontend: Página de Gestão de Serviços

**Criar:** `frontend/src/app/(dashboard)/service-types/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useServiceTypes } from '@/hooks/use-service-types';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export default function ServiceTypesPage() {
  const { serviceTypes, isLoading, createServiceType, removeServiceType, isCreating } = useServiceTypes();
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    createServiceType({ name: newName.trim() }, { onSuccess: () => setNewName('') });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-100">Tipos de Serviço</h1>

      {/* Form de adição */}
      <div className="flex gap-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Ex: Micropigmentação, Dermopigmentação..."
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-rose-500"
        />
        <Button onClick={handleAdd} isLoading={isCreating} disabled={!newName.trim()}>
          Adicionar
        </Button>
      </div>

      {/* Lista */}
      <div className="rounded-lg border border-zinc-800 divide-y divide-zinc-800">
        {isLoading && (
          <p className="p-4 text-sm text-zinc-500">Carregando...</p>
        )}
        {serviceTypes.map((type) => (
          <div key={type.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-100">{type.name}</span>
              {type.isSystem && (
                <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                  Sistema
                </span>
              )}
            </div>
            {!type.isSystem && (
              <button
                onClick={() => removeServiceType(type.id)}
                className="text-zinc-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## ETAPA 6 — Frontend: Tipos, service e hook de Funcionários

**Criar:** `frontend/src/types/employee.types.ts`
```ts
export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'EMPLOYEE' | 'STAFF';
  status: 'ACTIVE' | 'INACTIVE';
  emailVerified: string | null;
  createdAt: string;
}

export interface CreateEmployeeData {
  name: string;
  email: string;
  password: string;
  role: 'EMPLOYEE' | 'STAFF';
}

export interface UpdateEmployeeData {
  name?: string;
  role?: 'EMPLOYEE' | 'STAFF';
  status?: 'ACTIVE' | 'INACTIVE';
}
```

**Criar:** `frontend/src/services/employees.service.ts`
```ts
import api from './api';
import { Employee, CreateEmployeeData, UpdateEmployeeData } from '@/types/employee.types';

export const employeesService = {
  async getAll(): Promise<Employee[]> {
    const response = await api.get<Employee[]>('/employees');
    return response.data;
  },

  async create(data: CreateEmployeeData): Promise<Employee> {
    const response = await api.post<Employee>('/employees', data);
    return response.data;
  },

  async update(id: string, data: UpdateEmployeeData): Promise<Employee> {
    const response = await api.patch<Employee>(`/employees/${id}`, data);
    return response.data;
  },

  async deactivate(id: string): Promise<Employee> {
    const response = await api.delete<Employee>(`/employees/${id}`);
    return response.data;
  },
};
```

**Criar:** `frontend/src/hooks/use-employees.ts`
```ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeesService } from '@/services/employees.service';
import { CreateEmployeeData, UpdateEmployeeData } from '@/types/employee.types';

export function useEmployees() {
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: employeesService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateEmployeeData) => employeesService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeData }) =>
      employeesService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => employeesService.deactivate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });

  return {
    employees,
    isLoading,
    createEmployee: createMutation.mutate,
    updateEmployee: updateMutation.mutate,
    deactivateEmployee: deactivateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeactivating: deactivateMutation.isPending,
    createError: createMutation.error,
  };
}
```

---

## ETAPA 7 — Frontend: Página e Modal de Funcionários

**Criar:** `frontend/src/components/modals/employee-modal.tsx`
```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useEmployees } from '@/hooks/use-employees';
import { AxiosError } from 'axios';

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
  role: z.enum(['EMPLOYEE', 'STAFF']),
});

type FormData = z.infer<typeof schema>;

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const roleOptions = [
  { value: 'EMPLOYEE', label: 'Funcionário' },
  { value: 'STAFF', label: 'Staff (gerente)' },
];

export function EmployeeModal({ isOpen, onClose }: EmployeeModalProps) {
  const { createEmployee, isCreating, createError } = useEmployees();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'EMPLOYEE', password: 'ink@studio1' },
  });

  const onSubmit = (data: FormData) => {
    createEmployee(data, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const errorMessage = createError instanceof AxiosError
    ? createError.response?.data?.message
    : createError?.message;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Funcionário">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMessage && (
          <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
            {errorMessage}
          </div>
        )}

        <Input label="Nome" placeholder="Ex: João Silva" error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="email" placeholder="joao@email.com" error={errors.email?.message} {...register('email')} />
        <Input label="Senha inicial" type="text" error={errors.password?.message} {...register('password')} />
        <Select label="Cargo" options={roleOptions} error={errors.role?.message} {...register('role')} />

        <p className="text-xs text-zinc-500">
          O funcionário receberá um email para ativar a conta. Após ativação, pode fazer login com a senha definida acima.
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isCreating}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isCreating}>
            Cadastrar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

**Criar:** `frontend/src/app/(dashboard)/employees/page.tsx`
```tsx
'use client';

import { useState } from 'react';
import { useEmployees } from '@/hooks/use-employees';
import { EmployeeModal } from '@/components/modals/employee-modal';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/format'; // ou use new Date().toLocaleDateString()
import { UserPlus } from 'lucide-react';

export default function EmployeesPage() {
  const { employees, isLoading, updateEmployee, deactivateEmployee } = useEmployees();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const roleLabel = (role: string) =>
    role === 'STAFF' ? 'Staff' : 'Funcionário';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Funcionários</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Funcionário
        </Button>
      </div>

      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Nome</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Cargo</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Email Verificado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-zinc-500">Carregando...</td></tr>
            )}
            {employees.map((emp) => (
              <tr key={emp.id} className="bg-zinc-950">
                <td className="px-4 py-3 text-zinc-100">{emp.name}</td>
                <td className="px-4 py-3 text-zinc-400">{emp.email}</td>
                <td className="px-4 py-3 text-zinc-400">{roleLabel(emp.role)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    emp.status === 'ACTIVE'
                      ? 'bg-green-500/15 text-green-400'
                      : 'bg-zinc-700 text-zinc-400'
                  }`}>
                    {emp.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {emp.emailVerified
                    ? <span className="text-green-400">Verificado</span>
                    : <span className="text-yellow-500">Pendente</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() =>
                      emp.status === 'ACTIVE'
                        ? deactivateEmployee(emp.id)
                        : updateEmployee({ id: emp.id, data: { status: 'ACTIVE' } })
                    }
                    className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
                  >
                    {emp.status === 'ACTIVE' ? 'Desativar' : 'Reativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EmployeeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
```

---

## ETAPA 8 — Frontend: Atualizar Session Modal

**`frontend/src/components/modals/session-modal.tsx`** — alterações:

1. Importar `useEmployees`
2. Adicionar `userId` ao schema Zod
3. Adicionar select de "Profissional Responsável" após o tipo de serviço
4. Remover `userId: user?.id || ''` hardcoded

```ts
// 1. Importar
import { useEmployees } from '@/hooks/use-employees';

// 2. Schema — adicionar userId:
const sessionSchema = z.object({
  clientId: z.string().min(1, 'Selecione um cliente'),
  serviceTypeId: z.string().min(1, 'Selecione o tipo de serviço'),
  userId: z.string().min(1, 'Selecione o profissional'), // NOVO
  date: z.string().min(1, 'Selecione a data'),
  finalPrice: z.coerce.number().min(0),
  description: z.string().optional().or(z.literal('')),
  size: z.string().optional(),
  complexity: z.string().optional(),
  bodyLocation: z.string().optional(),
  duration: z.coerce.number().optional(),
});

// 3. No componente:
const { employees } = useEmployees();
const activeEmployees = employees.filter(e => e.status === 'ACTIVE');
const employeeOptions = activeEmployees.map(e => ({ value: e.id, label: e.name }));

// 4. No reset() de edição:
reset({
  ...
  userId: session.user?.id || '', // NOVO
});

// 5. No reset() de criação:
reset({
  ...
  userId: '', // NOVO
});

// 6. No onSubmit():
const payload: CreateSessionData = {
  clientId: data.clientId,
  userId: data.userId, // ALTERADO (antes era user?.id)
  ...
};

// 7. No JSX, após o select de Tipo de Serviço:
<Select
  label="Profissional Responsável"
  placeholder="Selecione o profissional"
  options={employeeOptions}
  error={errors.userId?.message}
  {...register('userId')}
/>
```

---

## ETAPA 9 — Frontend: Página de Desempenho

**Criar:** `frontend/src/services/sessions-stats.service.ts`
```ts
import api from './api';

export interface StatsResult {
  totalRevenue: number;
  sessionCount: number;
  avgTicket: number;
  byServiceType: { serviceTypeId: string; name: string; count: number; revenue: number }[];
  byEmployee: { userId: string; name: string; count: number; revenue: number }[];
}

export const sessionsStatsService = {
  async getStats(params: {
    serviceTypeId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<StatsResult> {
    const response = await api.get<StatsResult>('/sessions/stats', { params });
    return response.data;
  },
};
```

**Criar:** `frontend/src/hooks/use-sessions-stats.ts`
```ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { sessionsStatsService } from '@/services/sessions-stats.service';

export function useSessionsStats(params: {
  serviceTypeId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['sessions-stats', params],
    queryFn: () => sessionsStatsService.getStats(params),
  });
}
```

**Criar:** `frontend/src/app/(dashboard)/performance/page.tsx`
```tsx
'use client';

import { useState } from 'react';
import { useSessionsStats } from '@/hooks/use-sessions-stats';
import { useServiceTypes } from '@/hooks/use-service-types';
import { useEmployees } from '@/hooks/use-employees';
import { formatCurrency } from '@/utils/format';

const periodOptions = [
  { label: 'Mês atual', value: 'current-month' },
  { label: 'Últimos 3 meses', value: '3-months' },
  { label: 'Últimos 6 meses', value: '6-months' },
  { label: 'Este ano', value: 'year' },
];

function getPeriodDates(period: string) {
  const now = new Date();
  const endDate = now.toISOString().split('T')[0];
  let startDate: string;

  if (period === 'current-month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  } else if (period === '3-months') {
    startDate = new Date(now.setMonth(now.getMonth() - 3)).toISOString().split('T')[0];
  } else if (period === '6-months') {
    startDate = new Date(now.setMonth(now.getMonth() - 6)).toISOString().split('T')[0];
  } else {
    startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
  }

  return { startDate, endDate };
}

export default function PerformancePage() {
  const { serviceTypes } = useServiceTypes();
  const { employees } = useEmployees();

  const [serviceTypeId, setServiceTypeId] = useState('');
  const [userId, setUserId] = useState('');
  const [period, setPeriod] = useState('current-month');

  const { startDate, endDate } = getPeriodDates(period);
  const { data: stats, isLoading } = useSessionsStats({
    serviceTypeId: serviceTypeId || undefined,
    userId: userId || undefined,
    startDate,
    endDate,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-100">Desempenho</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
        >
          {periodOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={serviceTypeId}
          onChange={(e) => setServiceTypeId(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="">Todos os serviços</option>
          {serviceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="">Todos os funcionários</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Faturado', value: formatCurrency(stats?.totalRevenue ?? 0) },
          { label: 'Nº de Sessões', value: stats?.sessionCount ?? 0 },
          { label: 'Ticket Médio', value: formatCurrency(stats?.avgTicket ?? 0) },
        ].map(card => (
          <div key={card.label} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500 mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-zinc-100">{isLoading ? '...' : card.value}</p>
          </div>
        ))}
      </div>

      {/* Tabelas de breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Por tipo de serviço */}
        <div className="rounded-lg border border-zinc-800">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h2 className="text-sm font-medium text-zinc-300">Por Tipo de Serviço</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="text-left px-4 py-2 font-normal">Serviço</th>
                <th className="text-right px-4 py-2 font-normal">Sessões</th>
                <th className="text-right px-4 py-2 font-normal">Receita</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {(stats?.byServiceType ?? []).map(row => (
                <tr key={row.serviceTypeId}>
                  <td className="px-4 py-2.5 text-zinc-100">{row.name}</td>
                  <td className="px-4 py-2.5 text-right text-zinc-400">{row.count}</td>
                  <td className="px-4 py-2.5 text-right text-zinc-100">{formatCurrency(row.revenue)}</td>
                </tr>
              ))}
              {!isLoading && !stats?.byServiceType?.length && (
                <tr><td colSpan={3} className="px-4 py-4 text-center text-zinc-600">Sem dados</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Por funcionário */}
        <div className="rounded-lg border border-zinc-800">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h2 className="text-sm font-medium text-zinc-300">Por Funcionário</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="text-left px-4 py-2 font-normal">Profissional</th>
                <th className="text-right px-4 py-2 font-normal">Sessões</th>
                <th className="text-right px-4 py-2 font-normal">Receita</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {(stats?.byEmployee ?? []).map(row => (
                <tr key={row.userId}>
                  <td className="px-4 py-2.5 text-zinc-100">{row.name}</td>
                  <td className="px-4 py-2.5 text-right text-zinc-400">{row.count}</td>
                  <td className="px-4 py-2.5 text-right text-zinc-100">{formatCurrency(row.revenue)}</td>
                </tr>
              ))}
              {!isLoading && !stats?.byEmployee?.length && (
                <tr><td colSpan={3} className="px-4 py-4 text-center text-zinc-600">Sem dados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

---

## ETAPA 10 — Frontend: Dashboard do Funcionário

**`frontend/src/app/(dashboard)/dashboard/page.tsx`** — detectar EMPLOYEE e mostrar apenas seus dados:

```tsx
const { user } = useAuthStore();
const isEmployee = user?.role === 'EMPLOYEE';

// Se EMPLOYEE, buscar apenas as próprias stats
const { data: myStats } = useSessionsStats(
  isEmployee ? { userId: user.id, ...currentMonthDates } : { skipAll: true }
);
```

O EMPLOYEE vê:
- Cards com suas próprias sessões/receita gerada (via `GET /sessions/stats?userId={user.id}`)
- Tabela de suas sessões recentes (via `GET /sessions` — já filtrado pelo backend para EMPLOYEE)
- **Não** vê botão "Novo Procedimento"

---

## ETAPA 11 — Frontend: Sidebar e Proteção de Rotas

**`frontend/src/components/layout/sidebar.tsx`** — lógica de exibição:

```tsx
const { user } = useAuthStore();
const isEmployee = user?.role === 'EMPLOYEE';
const isStudio = user?.tenantType === 'STUDIO';

// Itens visíveis a todos (exceto EMPLOYEE em alguns):
const navItems = [
  { href: '/dashboard', label: 'Dashboard', visibleTo: 'all' },
  { href: '/clients', label: 'Clientes', visibleTo: 'owner-staff' },
  { href: '/sessions', label: 'Procedimentos', visibleTo: 'owner-staff' },
  { href: '/financial', label: 'Financeiro', visibleTo: 'owner-staff' },
  { href: '/calculator', label: 'Calculadora', visibleTo: 'owner-staff' },
  { href: '/budget-suggestion', label: 'Sugestão de Orçamento', visibleTo: 'owner-staff' },
  // Studio only:
  { href: '/service-types', label: 'Serviços', visibleTo: 'studio-owner-staff' },
  { href: '/employees', label: 'Funcionários', visibleTo: 'studio-owner-staff' },
  { href: '/performance', label: 'Desempenho', visibleTo: 'studio-owner-staff' },
];

// Filtragem:
const filteredItems = navItems.filter(item => {
  if (item.visibleTo === 'all') return true;
  if (item.visibleTo === 'owner-staff') return !isEmployee;
  if (item.visibleTo === 'studio-owner-staff') return isStudio && !isEmployee;
  return true;
});
```

**Proteção de rota nas páginas** (exemplo para `/employees/page.tsx`):
```tsx
const { user } = useAuthStore();
const router = useRouter();

useEffect(() => {
  if (user && (user.role === 'EMPLOYEE' || user.tenantType !== 'STUDIO')) {
    router.replace('/dashboard');
  }
}, [user, router]);
```

---

## Resumo de Arquivos

### Backend — Modificar
| Arquivo | O que muda |
|---------|-----------|
| `backend/src/auth/dto/auth-response.dto.ts` | Adicionar `tenantType` |
| `backend/src/auth/auth.service.ts` | Incluir tenant no login/verifyEmail/loginWithGoogle/validateToken |
| `backend/src/sessions/sessions.service.ts` | Adicionar `getStats()` |
| `backend/src/sessions/sessions.controller.ts` | Adicionar `GET /sessions/stats` |
| `backend/src/app.module.ts` | Registrar `EmployeesModule` |

### Backend — Criar
| Arquivo | O que é |
|---------|---------|
| `backend/src/employees/employees.module.ts` | Módulo |
| `backend/src/employees/employees.controller.ts` | Controller |
| `backend/src/employees/employees.service.ts` | Service |
| `backend/src/employees/dto/create-employee.dto.ts` | DTO |
| `backend/src/employees/dto/update-employee.dto.ts` | DTO |

### Frontend — Modificar
| Arquivo | O que muda |
|---------|-----------|
| `frontend/src/types/auth.types.ts` | Adicionar `tenantType` ao `User` |
| `frontend/src/components/modals/session-modal.tsx` | Adicionar select de profissional |
| `frontend/src/components/layout/sidebar.tsx` | Navegação condicional por role/tenantType |

### Frontend — Criar
| Arquivo | O que é |
|---------|---------|
| `frontend/src/types/employee.types.ts` | Tipos |
| `frontend/src/services/employees.service.ts` | Service |
| `frontend/src/hooks/use-employees.ts` | Hook |
| `frontend/src/services/sessions-stats.service.ts` | Service |
| `frontend/src/hooks/use-sessions-stats.ts` | Hook |
| `frontend/src/app/(dashboard)/service-types/page.tsx` | Página |
| `frontend/src/app/(dashboard)/employees/page.tsx` | Página |
| `frontend/src/app/(dashboard)/performance/page.tsx` | Página |
| `frontend/src/components/modals/employee-modal.tsx` | Modal |
