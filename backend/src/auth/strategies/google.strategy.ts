import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');

    // Se não houver credenciais, usar valores placeholder que não serão usados
    // As rotas do Google OAuth retornarão erro se não estiverem configuradas
    super({
      clientID: clientID || 'not-configured',
      clientSecret: clientSecret || 'not-configured',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || '/auth/google/callback',
      scope: ['email', 'profile'],
    });

    if (!clientID || !clientSecret) {
      console.warn('[GoogleStrategy] Google OAuth não configurado. Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env para habilitar.');
    }
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const { emails, displayName, id } = profile;

    const user = {
      providerAccountId: id,
      email: emails[0].value,
      name: displayName,
    };

    done(null, user);
  }
}
