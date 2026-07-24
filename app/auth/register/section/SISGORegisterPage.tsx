"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SISGOleftbarLogReg from "@/components/navbar/SISGOleftbarLogRight";
import RegisterForm from "./SISGORegisterForm";
import { useForm, FormProvider } from "react-hook-form";
import { api } from "@/lib/api-new";

export default function RegisterPage() {
  const router = useRouter();
  const methods = useForm({
    defaultValues: {
      name: "",
      email: "",
      no_hp: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("email");

    if (savedEmail) {
      methods.setValue("email", savedEmail);
      localStorage.removeItem("email");
    }
  }, [methods]);

  const handleRegister = async (data: any) => {
    setError("");
    const { name, email, no_hp, password, confirmPassword } = data;

    const no_hpRegex = /^08[0-9]{8,13}$/;
    if (!no_hpRegex.test(no_hp)) {
      methods.setError("no_hp", {
        type: "manual",
        message: "Nomor WhatsApp tidak valid (contoh: 081234567890)",
      });
      return;
    }

    if (password !== confirmPassword) {
      methods.setError("confirmPassword", {
        type: "manual",
        message: "Kata sandi tidak cocok",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await api.register({
        username: name,
        name: name,
        email: email,
        no_hp: no_hp,
        password: password,
      });


      if (result.success) {
        setShowPopup(true);
        localStorage.setItem("email", email);
      } else {
        throw new Error(result.message || "Terjadi kesalahan saat mendaftar.");
      }
    } catch (err) {
      console.error("Register error:", err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    router.push("/api/auth/google");
  };

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen flex" style={{ backgroundColor: "#ffff" }}>
        <SISGOleftbarLogReg />

        <div className="flex w-full items-start justify-center lg:w-1/2 h-screen overflow-y-auto pt-24 px-6 register-scrollbar">
          <RegisterForm
            showPw={showPw}
            showConfirmPw={showConfirmPw}
            loading={loading}
            error={error}
            setShowPw={setShowPw}
            setShowConfirmPw={setShowConfirmPw}
            onRegister={methods.handleSubmit(handleRegister)}
            onGoogle={handleGoogleRegister}
            maxlength={64}
          />
        </div>

        {showPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8">
              <div className="flex justify-center mb-8">
                <img
                  src="https:   s3.sisgo.co.id/core/logo-sisgo.png"
                  alt="SISGO"
                  width={220}
                  height={60}
                />
              </div>

              <h2 className="text-2xl font-semibold text-center text-gray-900">
                Verify your email
              </h2>

              <p className="mt-5 text-center text-gray-600 leading-7">
                We've sent a verification link to
              </p>

              <p className="mt-2 text-center font-semibold text-[#2165A9] break-all">
                {methods.getValues("email")}
              </p>

              <p className="mt-6 text-center text-gray-500 text-sm leading-6">
                Please check your inbox and click the verification link to
                activate your <span className="font-neighbor">SISGO</span>{" "}
                Career account.
              </p>

              <div className="mt-8 rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">
                    Didn't receive the email?
                  </span>
                  <br />
                  Check your spam folder or wait a few minutes before requesting
                  another verification email.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowPopup(false);
                  router.push("/auth/login");
                }}
                className="mt-8 w-full h-11 rounded-lg bg-[#2165A9] text-white font-medium transition hover:bg-[#1b5792]"
              >
                Back to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </FormProvider>
  );
}