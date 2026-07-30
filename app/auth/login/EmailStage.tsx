import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Icon } from "@iconify/react";

import { Input } from "@/components/ui/input";
import { IconGoogle } from "@/components/ui/iconGoogle";
import { IconSpinner } from "@/components/ui/iconSpinner";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-new";
import { useTranslation } from "@/node_modules/react-i18next";

type EmailStageProps = {
  direction: number;
  slideVariants: any;
  ease: any;
  email: string;
  error: string;
  loading: boolean;
  setEmail: (value: string) => void;
  setError: (value: string) => void;
  handleEmailSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

export default function EmailStage(props: EmailStageProps) {
  const router = useRouter();
  const { t } = useTranslation("common");
  const {
    direction,
    slideVariants,
    ease,
    email,
    error,
    loading,
    setEmail,
    setError,
    handleEmailSubmit,
  } = props;

  const handleGoogleLogin = () => {
    api.googleLogin();
  }

  return (
    <motion.div
      key="email"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.28, ease }}
    >
      <h1
        className="text-2xl font-semibold mb-1"
        style={{ color: "#1e1b18" }}
      >
        {t("auth.welcome")}
      </h1>
      <p className="text-sm mb-8" style={{ color: "#9a9188" }}>
        {t("auth.enterEmail")}
      </p>

      <button
        type="button"
        className="cursor-pointer w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-medium transition-all duration-150 mb-6"
        style={{
          border: "1.5px solid #e8e4df",
          backgroundColor: "#fff",
          color: "#1e1b18",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.borderColor = "#1e1b18")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.borderColor = "#e8e4df")
        }
        onClick={handleGoogleLogin}
      >
        <IconGoogle />
        {t("auth.continueWithGoogle")}
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div
          className="flex-1 h-px"
          style={{ backgroundColor: "#e8e4df" }}
        />
        <span className="text-xs" style={{ color: "#b8b0a8" }}>
          {t("auth.orWithEmail")}
        </span>
        <div
          className="flex-1 h-px"
          style={{ backgroundColor: "#e8e4df" }}
        />
      </div>

      <form
        onSubmit={handleEmailSubmit}
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1.5">
          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            autoFocus
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            required={true}
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
          className="bg-primary-blue w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-85 disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <>
              <IconSpinner />
              {t("auth.checking")}
            </>
          ) : (
            t("auth.continue")
          )}
        </button>
        <p className="mt-6 text-center text-sm text-slate-700">
          {t("auth.alreadyHaveAccount")}{" "}
          <a
            href="/auth/register"
            className="font-semibold text-[#2165a9] hover:underline"
          >
            {t("auth.registerNow")}
          </a>
        </p>
      </form>
    </motion.div>
  );
}