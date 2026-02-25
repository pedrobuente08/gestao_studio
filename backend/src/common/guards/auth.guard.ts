import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { auth } from '../../config/better-auth.config';
import { fromNodeHeaders } from 'better-auth/node';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session?.user) {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        tenant: {
          select: {
            type: true,
            name: true,
            cnpj: true,
            address: true,
            zipCode: true,
            instagram: true,
            phone: true,
          },
        },
      },
    });

    if (!user || (!['ACTIVE', 'PENDING_SETUP'].includes(user.status))) {
      throw new UnauthorizedException('Usuário inativo ou não encontrado');
    }

    const studio =
      user.tenant?.type === 'STUDIO'
        ? {
            name: user.tenant.name,
            cnpj: user.tenant.cnpj,
            address: user.tenant.address,
            zipCode: user.tenant.zipCode,
            instagram: user.tenant.instagram,
            phone: user.tenant.phone,
          }
        : undefined;

    request.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      tenantType: user.tenant?.type,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
      profilePhotoUrl: user.profilePhotoUrl,
      birthDate: user.birthDate?.toISOString(),
      gender: user.gender,
      instagram: user.instagram,
      phone: user.phone,
      studio,
    };

    return true;
  }
}
