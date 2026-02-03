import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { MlService } from './ml.service';
import { PredictDto } from './dto/predict.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@Controller('ml')
@UseGuards(AuthGuard, RolesGuard)
export class MlController {
  constructor(private readonly mlService: MlService) {}

  @Post('predict')
  @Roles('OWNER', 'STAFF', 'EMPLOYEE')
  predict(
    @CurrentTenant() tenantId: string,
    @Req() req: any,
    @Body() dto: PredictDto,
  ) {
    return this.mlService.predict(tenantId, req.user.id, dto);
  }
}