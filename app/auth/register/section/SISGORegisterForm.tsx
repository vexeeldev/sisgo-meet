"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { IconGoogle } from "@/components/ui/iconGoogle";
import IconEye from "@/components/ui/IconEye";
import { useTranslation } from "react-i18next";
import { SISGOPasswordStrengthIndicator } from "./SISGOPasswordStrengIndicator";
import { useState, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";

type RegisterFormProps = {
  showPw: boolean;
  showConfirmPw: boolean;
  loading: boolean;
  error: string;
  maxlength?: number;
  setShowPw: React.Dispatch<React.SetStateAction<boolean>>;
  setShowConfirmPw: React.Dispatch<React.SetStateAction<boolean>>;
  onRegister: (e: React.FormEvent<HTMLFormElement>) => void;
  onGoogle: () => void;
};

export default function RegisterForm(props: RegisterFormProps) {
  const { t } = useTranslation("common");
  const {
    showPw,
    showConfirmPw,
    loading,
    error,
    setShowPw,
    setShowConfirmPw,
    onRegister,
    onGoogle,           
  } = props;

  const maxlength = props.maxlength ?? 64;  
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const { register, watch, formState: { errors }, setFocus, clearErrors } = useFormContext();
  const emailLocalStore = typeof window !== "undefined" ? localStorage.getItem("email") : null;

  const email = watch("email") || "";
  const password = watch("password") || "";
  const name = watch("name") || "";
  const no_hp = watch("no_hp") || "";
  const confirmPassword = watch("confirmPassword") || "";

  // Ref untuk tracking apakah error sudah ditampilkan
  const errorShownRef = useRef(false);

  // Auto focus ke error pertama - hanya sekali
  useEffect(() => {
    const firstError = Object.keys(errors)[0];
    if (firstError && !errorShownRef.current) {
      errorShownRef.current = true;
      setTimeout(() => {
        setFocus(firstError as any);
      }, 200);
    }
    // Reset flag jika tidak ada error
    if (Object.keys(errors).length === 0) {
      errorShownRef.current = false;
    }
  }, [errors, setFocus]);

  // Fungsi untuk handle change no_hp
  const handleNoHpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    e.target.value = value;
    const { onChange } = register("no_hp");
    onChange(e);
  };

  // Fungsi untuk clear error saat user fokus
  const handleFieldFocus = (fieldName: string) => {
    if (errors[fieldName]) {
      clearErrors(fieldName);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm pb-16">
      <h1 className="text-2xl font-semibold mb-1" style={{ color: "#1e1b18" }}>
        {t("auth.register.title")}
      </h1>
      <p className="text-sm mb-8" style={{ color: "#9a9188" }}>
        {t("auth.register.subtitle")}
      </p>

      {/* Google */}
      <button
        type="button"
        onClick={onGoogle}
        className="cursor-pointer w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-medium transition-all duration-150 mb-4"
        style={{
          border: "1.5px solid #e8e4df",
          backgroundColor: "#fff",
          color: "#1e1b18",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#1e1b18")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e8e4df")}
      >
        <IconGoogle />
        {t("auth.register.continueWithGoogle")}
      </button>

      {/* Separator */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px" style={{ backgroundColor: "#e8e4df" }} />
        <span className="text-xs" style={{ color: "#b8b0a8" }}>
          {t("auth.register.orWithEmail")}
        </span>
        <div className="flex-1 h-px" style={{ backgroundColor: "#e8e4df" }} />
      </div>

      {/* Form */}
      <form onSubmit={onRegister} className="flex flex-col gap-5" noValidate>
        {/* Email */}
        <div>
          <Input
            id="email"
            type="email"
            label={t("auth.register.email")}
            maxLength={64}
            value={email}
            required
            error={errors.email?.message as string}
            {...register("email", {
              required: "Email harus diisi",
              maxLength: {
                value: 64,
                message: "Email maksimal 64 karakter",
              },
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Format email tidak valid",
              },
            })}
            onFocus={() => handleFieldFocus("email")}
            suffix={
              <span className="text-xs" style={{ color: "#9a9188" }}>
                {email.length}/{maxlength}
              </span>
            }
          />
        </div>

        {/* Name */}
        <div>
          <Input
            id="name"
            type="text"
            label="Nama lengkap"
            maxLength={64}
            required
            error={errors.name?.message as string}
            {...register("name", {
              required: "Nama lengkap harus diisi",
              maxLength: {
                value: 64,
                message: "Nama maksimal 64 karakter",
              },
            })}
            onFocus={() => handleFieldFocus("name")}
            suffix={
              <span className="text-xs" style={{ color: "#9a9188" }}>
                {name.length}/{maxlength}
              </span>
            }
          />
        </div>

        {/* No HP */}
        <div>
          <Input
            id="no_hp"
            type="text"
            inputMode="numeric"
            maxLength={15}
            label={t("auth.register.whatsapp")}
            placeholder="08xxxxxxxxxx"
            required
            error={errors.no_hp?.message as string}
            {...register("no_hp", {
              required: "Nomor WhatsApp harus diisi",
              maxLength: {
                value: 15,
                message: "Nomor WhatsApp maksimal 15 karakter",
              },
              pattern: {
                value: /^08\d{8,13}$/,
                message: "Format nomor WhatsApp tidak valid",
              },
            })}
            onChange={handleNoHpChange}
            onFocus={() => handleFieldFocus("no_hp")}
          />
        </div>

        {/* Password */}
        <div>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              onFocus={() => {
                setIsPasswordFocused(true);
                handleFieldFocus("password");
              }}
              label={t("auth.register.password")}
              required
              error={errors.password?.message as string}
              suffix={
                <button
                  type="button"
                  className="cursor-pointer"
                  onClick={() => setShowPw(!showPw)}
                >
                  <IconEye show={showPw} />
                </button>
              }
              {...register("password", {
                required: "Kata sandi harus diisi",
                minLength: {
                  value: 8,
                  message: "Kata sandi minimal 8 karakter",
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z\d\S]{8,}$/,
                  message: "Kata sandi harus mengandung huruf besar, huruf kecil, angka, dan karakter khusus",
                },
              })}
              onBlur={(event) => {
                register("password").onBlur(event);
                setIsPasswordFocused(false);
              }}
            />
            {isPasswordFocused && password.length > 0 && (
              <SISGOPasswordStrengthIndicator password={password} />
            )}
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <Input
            id="confirmPassword"
            type={showConfirmPw ? "text" : "password"}
            label={t("auth.register.confirmPassword")}
            required
            error={errors.confirmPassword?.message as string}
            suffix={
              <button
                type="button"
                className="cursor-pointer"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
              >
                <IconEye show={showConfirmPw} />
              </button>
            }
            {...register("confirmPassword", {
              required: "Konfirmasi kata sandi harus diisi",
              validate: (value) => {
                const password = watch("password");
                return value === password || "Kata sandi tidak cocok";
              }
            })}
            onFocus={() => handleFieldFocus("confirmPassword")}
          />
        </div>

        {/* Global Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              className="text-[11px] font-medium pl-1 -mt-2"
              style={{ color: "#dc2626" }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={loading}
          className="bg-[#2165a9] w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-85 disabled:opacity-60 cursor-pointer"
        >
          {loading
            ? t("auth.register.processing")
            : t("auth.register.register")}
        </button>
      </form>

      <p className="mt-8 text-center text-sm" style={{ color: "#000000" }}>
        {t("auth.register.alreadyHaveAccount")}{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-[#2165a9] hover:underline"
        >
          {t("auth.register.loginNow")}
        </Link>
      </p>
    </div>
  );
}