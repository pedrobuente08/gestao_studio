import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
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

  /**
   * Retorna a sugestão de preço via CatBoost para os parâmetros fornecidos.
   * Se o modelo ainda não existir, retorna available:false com motivo.
   */
  @Throttle({ medium: { ttl: 60_000, limit: 20 } })
  @Post('predict')
  @Roles('OWNER', 'STAFF', 'EMPLOYEE')
  predict(@Req() req: any, @Body() dto: PredictDto) {
    return this.mlService.predict(
      req.user.id,
      dto.size,
      dto.complexity,
      dto.bodyLocation,
    );
  }

  /**
   * Retorna o status do modelo do usuário logado:
   * se já tem modelo, quantas sessões tem, se está pronto para treinar.
   */
  @Get('status')
  @Roles('OWNER', 'STAFF', 'EMPLOYEE')
  getStatus(@Req() req: any) {
    return this.mlService.getModelStatus(req.user.id);
  }

  /**
   * Dispara o treino do modelo manualmente.
   * Útil para testar em desenvolvimento sem esperar o cron de domingo.
   */
  @Post('train/manual')
  @Roles('OWNER')
  trainManual(@CurrentTenant() tenantId: string, @Req() req: any) {
    return this.mlService.trainUserModel(req.user.id, tenantId, {
      skipNewDataThreshold: true,
    });
  }
}
