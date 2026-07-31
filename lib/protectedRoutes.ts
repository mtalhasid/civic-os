export const PUBLIC_ROUTES = [
  "/report/quick",
  "/report/qr",
] as const;

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/reports/new",
  "/notifications",
  "/profile",
] as const;

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function isProtectedRoute(pathname: string): boolean {
  if (isPublicRoute(pathname)) return false;
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}
