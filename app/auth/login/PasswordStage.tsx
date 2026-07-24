import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { IconSpinner } from "@/components/ui/iconSpinner";
import { IconBack } from "@/components/ui/iconBacnk";
import IconEye from "@/components/ui/IconEye";
import { useTranslation } from "react-i18next";

type PasswordStageProps = {
  direction: number;
  slideVariants: any;
  ease: any;

  email: string;
  password: string;
  showPw: boolean;
  error: string;
  loading: boolean;

  setPassword: (value: string) => void;
  setShowPw: React.Dispatch<React.SetStateAction<boolean>>;
  setError: (value: string) => void;

  handlePasswordSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  goTo: (stage: "email" | "password", direction: number) => void;
};

export default function PasswordStage({
  direction,
  slideVariants,
  ease,
  email,
  password,
  showPw,
  error,
  loading,
  setPassword,
  setShowPw,
  setError,
  handlePasswordSubmit,
  goTo,
}: PasswordStageProps) {
  const { t } = useTranslation("common");
  return (
    <motion.div
      key="password"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.28, ease }}
    >
      <button
        onClick={() => goTo("email", -1)}
        className="flex items-center gap-1.5 text-xs mb-8 transition-opacity hover:opacity-60"
        style={{ color: "#9a9188" }}
      >
        <IconBack /> {t("auth.changeEmail")}
      </button>

      <h1 className="text-2xl font-semibold mb-1" style={{ color: "#1e1b18" }}>
        {t("auth.enterPassword")}
      </h1>

      <p className="text-sm mb-8" style={{ color: "#9a9188" }}>
        {t("auth.loginAs")} <span style={{ color: "#1e1b18" }}>{email}</span>
      </p>

      <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Input
            label={t("auth.password")}
            type={showPw ? "text" : "password"}
            value={password}
            autoFocus
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            required={true}
            suffix={
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                className="flex items-center"
              >
                <IconEye show={showPw} />
              </button>
            }
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

        <div className="flex justify-end -mt-2">
          <Link
            href="/auth/forgotpassword"
            className="text-xs hover:underline"
            style={{ color: "#9a9188" }}
          >
            {t("auth.forgotPassword")}
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-85 disabled:opacity-60 cursor-pointer"
          style={{ backgroundColor: "#1e1b18" }}
        >
          {loading ? (
            <>
              <IconSpinner />
              {t("auth.loggingIn")}
            </>
          ) : (
            t("auth.login")
          )}
        </button>
      </form>
    </motion.div>
  );
}
