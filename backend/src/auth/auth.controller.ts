import { Controller, Post, Get, Body, Req, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('google')
  googleAuth() {
    // Redireciona para a URL de auth do Google gerada pelo Better-Auth
    return { url: 'http://localhost:3000/api/auth/sign-in/google' };
  }

  @Get('google/callback')
  async googleCallback(@Req() req: Request & { user?: any }) {
    // Better-Auth já processa o callback
    // Aqui você extrai os dados e chama loginWithGoogle
    const googleUser = req.user; // Better-Auth injeta isso
    return this.authService.loginWithGoogle(googleUser);
  }

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
}
