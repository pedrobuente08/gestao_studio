import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProceduresService } from './procedures.service';
import { CreateProcedureDto } from './dto/create-procedure.dto';
import { UpdateProcedureDto } from './dto/update-procedure.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@Controller('procedures')
@UseGuards(AuthGuard, RolesGuard)
export class ProceduresController {
  constructor(private readonly proceduresService: ProceduresService) {}

  @Post()
  @Roles('OWNER', 'STAFF')
  create(
    @CurrentTenant() tenantId: string,
    @Req() req: any,
    @Body() dto: CreateProcedureDto,
  ) {
    return this.proceduresService.create(tenantId, req.user.id, dto);
  }

  @Get()
  @Roles('OWNER', 'STAFF', 'EMPLOYEE')
  findAll(@CurrentTenant() tenantId: string, @Req() req: any) {
    return this.proceduresService.findAll(
      tenantId,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':id')
  @Roles('OWNER', 'STAFF', 'EMPLOYEE')
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.proceduresService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles('OWNER', 'STAFF')
  update(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateProcedureDto,
  ) {
    return this.proceduresService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @Roles('OWNER', 'STAFF')
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.proceduresService.remove(id, tenantId);
  }
}