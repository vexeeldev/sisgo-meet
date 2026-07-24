// page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

import { Suspense } from "react";

import SISGOResetPasswordForm from "./SISGOSectionForgotPassword/SISGOResetPasswordForm";
import SISGOforgotPasswordForm from "./SISGOSectionForgotPassword/SISGOForgotPasswordForm";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();

  const [stage, setStage] = useState<"email" | "reset">("email");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      setStage("reset");
    }
  }, [searchParams]);

  const handleEmailSent = (email: string) => {
    setUserEmail(email);
    setStage("reset");
  };

  return (
    <>
      {stage === "email" && <SISGOforgotPasswordForm onEmailSent={handleEmailSent} />}
      {stage === "reset" && <SISGOResetPasswordForm email={userEmail} />}
    </>
  );
}

export default function SISGOForgotPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}