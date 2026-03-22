"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/lib/auth-store";
import { useLanguageStore } from "@/lib/language-store";
import { REGIONS } from "@/lib/regions";
import type { RegionId, LangCode } from "@/lib/region-types";
import { t } from "@/lib/translations";
import { OrganizerMap } from "@/components/OrganizerMap";
import { LogIn } from "lucide-react";

function DashboardContent() {
  const { role, loginAsOrganizer } = useAuthStore();
  const { lang, region: storeRegion, setLang, setRegion } = useLanguageStore();
  const searchParams = useSearchParams();
  const regionParam = searchParams.get("region") as RegionId | null;
  const langParam = searchParams.get("lang") as LangCode | null;

  const region: RegionId =
    regionParam && REGIONS[regionParam] ? regionParam : storeRegion;
  const regionConfig = REGIONS[region];
  const langResolved: LangCode =
    langParam && regionConfig.languages.includes(langParam) ? langParam : lang;

  useEffect(() => {
    if (regionParam && REGIONS[regionParam as RegionId]) {
      setRegion(regionParam as RegionId);
    }
    if (langParam && regionConfig.languages.includes(langParam as LangCode)) {
      setLang(langParam as LangCode);
    }
  }, [regionParam, langParam, regionConfig.languages, setRegion, setLang]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" aria-hidden />
        <span className="sr-only">{t(langResolved, "loading")}</span>
      </div>
    );
  }

  if (role !== "organizer") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{t(langResolved, "organizerLoginTitle")}</CardTitle>
            <CardDescription>
              {t(langResolved, "organizerLoginDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Button onClick={loginAsOrganizer} size="lg" className="gap-2 w-full sm:w-auto">
              <LogIn className="h-4 w-4" />
              {t(langResolved, "loginAsOrganizer")}
            </Button>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              {t(langResolved, "backToHome")}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <OrganizerMap region={region} lang={langResolved} />;
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-muted/30">
          <div className="h-8 w-8 animate-pulse rounded-full bg-muted" aria-hidden />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
