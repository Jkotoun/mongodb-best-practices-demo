import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import type { Request } from 'express';

const BYPASS_ENVIRONMENTS = new Set(['local', 'test', 'development']);

@Injectable()
export class GcpOidcGuard implements CanActivate {
  private readonly client = new OAuth2Client();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (BYPASS_ENVIRONMENTS.has(process.env.NODE_ENV ?? 'local')) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : undefined;
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const audience = process.env.OIDC_AUDIENCE;
    if (!audience) {
      throw new UnauthorizedException('OIDC_AUDIENCE is not configured');
    }

    try {
      const ticket = await this.client.verifyIdToken({
        idToken: token,
        audience,
      });
      return !!ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid GCP OIDC token');
    }
  }
}
