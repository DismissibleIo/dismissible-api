import { Injectable, Inject, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { IDismissibleLifecycleHook, IHookResult } from '@dismissible/nestjs-hooks';
import { IRequestContext } from '@dismissible/nestjs-request';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';
import { JwtAuthService } from './jwt-auth.service';
import { JWT_AUTH_HOOK_CONFIG, JwtAuthHookConfig } from './jwt-auth-hook.config';

/**
 * JWT authentication hook that validates bearer tokens on every request.
 * This hook runs during the pre-request phase and rejects unauthorized requests.
 */
@Injectable()
export class JwtAuthHook implements IDismissibleLifecycleHook {
  readonly priority: number;

  constructor(
    private readonly jwtAuthService: JwtAuthService,
    @Inject(JWT_AUTH_HOOK_CONFIG)
    private readonly config: JwtAuthHookConfig,
    @Inject(DISMISSIBLE_LOGGER)
    private readonly logger: IDismissibleLogger,
  ) {
    this.priority = config.priority ?? -100;
  }

  /**
   * Validates the JWT bearer token from the Authorization header.
   * Runs before any dismissible operation.
   */
  async onBeforeRequest(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> {
    if (!this.config.enabled) {
      return { proceed: true };
    }

    const authorizationHeader = context?.headers['authorization'];

    const token = this.jwtAuthService.extractBearerToken(authorizationHeader);

    if (!token) {
      this.logger.debug('JWT auth hook: No bearer token provided', {
        itemId,
        userId,
        requestId: context?.requestId,
      });

      throw new UnauthorizedException('Missing or invalid bearer token');
    }

    const result = await this.jwtAuthService.validateToken(token);

    if (!result.valid) {
      this.logger.debug('JWT auth hook: Token validation failed', {
        itemId,
        userId,
        requestId: context?.requestId,
        error: result.error,
      });

      throw new UnauthorizedException(result.error);
    }

    const verifyUserIdMatch = this.config.verifyUserIdMatch ?? true;
    if (verifyUserIdMatch && result.payload?.sub) {
      if (result.payload.sub !== userId) {
        this.logger.debug('JWT auth hook: User ID mismatch', {
          itemId,
          userId,
          requestId: context?.requestId,
          tokenSubject: result.payload.sub,
        });

        throw new ForbiddenException('User ID in request does not match authenticated user');
      }
    }

    this.logger.debug('JWT auth hook: Token validated successfully', {
      itemId,
      userId,
      requestId: context?.requestId,
      subject: result.payload?.sub,
    });

    return {
      proceed: true,
    };
  }
}
