import { Injectable, Inject, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { IDismissibleLifecycleHook, IHookResult } from '@dismissible/nestjs-hooks';
import { IRequestContext } from '@dismissible/nestjs-request';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';
import { JwtAuthService } from './jwt-auth.service';
import {
  DISMISSIBLE_JWT_AUTH_HOOK_CONFIG,
  JwtAuthHookConfig,
  UserIdMatchType,
} from './jwt-auth-hook.config';

/**
 * JWT authentication hook that validates bearer tokens on every request.
 * This hook runs during the pre-request phase and rejects unauthorized requests.
 */
@Injectable()
export class JwtAuthHook implements IDismissibleLifecycleHook {
  readonly priority: number;

  constructor(
    private readonly jwtAuthService: JwtAuthService,
    @Inject(DISMISSIBLE_JWT_AUTH_HOOK_CONFIG)
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

    const matchUserId = this.config.matchUserId ?? true;
    const userIdClaim = this.config.userIdClaim ?? 'sub';
    const tokenUserId = result.payload?.[userIdClaim] as string | undefined;
    if (matchUserId && tokenUserId) {
      if (!this.matchUserIdValue(tokenUserId, userId)) {
        this.logger.debug('JWT auth hook: User ID mismatch', {
          itemId,
          userId,
          requestId: context?.requestId,
          tokenSubject: tokenUserId,
        });

        throw new ForbiddenException('User ID in request does not match authenticated user');
      }
    }

    this.logger.debug('JWT auth hook: Token validated successfully', {
      itemId,
      userId,
      requestId: context?.requestId,
      subject: tokenUserId,
    });

    return {
      proceed: true,
    };
  }

  /**
   * Matches the token user ID against the request user ID based on the configured match type.
   */
  private matchUserIdValue(tokenUserId: string, userId: string): boolean {
    const matchType = this.config.userIdMatchType ?? UserIdMatchType.EXACT;

    switch (matchType) {
      case UserIdMatchType.EXACT:
        return tokenUserId === userId;
      case UserIdMatchType.SUBSTRING:
        return tokenUserId.includes(userId) || userId.includes(tokenUserId);
      case UserIdMatchType.REGEX: {
        const regex = new RegExp(this.config.userIdMatchRegex as string);
        return regex.test(tokenUserId);
      }
    }
  }
}
