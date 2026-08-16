"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import FirmenprofilBanner from "@/components/FirmenprofilBanner";
import { useEffect } from "react";
import { DataProvider } from "@/contexts/DataContext";
import OnboardingMailTrigger from "@/components/OnboardingMailTrigger";
import OnboardingGate from "@/components/OnboardingGate";
import AngebotFAB from "@/components/AngebotFAB";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center">
        <div className="spinner" aria-label="Laden" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <DataProvider>
      <OnboardingMailTrigger />
      <OnboardingGate />
      <div className="app-shell min-h-screen">
        <Sidebar />
        <main className="min-h-screen pt-16 md:ml-[240px] md:pt-0">
          <div className="page-enter mx-auto max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
            <FirmenprofilBanner />
            {children}
          </div>
        </main>
        <AngebotFAB />
      </div>
    </DataProvider>
  );
}
