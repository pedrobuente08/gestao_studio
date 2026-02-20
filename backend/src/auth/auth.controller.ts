import { Controller, Post, Get, Body, Req, UseGuards, Request, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  RequestPasswordResetDto,
  ValidateResetTokenDto,
  ResetPasswordDto,
} from './dto/reset-password.dto';
import { VerifyEmailDto, ResendVerificationDto } from './dto/verify-email.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly storageService: StorageService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ── Verificação de Email ──────────────────────────────────────────────────

  @Post('email/verify')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('email/resend')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(dto.email);
  }

  // ── Recuperação de Senha ──────────────────────────────────────────────────

  @Post('password/request')
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('password/validate')
  validateResetToken(@Body() dto: ValidateResetTokenDto) {
    return this.authService.validateResetToken(dto.token);
  }

  @Post('password/reset')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  // ── OAuth Google ──────────────────────────────────────────────────────────

  @Get('google')
  googleAuth() {
    return { url: 'http://localhost:3000/api/auth/sign-in/google' };
  }

  @Get('google/callback')
  async googleCallback(@Req() req: Request & { user?: any }) {
    const googleUser = req.user;
    return this.authService.loginWithGoogle(googleUser);
  }

  // ── Sessão ────────────────────────────────────────────────────────────────

  @UseGuards(AuthGuard)
  @Get('me')
  async getMe(@Req() req: Request & { user?: any }) {
    return req.user;
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(@Req() req: Request & { headers: { authorization?: string } }) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || '';
    return this.authService.logout(token);
  }

  @UseGuards(AuthGuard)
  @Patch('me')
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  @UseGuards(AuthGuard)
  @Patch('me/password')
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, dto);
  }

  @UseGuards(AuthGuard)
  @Post('me/photo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    const fileName = `avatars/${req.user.id}-${Date.now()}`;
    const url = await this.storageService.uploadFile(file, fileName);
    return this.authService.updateProfile(req.user.id, { profilePhotoUrl: url });
  }
}
