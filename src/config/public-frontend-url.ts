import { InternalServerErrorException } from '@nestjs/common';

function stripTrailingSlash(value: string) {
  return value.replace(/\/$/, '');
}

export function resolvePublicFrontendBaseUrl(
  nodeEnv = process.env.NODE_ENV,
): string {
  const explicitBase =
    process.env.FRONTEND_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (explicitBase) {
    return stripTrailingSlash(explicitBase);
  }

  if (nodeEnv !== 'production') {
    return 'http://localhost:3000';
  }

  throw new InternalServerErrorException(
    'FRONTEND_BASE_URL is not configured for production.',
  );
}

export function buildCredentialVerifyUrl(
  qrToken: string,
  nodeEnv = process.env.NODE_ENV,
): string {
  return `${resolvePublicFrontendBaseUrl(nodeEnv)}/verify/credential/${encodeURIComponent(qrToken)}`;
}
