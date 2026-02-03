import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CalculatorService } from './calculator.service';
import { CreateCostDto } from './dto/create-cost.dto';
import { UpdateCostDto } from './dto/update-cost.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@Controller('calculator')
@UseGuards(AuthGuard, RolesGuard)
export class CalculatorController {
  constructor(private readonly calculatorService: CalculatorService) {}

  @Post('costs')
  @Roles('OWNER', 'STAFF')
  addCost(@CurrentTenant() tenantId: string, @Body() dto: CreateCostDto) {
    return this.calculatorService.addCost(tenantId, dto);
  }

  @Delete('costs/:id')
  @Roles('OWNER', 'STAFF')
  removeCost(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Query('type') type: 'fixed' | 'variable',
  ) {
    return this.calculatorService.removeCost(id, tenantId, type);
  }

  @Patch('costs/:id')
  @Roles('OWNER', 'STAFF')
  updateCost(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Query('type') type: 'fixed' | 'variable',
    @Body() dto: UpdateCostDto,
  ) {
    return this.calculatorService.updateCost(id, tenantId, type, dto);
  }

  @Post('settings')
  @Roles('OWNER', 'STAFF')
  setWorkSettings(
    @CurrentTenant() tenantId: string,
    @Body() body: { hoursPerMonth: number; profitMargin: number },
  ) {
    return this.calculatorService.setWorkSettings(
      tenantId,
      body.hoursPerMonth,
      body.profitMargin,
    );
  }

  @Get()
  @Roles('OWNER', 'STAFF', 'EMPLOYEE')
  calculate(@CurrentTenant() tenantId: string) {
    return this.calculatorService.calculate(tenantId);
  }
}