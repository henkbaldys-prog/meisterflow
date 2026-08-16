/**
 * Fokus-Modus: Nur Sprache-Angebot, Foto-Angebot, GoBD-Rechnung.
 * Features werden ausgeblendet, Code bleibt erhalten.
 */
export const FOCUS_MODE = true;

export const SHOW = {
  sidebarRechnungen: !FOCUS_MODE,
  sidebarTermine: !FOCUS_MODE,
  sidebarTeam: !FOCUS_MODE,
  sidebarMarketing: !FOCUS_MODE,
  dashboardVerlust: !FOCUS_MODE,
  dashboardUmsatz: !FOCUS_MODE,
  dashboardFollowUps: !FOCUS_MODE,
  dashboardMahnungen: !FOCUS_MODE,
  dashboardWebsiteAnfragen: !FOCUS_MODE,
  dashboardKollegen: !FOCUS_MODE,
  dashboardKiTipp: !FOCUS_MODE,
  pricingOnLanding: !FOCUS_MODE,
  websiteBuilder: !FOCUS_MODE,
} as const;
