import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { JwksClient, SigningKey } from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';
import { firstValueFrom } from 'rxjs';
import { JWT_AUTH_HOOK_CONFIG, JwtAuthHookConfig } from './jwt-auth-hook.config';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';

/**
 * Decoded JWT payload.
 */
export interface IJwtPayload {
  sub?: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

/**
 * Result of JWT validation.
 */
export interface IJwtValidationResult {
  valid: boolean;
  payload?: IJwtPayload;
  error?: string;
}

/**
 * Service responsible for JWT validation using JWKS.
 */
@Injectable()
export class JwtAuthService implements OnModuleInit {
  private jwksClient: JwksClient | null = null;
  private jwksUri: string | null = null;

  constructor(
    private readonly httpService: HttpService,
    @Inject(JWT_AUTH_HOOK_CONFIG)
    private readonly config: JwtAuthHookConfig,
    @Inject(DISMISSIBLE_LOGGER)
    private readonly logger: IDismissibleLogger,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.config.enabled) {
      await this.initializeJwksClient();
    }
  }

  /**
   * Initialize the JWKS client by fetching the well-known configuration.
   */
  async initializeJwksClient(): Promise<void> {
    try {
      this.logger.debug('Fetching OpenID configuration', {
        wellKnownUrl: this.config.wellKnownUrl,
      });

      const response = await firstValueFrom(
        this.httpService.get<{ jwks_uri?: string }>(this.config.wellKnownUrl, {
          timeout: this.config.requestTimeout ?? 30000,
        }),
      );

      const openIdConfig = response.data;

      if (!openIdConfig.jwks_uri) {
        throw new Error('No jwks_uri found in OpenID configuration');
      }

      this.jwksUri = openIdConfig.jwks_uri;

      this.jwksClient = new JwksClient({
        jwksUri: this.jwksUri,
        cache: true,
        cacheMaxAge: this.config.jwksCacheDuration ?? 600000,
        timeout: this.config.requestTimeout ?? 30000,
      });

      this.logger.info('JWKS client initialized successfully', {
        jwksUri: this.jwksUri,
      });
    } catch (error) {
      this.logger.error(
        'Failed to initialize JWKS client',
        error instanceof Error ? error : new Error(String(error)),
        { wellKnownUrl: this.config.wellKnownUrl },
      );
      throw error;
    }
  }

  /**
   * Extract the bearer token from the Authorization header.
   */
  extractBearerToken(authorizationHeader: string | undefined): string | null {
    if (!authorizationHeader) {
      return null;
    }

    const parts = authorizationHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Validate a JWT token.
   */
  async validateToken(token: string): Promise<IJwtValidationResult> {
    if (!this.jwksClient) {
      return {
        valid: false,
        error: 'JWKS client not initialized',
      };
    }

    try {
      const decoded = jwt.decode(token, { complete: true });

      if (!decoded || typeof decoded === 'string') {
        return {
          valid: false,
          error: 'Invalid token format',
        };
      }

      const kid = decoded.header.kid;
      if (!kid) {
        return {
          valid: false,
          error: 'Token missing key ID (kid)',
        };
      }

      let signingKey: SigningKey;
      try {
        signingKey = await this.jwksClient.getSigningKey(kid);
      } catch {
        return {
          valid: false,
          error: 'Unable to find signing key',
        };
      }

      const publicKey = signingKey.getPublicKey();

      const verifyOptions: jwt.VerifyOptions = {
        algorithms: (this.config.algorithms as jwt.Algorithm[]) ?? ['RS256'],
      };

      if (this.config.issuer && this.config.issuer.length > 0) {
        verifyOptions.issuer =
          this.config.issuer.length === 1
            ? this.config.issuer[0]
            : (this.config.issuer as [string, ...string[]]);
      }

      if (this.config.audience) {
        verifyOptions.audience = this.config.audience;
      }

      const payload = jwt.verify(token, publicKey, verifyOptions) as IJwtPayload;

      return {
        valid: true,
        payload,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.debug('Token validation failed', {
        error: errorMessage,
      });

      return {
        valid: false,
        error: errorMessage,
      };
    }
  }
}
