import { Injectable, Inject, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import {
  IDismissibleLifecycleHook,
  IHookResult,
  IBatchHookResult,
} from '@dismissible/nestjs-hooks';
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
    this.logger.debug('onBeforeRequest', {
      itemId,
      userId,
      requestId: context?.requestId,
    });
    return this.validateJwtToken(userId, context);
  }

  /**
   * Validates the JWT bearer token from the Authorization header for batch requests.
   * Runs before any batch dismissible operation.
   */
  async onBeforeBatchRequest(
    itemIds: string[],
    userId: string,
    context?: IRequestContext,
  ): Promise<IBatchHookResult> {
    this.logger.debug('onBeforeBatchRequest', {
      itemIds,
      userId,
      requestId: context?.requestId,
    });
    return this.validateJwtToken(userId, context);
  }

  /**
   * Core JWT validation logic shared by both single and batch request handlers.
   */
  private async validateJwtToken(
    userId: string,
    context: IRequestContext | undefined,
  ): Promise<IHookResult | IBatchHookResult> {
    if (!this.config.enabled) {
      return { proceed: true };
    }

    this.logger.debug('validating JWT token', {
      config: this.config,
    });

    const authorizationHeader = context?.headers['authorization'];
    const token = this.jwtAuthService.extractBearerToken(authorizationHeader);

    if (!token) {
      this.logger.debug('No bearer token provided', {
        userId,
        requestId: context?.requestId,
      });

      throw new UnauthorizedException('Missing or invalid bearer token');
    }

    const result = await this.jwtAuthService.validateToken(token);

    if (!result.valid) {
      this.logger.debug('Token validation failed', {
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
        this.logger.debug('User ID mismatch', {
          userId,
          requestId: context?.requestId,
          tokenSubject: tokenUserId,
        });

        throw new ForbiddenException('User ID in request does not match authenticated user');
      }
    }

    this.logger.debug('Token validated successfully', {
      userId,
      requestId: context?.requestId,
      subject: tokenUserId,
    });

    return { proceed: true };
  }

  /**
   * Matches the token user ID against the request user ID based on the configured match type.
   */
  private matchUserIdValue(tokenUserId: string, userId: string): boolean {
    const matchType = this.config.userIdMatchType ?? UserIdMatchType.EXACT;

    switch (matchType) {
      case UserIdMatchType.EXACT: {
        this.logger.debug('matching user ID value via exact value', {
          tokenUserId,
          userId,
          matchType,
        });
        return tokenUserId === userId;
      }
      case UserIdMatchType.SUBSTRING: {
        const result = tokenUserId.includes(userId) || userId.includes(tokenUserId);
        this.logger.debug('matching user ID value via substring', {
          tokenUserId,
          userId,
          matchType,
          result,
        });
        return result;
      }
      case UserIdMatchType.REGEX: {
        const regex = new RegExp(this.config.userIdMatchRegex as string);
        const match = regex.exec(tokenUserId);

        if (!match) {
          this.logger.debug('regex did not match token user ID', {
            tokenUserId,
            userId,
            matchType,
            pattern: this.config.userIdMatchRegex,
          });
          return false;
        }

        // Use first capture group if present, otherwise use full match
        const extractedUserId = match[1] ?? match[0];
        const result = extractedUserId === userId;

        this.logger.debug('matching user ID value via regex', {
          tokenUserId,
          userId,
          extractedUserId,
          matchType,
          result,
        });
        return result;
      }
    }
  }
}
