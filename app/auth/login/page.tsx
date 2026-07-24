"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation"; 
import EmailStage from "./EmailStage";
import PasswordStage from "./PasswordStage";
import SISGOleftbarLogReg from "@/components/navbar/SISGOleftbarLogRight";
import { api } from "@/lib/api-new";
import SISGOEmailNotFoundModal from "./SISGOEmailNotFoundModal";

type Stage = "email" | "password";

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 24 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -24 }),
};

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

import { Suspense } from "react";

function SISGOLoginPageContent() {
  const [stage, setStage] = useState<Stage>("email");
  const [direction, setDirection] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showEmailNotFoundModal, setShowEmailNotFoundModal] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const savedEmail = localStorage.getItem("email");
    if (savedEmail) {
      setEmail(savedEmail);
      localStorage.removeItem("email");
    }
    
    // Check if user is already logged in
    const token = localStorage.getItem("token");
    if (token) {
      const sessionRedirect = sessionStorage.getItem('redirectAfterLogin');
      if (sessionRedirect) {
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(sessionRedirect);
      } else {
        const params = new URLSearchParams(window.location.search);
        const queryRedirect = params.get('redirect');
        router.push(queryRedirect || "/dashboard");
      }
    }
  }, [router]);

  useEffect(() => {
    localStorage.setItem("email", email);
  }, [email]);

  // Handle Google login callback
  useEffect(() => {
    const handleGoogleCallback = () => {
      const token = searchParams.get('token');
      const login = searchParams.get('login');
      const redirectParam = searchParams.get('redirect');

      if (login === 'success' && token) {
        localStorage.setItem('token', token);
        
        let redirectUrl = '/dashboard';
        
        if (redirectParam) {
          redirectUrl = redirectParam;
        } else {
          const sessionRedirect = sessionStorage.getItem('redirectAfterLogin');
          if (sessionRedirect) {
            redirectUrl = sessionRedirect;
          }
        }
        
        sessionStorage.removeItem('redirectAfterLogin');
        window.history.replaceState({}, document.title, window.location.pathname);
        window.location.href = redirectUrl;
      } else if (login === 'failed') {
        console.error('🔴 Google Login Failed');
        setError('Login with Google failed');
      }
    };

    handleGoogleCallback();
  }, [searchParams]); 

  const getRedirectUrl = () => {
    const sessionRedirect = sessionStorage.getItem('redirectAfterLogin');
    if (sessionRedirect) {
      sessionStorage.removeItem('redirectAfterLogin');
      return sessionRedirect;
    }

    const params = new URLSearchParams(window.location.search);
    const queryRedirect = params.get('redirect');
    if (queryRedirect) {
      return queryRedirect;
    }

    return '/dashboard';
  };

  function goTo(next: Stage, dir = 1) {
    setDirection(dir);
    setError("");
    setStage(next);
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Masukkan alamat email yang valid.");
      return;
    }
    
    const result = await api.checkEmail(email);
    
    if (!result.success) {
      // Tampilkan modal, bukan error biasa
      setShowEmailNotFoundModal(true);
      return;
    }
    
    setError("");
    goTo("password");
  }

  // Handler untuk modal
  const handleGantiEmail = () => {
    setShowEmailNotFoundModal(false);
    // Fokus ke input email
    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
    if (emailInput) {
      setTimeout(() => emailInput.focus(), 100);
    }
  };

  const handleDaftar = () => {
    setShowEmailNotFoundModal(false);
    // Navigasi ke halaman daftar dengan email yang sudah diisi
    router.push(`/auth/register`);
  };

  async function SISGOhandlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!password) {
      setError("Masukkan password kamu.");
      return;
    }

    setLoading(true);
    try {
      const result = await api.login(email, password);

      if (!result.success) {
        setError(result.message || "password salah.");
        setLoading(false);
        return;
      }

      const token = result.data.token;
      const userData = result.data.user;

      if (userData?.uuid) {
        localStorage.setItem("userUuid", userData.uuid);
      }

      const redirectUrl = getRedirectUrl();
      router.push(redirectUrl);
      setLoading(false); 
      
    } catch (error) {
      console.error(error);
      setLoading(false);
      setError("Terjadi kesalahan saat login.");
    }
  }



  return (
    <>
      <div className="min-h-screen flex" style={{ backgroundColor: "#f5f3f0" }}>
        <SISGOleftbarLogReg />
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white">
          <div className="w-full max-w-sm">
            <AnimatePresence mode="wait" custom={direction}>
              {stage === "email" && (
                <EmailStage
                  direction={direction}
                  slideVariants={slideVariants}
                  ease={ease}
                  email={email}
                  error={error}
                  loading={loading}
                  setEmail={setEmail}
                  setError={setError}
                  handleEmailSubmit={handleEmailSubmit}
                />
              )}

              {stage === "password" && (
                <PasswordStage
                  direction={direction}
                  slideVariants={slideVariants}
                  ease={ease}
                  email={email}
                  password={password}
                  showPw={showPw}
                  error={error}
                  loading={loading}
                  setPassword={setPassword}
                  setShowPw={setShowPw}
                  setError={setError}
                  handlePasswordSubmit={SISGOhandlePasswordSubmit}
                  goTo={goTo}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Email Not Found Modal */}
      <SISGOEmailNotFoundModal
        open={showEmailNotFoundModal}
        email={email}
        onClose={() => setShowEmailNotFoundModal(false)}
        onGantiEmail={handleGantiEmail}
        onDaftar={handleDaftar}
      />
    </>
  );
}

export default function SISGOLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f5f3f0" }}>Loading...</div>}>
      <SISGOLoginPageContent />
    </Suspense>
  );
}