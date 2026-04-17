import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@Controller('clients')
@UseGuards(AuthGuard, RolesGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles('OWNER', 'STAFF')
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateClientDto) {
    return this.clientsService.create(tenantId, dto);
  }

  @Get()
  @Roles('OWNER', 'STAFF', 'EMPLOYEE')
  findAll(
    @CurrentTenant() tenantId: string,
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.clientsService.findAll(
      tenantId,
      req.user.id,
      req.user.role,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id')
  @Roles('OWNER', 'STAFF', 'EMPLOYEE')
  findOne(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Req() req: any,
  ) {
    return this.clientsService.findOne(
      id,
      tenantId,
      req.user.id,
      req.user.role,
    );
  }

  @Patch(':id')
  @Roles('OWNER', 'STAFF', 'EMPLOYEE')
  update(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateClientDto,
    @Req() req: any,
  ) {
    return this.clientsService.update(
      id,
      tenantId,
      dto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':id')
  @Roles('OWNER', 'STAFF')
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.clientsService.remove(id, tenantId);
  }
}