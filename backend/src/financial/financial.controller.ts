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
import { FinancialService } from './financial.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TransactionType } from '@prisma/client';

@Controller('financial')
@UseGuards(AuthGuard, RolesGuard)
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Post()
  @Roles('OWNER', 'STAFF')
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateTransactionDto) {
    return this.financialService.create(tenantId, dto);
  }

  @Get()
  @Roles('OWNER', 'STAFF', 'EMPLOYEE')
  findAll(
    @CurrentTenant() tenantId: string,
    @Req() req: any,
    @Query('type') type?: TransactionType,
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financialService.findAll(tenantId, req.user.id, req.user.role, {
      type,
      category,
      startDate,
      endDate,
    });
  }

  @Get('summary')
  @Roles('OWNER', 'STAFF', 'EMPLOYEE')
  getSummary(@CurrentTenant() tenantId: string, @Req() req: any) {
    return this.financialService.getSummary(
      tenantId,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':id')
  @Roles('OWNER', 'STAFF', 'EMPLOYEE')
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.financialService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles('OWNER', 'STAFF')
  update(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.financialService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @Roles('OWNER', 'STAFF')
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.financialService.remove(id, tenantId);
  }
}