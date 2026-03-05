"use client";

import dynamic from "next/dynamic";

const WizardForm = dynamic(() => import("@/components/WizardForm").then(mod => mod.WizardForm), {
  ssr: false
});

export default function WizardPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-4">
      <WizardForm />
    </div>
  );
}
