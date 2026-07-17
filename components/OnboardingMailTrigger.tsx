"use client";

import { useEffect, useRef } from "react";

/**
 * Triggert Onboarding-Mails (Tag 1/3/7) einmal pro Seitenladen im Hintergrund.
 * Keine UI – nur Autopilot.
 */
export default function OnboardingMailTrigger() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    fetch("/api/marketing/onboarding", {
      method: "POST",
      credentials: "include",
    }).catch(() => {
      // still – kein Toast, kein Blockieren
    });
  }, []);

  return null;
}
