"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { IconSpinner } from "@/components/ui/iconSpinner";
import { Input } from "@/components/ui/input";
import SISGOleftbarLogReg from "@/components/navbar/SISGOleftbarLogRight";
import { api } from "@/lib/api-new";

interface SISGOforgotPasswordFormProps {
  onEmailSent: (email: string) => void;
}

export default function SISGOforgotPasswordForm({ onEmailSent }: SISGOforgotPasswordFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("email");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email is required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const result = await api.otpEmailForgotPassword(email);
      if (result.success === true) {
        setShowModal(true);
      } else {
        setError("Email not found. Please check your email address.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleModalConfirm = () => {
    setShowModal(false);
    onEmailSent(email);
  };

  return (
    <>
      <div className="min-h-screen flex" style={{ backgroundColor: "#f5f3f0" }}>
        <SISGOleftbarLogReg />
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white">
          <div className="w-full max-w-sm">
            <motion.div
              key="forgot-password"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="text-2xl font-semibold mb-1" style={{ color: "#1e1b18" }}>
                Forgot Password
              </h1>
              <p className="text-sm mb-8" style={{ color: "#9a9188" }}>
                Enter your email address and we'll send you an OTP to reset your password
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <Input
                    id="email"
                    label="Email Address"
                    type="email"
                    value={email}
                    placeholder="you@example.com"
                    autoFocus
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    required
                  />
                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.16 }}
                        className="text-[11px] font-medium pl-1"
                        style={{ color: "#dc2626" }}
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#2165a9] w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-85 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <IconSpinner />
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </button>

                <div className="text-center mt-2">
                  <button
                    type="button"
                    onClick={() => router.push("/auth/login")}
                    className="text-sm hover:underline transition"
                    style={{ color: "#9a9188" }}
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Success Modal - Notifikasi OTP sudah dikirim */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-2xl bg-white p-8"
            >
              <div className="flex justify-center mb-8">
                <img
                  src="https://s3.sisgo.co.id/core/logo-sisgo.png"
                  alt="SISGO"
                  width={220}
                  height={60}
                  className="object-contain"
                />
              </div>

              <h2 className="text-2xl font-semibold text-center text-gray-900">
                OTP Sent Successfully!
              </h2>

              <p className="mt-5 text-center text-gray-600 leading-7">
                We've sent a 6-digit OTP to
              </p>

              <p className="mt-2 text-center font-semibold break-all" style={{ color: "#2165a9" }}>
                {email}
              </p>

              <p className="mt-6 text-center text-gray-500 text-sm leading-6">
                Please check your inbox and enter the OTP on the next screen.
              </p>

              <div className="mt-8 rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Didn't receive the OTP?</span>
                  <br />
                  Check your spam folder or wait a few minutes before requesting a new OTP.
                </p>
              </div>

              <button
                onClick={handleModalConfirm}
                className="mt-8 w-full py-3 rounded-xl text-white font-semibold transition hover:opacity-85"
                style={{ backgroundColor: "#2165a9" }}
              >
                Continue to Reset Password
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}