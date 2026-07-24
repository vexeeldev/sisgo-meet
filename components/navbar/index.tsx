"use client";
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "../icon";
import { useContext } from "react";
import { SettingsContext } from "../../context/SettingsContext";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";

type LanguageCode = "id" | "en";

const languages: {
  code: LanguageCode;
  flagUrl: string;
  label: string;
}[] = [
  { code: "id", flagUrl: "https://flagcdn.com/id.svg", label: "ID" },
  { code: "en", flagUrl: "https://flagcdn.com/us.svg", label: "EN" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { settings, saveSettings } = useContext(SettingsContext);

  const { t, i18n } = useTranslation("common");

  const tr = (key: string) => {
    const lang = i18n.language === "en" ? "en" : "id";
    return t(`${key}.${lang}`);
  };

  const currentLanguage =
    languages.find((l) => l.code === i18n.language) || languages[0];

  const isAuthPage =
    pathname?.includes("/auth/");

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const changeLanguage = (code: LanguageCode) => {
    saveSettings({
      ...settings,
      lang: code,
    });

    setLangDropdownOpen(false);
    setOpen(false);
  };

  useEffect(() => {
    const resize = () => {
      if (window.innerWidth >= 768) {
        setOpen(false);
      }
    };

    window.addEventListener("resize", resize);

    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.location.pathname === "/") {
      e.preventDefault();
      const targetId = "positions";
      const element = document.getElementById(targetId);

      if (element) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }

      setOpen(false);
    }
  };

  const getLogoSrc = () => {
    if (isAuthPage && !isScrolled) {
      return "https://s3.sisgo.co.id/core/logo-sisgo-white.png";
    }
    return "https://s3.sisgo.co.id/core/logo-sisgo.png";
  };

  const getTextColor = () => {
    if (isScrolled) return "text-slate-800";
    if (isAuthPage) return "text-white";
    return "text-slate-800";
  };

  const getNavbarBg = () => {
    if (isScrolled) {
      return "bg-white/80 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.04)] border-b border-slate-200/60";
    }
    if (isAuthPage) {
      return "bg-transparent";
    }
    return "bg-white";
  };

  const getMenuIconColor = () => {
    if (isAuthPage && !isScrolled) {
      return "text-white";
    }
    return "text-slate-800";
  };

  return (
    <nav
      className={`w-full fixed top-0 left-0 z-50 transition-all duration-300 ${getTextColor()} ${getNavbarBg()}`}
    >
      <div
        className="
        mx-auto
        w-full
        max-w-7xl
        h-16
        lg:h-20
        px-4
        sm:px-6
        lg:px-8
        flex
        items-center
        justify-between
        "
      >
        <Link href={"/"}>
          <Image
            src={getLogoSrc()}
            alt="SISGO Logo"
            width={197}
            height={50}
            loading="eager"
            className="h-auto transition-all duration-300"
          />
        </Link>

        <div className="hidden md:flex space-x-6 items-center h-full">
          <Link
            href="/auth/login"
            className="py-2 px-4 rounded-xl border border-primary bg-primary-blue text-white hover:bg-blue-700 transition-colors duration-150"
          >
            {t("auth.login") || "Login"}
          </Link>

          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg transition-colors ${
                isAuthPage && !isScrolled
                  ? "hover:bg-white/10 text-white"
                  : "hover:bg-slate-100 text-slate-800"
              }`}
            >
              <Image
                src={currentLanguage.flagUrl}
                width={20}
                height={14}
                alt={currentLanguage.label}
                className="rounded-[2px] shadow-sm"
              />
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  langDropdownOpen ? "rotate-180" : ""
                } ${
                  isAuthPage && !isScrolled ? "text-white/70" : "text-slate-500"
                }`}
              />
            </button>

            <AnimatePresence>
              {langDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute right-0 mt-2 w-max min-w-0 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50"
                >
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`flex items-center space-x-3 w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                        i18n.language === lang.code
                          ? "text-primary-blue font-bold bg-blue-50/50"
                          : "text-slate-600"
                      }`}
                    >
                      <Image
                        src={lang.flagUrl}
                        width={20}
                        height={14}
                        alt={lang.label}
                        className="w-5 h-auto rounded-[2px] shadow-sm"
                      />
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <button
          className="
            md:hidden
            inline-flex
            items-center
            justify-center
            rounded-lg
            p-2
            transition
            hover:bg-slate-100
            "
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <X className={`w-6 h-6 ${getMenuIconColor()}`} />
          ) : (
            <Menu className={`w-6 h-6 ${getMenuIconColor()}`} />
          )}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 top-16 z-40 md:hidden flex min-h-[calc(100dvh-4rem)] flex-col bg-white border-t border-slate-100 px-4 pt-4 pb-6 overflow-y-auto"
          >
            <nav className="flex flex-col space-y-5">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/auth/login"
                  onClick={() => setOpen(false)}
                  className="col-span-2 flex items-center justify-center gap-1 rounded-lg bg-primary-blue py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition"
                >
                  {t("auth.login") || "Login"}
                  <Icon icon="mdi:arrow-right" className="w-4 h-4" />
                </Link>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t("Ubah Bahasa")}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`flex items-center justify-center gap-2 rounded-xl border py-3 transition ${
                        i18n.language === lang.code
                          ? "border-primary-blue bg-blue-50 text-primary-blue font-semibold"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Image
                        src={lang.flagUrl}
                        width={20}
                        height={14}
                        alt={lang.label}
                        className="rounded-[2px] shadow-sm"
                      />
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
