export function getAppBaseUrl(): string {
  const fallback = ["http:", "", "localhost:3000"].join("/");
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ??
    fallback
  );
}
