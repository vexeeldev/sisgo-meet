"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { IconSpinner } from "@/components/ui/iconSpinner";
import { Input } from "@/components/ui/input";
import SISGOleftbarLogReg from "@/components/navbar/SISGOleftbarLogRight";
import { api } from "@/lib/api-new";
import { SISGOPasswordStrengthIndicator } from "../../register/section/SISGOPasswordStrengIndicator";
import IconEye from "@/components/ui/IconEye";

interface SISGOResetPasswordFormProps {
  email: string;
}

export default function SISGOResetPasswordForm({
  email,
}: SISGOResetPasswordFormProps) {
  const router = useRouter();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }

    if (error) setError("");
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();

    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      const newOtp = [...otp];
      digits.forEach((digit, index) => {
        if (index < 6) {
          newOtp[index] = digit;
        }
      });
      setOtp(newOtp);
      inputRefs[5].current?.focus();
      if (error) setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter complete 6-digit OTP");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter");
      return;
    }
    if (!/\d/.test(password)) {
      setError("Password must contain at least one number");
      return;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      setError("Password must contain at least one special character");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const result = await api.resetPassword(email, otpString, password);
      if (result.success === true) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      } else {
        setError(
          result.message ||
            "Failed to reset password. Please check your OTP and try again.",
        );
        setLoading(false);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#f5f3f0" }}>
      <SISGOleftbarLogReg />
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-sm">
          <motion.div
            key="reset-password"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1
              className="text-2xl font-semibold mb-1"
              style={{ color: "#1e1b18" }}
            >
              Reset Password
            </h1>
            <p className="text-sm mb-1" style={{ color: "#9a9188" }}>
              Enter the OTP sent to your email and create a new password
            </p>
            <p
              className="text-xs mb-8 font-medium"
              style={{ color: "#2165a9" }}
            >
              {email}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* OTP Fields */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#1e1b18" }}
                >
                  OTP Code
                </label>
                <div className="flex justify-start gap-2 sm:gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={inputRefs[index]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-semibold border-2 rounded-lg focus:outline-none focus:ring-2 transition-all
                        ${
                          error && error.includes("OTP")
                            ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                            : "border-[#e8e4df] focus:border-[#2165a9] focus:ring-[#2165a9]/20"
                        }`}
                      style={{ color: "#1e1b18", backgroundColor: "#faf9f8" }}
                      disabled={loading || success}
                    />
                  ))}
                </div>
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    placeholder="••••••••"
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    required
                    disabled={loading || success}
                    label="New Password"
                    suffix={
                      <button
                        type="button"
                        className="cursor-pointer"
                        onClick={() => setShowPw(!showPw)}
                      >
                        <IconEye show={showPw} />
                      </button>
                    }
                  />
                  {isPasswordFocused && password.length > 0 && (
                    <SISGOPasswordStrengthIndicator password={password} />
                  )}
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPw ? "text" : "password"}
                    value={confirmPassword}
                    placeholder="••••••••"
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError("");
                    }}
                    required
                    disabled={loading || success}
                    label="Confirm Password"
                    suffix={
                      <button
                        type="button"
                        className="cursor-pointer"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                      >
                        <IconEye show={showConfirmPw} />
                      </button>
                    }
                  />
                </div>

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
                disabled={loading || success}
                className={`w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-85 disabled:opacity-60 cursor-pointer mt-1 ${
                  success ? "bg-green-500" : "bg-[#2165a9]"
                }`}
              >
                {loading ? (
                  <>
                    <IconSpinner />
                    Verifying & Resetting...
                  </>
                ) : success ? (
                  "✓ Password Reset Successfully"
                ) : (
                  "Reset Password"
                )}
              </button>

              <div className="text-center mt-1">
                <button
                  type="button"
                  onClick={() => router.push("/auth/login")}
                  className="text-sm hover:underline transition"
                  style={{ color: "#9a9188" }}
                >
                  Back to Login
                </button>
              </div>
              <div className="text-center">
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading || success}
                  onClick={async () => {
                    try {
                      await api.otpEmailForgotPassword(email);
                      alert("OTP has been resent to your email");
                      setOtp(["", "", "", "", "", ""]);
                      inputRefs[0].current?.focus();
                      setResendCooldown(60); // Jeda 1 menit (60 detik) pertama
                    } catch (err) {
                      alert("Failed to resend OTP. Please try again.");
                    }
                  }}
                  className="text-xs hover:underline transition disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ color: "#9a9188" }}
                >
                  {resendCooldown > 0
                    ? `Resend OTP in ${resendCooldown}s`
                    : "Didn't receive OTP? Resend"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
