import { cookies } from "next/headers";
import { defaultLocale, localeCookieName, supportedLocales } from "./config";

export async function getAdminLocale() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(localeCookieName)?.value;

  if (supportedLocales.includes(raw as any)) {
    return raw as "vi" | "en";
  }

  return defaultLocale;
}
