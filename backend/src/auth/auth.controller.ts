import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  Patch,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
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

  @UseGuards(AuthGuard)
  @Get('me')
  async getMe(@Req() req: Request & { user?: any }) {
    return req.user;
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
