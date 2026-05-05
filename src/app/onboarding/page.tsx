"use client";

import { useEffect } from "react";
import Onboarding from "@/components/ui/Onboarding";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OnboardingPage() {
  const router = useRouter();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) { router.push("/"); }
  }, [done, router]);

  if (done) return null;

  return (
    <Onboarding
      onComplete={() => {
        setDone(true);
      }}
    />
  );
}
