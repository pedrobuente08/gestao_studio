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
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TattooSize, TattooComplexity, BodyLocation } from '@prisma/client';

@Controller('sessions')
@UseGuards(AuthGuard, RolesGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @Roles('OWNER', 'STAFF')
  create(
    @CurrentTenant() tenantId: string,
    @Req() req: any,
    @Body() dto: CreateSessionDto,
  ) {
    if (!dto.userId) {
      dto.userId = req.user.id;
    }
    return this.sessionsService.create(tenantId, dto);
  }

  @Get('stats')
  @Roles('OWNER', 'STAFF', 'EMPLOYEE')
  getStats(
    @CurrentTenant() tenantId: string,
    @Query('serviceTypeId') serviceTypeId?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.sessionsService.getStats(tenantId, {
      serviceTypeId,
      userId,
      startDate,
      endDate,
    });
  }

  @Get('price-suggestion')
  @Roles('OWNER', 'STAFF', 'EMPLOYEE')
  getPriceSuggestion(
    @CurrentTenant() tenantId: string,
    @Req() req: any,
    @Query('serviceTypeId') serviceTypeId?: string,
    @Query('size') size?: TattooSize,
    @Query('complexity') complexity?: TattooComplexity,
    @Query('bodyLocation') bodyLocation?: BodyLocation,
  ) {
    return this.sessionsService.getPriceSuggestion(
      tenantId,
      req.user.id,
      serviceTypeId,
      size,
      complexity,
      bodyLocation,
    );
  }

  @Get()
  @Roles('OWNER', 'STAFF', 'EMPLOYEE')
  findAll(@CurrentTenant() tenantId: string, @Req() req: any) {
    return this.sessionsService.findAll(tenantId, req.user.id, req.user.role);
  }

  @Get(':id')
  @Roles('OWNER', 'STAFF', 'EMPLOYEE')
  findOne(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Req() req: any,
  ) {
    return this.sessionsService.findOne(
      id,
      tenantId,
      req.user.id,
      req.user.role,
    );
  }

  @Patch(':id')
  @Roles('OWNER', 'STAFF')
  update(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateSessionDto,
  ) {
    return this.sessionsService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @Roles('OWNER', 'STAFF')
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.sessionsService.remove(id, tenantId);
  }
}
