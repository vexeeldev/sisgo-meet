import Image from "next/image";
import { useTranslation } from "react-i18next";

const SISGOleftbarLogRight = () => {
  const { t } = useTranslation("common");
  return (
    <div className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden pt-89">
            {/* Background tim SISGO */}
            <Image
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&q=80"
              alt="Tim SISGO bekerja bersama"
              fill
              className="object-cover object-center"
              priority
            />
    
            {/* Dark overlay gradient — lebih gelap di bawah supaya teks terbaca */}
            <div
              className="absolute inset-0 z-10"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(10,8,6,0.35) 0%, rgba(10,8,6,0.2) 40%, rgba(10,8,6,0.75) 80%, rgba(10,8,6,0.92) 100%)",
              }}
            />
    
            {/* Subtle noise texture */}
            <div
              className="absolute inset-0 z-10 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(#fff 0.6px, transparent 0.6px)",
                backgroundSize: "8px 8px",
              }}
            />
            <div className="relative z-20 p-10 flex flex-col gap-8">
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-widest mb-4"
                  style={{ color: "rgba(255,255,255,0.9)" }}
                >
                  {t("auth.leftbar.buildFuture")}
                </p>
                <h2 className="text-4xl font-semibold leading-tight text-white">
                  {t("auth.leftbar.titleLine1")}
                    <br />
                    <span
                      className="italic"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      {t("auth.leftbar.titleLine2")}
                  </span>
                </h2>
              </div>
              <div
                style={{ height: 1, backgroundColor: "rgba(255,255,255,0.1)" }}
              />
              <div className="flex flex-col gap-5">
                <p
                  className="text-sm leading-7"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                 {t("auth.leftbar.description")}
                </p>
              </div>
            </div>
          </div>
  )}

export default SISGOleftbarLogRight;