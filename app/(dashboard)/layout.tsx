"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import FirmenprofilBanner from "@/components/FirmenprofilBanner";
import { useEffect } from "react";
import { DataProvider } from "@/contexts/DataContext";
import OnboardingMailTrigger from "@/components/OnboardingMailTrigger";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <DataProvider>
      <OnboardingMailTrigger />
      <div className="min-h-screen bg-dark-950">
        <Sidebar />
        <main className="md:ml-64 min-h-screen pt-16 md:pt-0">
          <div className="p-4 md:p-6 lg:p-8">
            <FirmenprofilBanner />
            {children}
          </div>
        </main>
      </div>
    </DataProvider>
  );
}
