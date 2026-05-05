"use client";

import { useState } from "react";
import Onboarding from "@/components/ui/Onboarding";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [done, setDone] = useState(false);

  if (done) { router.push("/"); return null; }

  return (
    <Onboarding
      onComplete={() => {
        setDone(true);
      }}
    />
  );
}
