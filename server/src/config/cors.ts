export function isAllowedOrigin(
  origin: string | undefined,
  configuredClientUrl: string,
  isProduction: boolean,
) {
  if (!origin) return true;
  if (origin === configuredClientUrl) return true;

  const isLocalFrontend = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
  return !isProduction && isLocalFrontend;
}
