/** Session-Cookies: mind. 7 Tage, PWA/Homescreen-tauglich */
export const AUTH_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 Tage
};
