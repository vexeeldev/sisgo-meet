"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFormContext } from "react-hook-form";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  onRightIconClick?: () => void;
  suffix?: React.ReactNode;
  required?: boolean;
  watch?: ReturnType<typeof useFormContext>["watch"];
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className, disabled, suffix, required, watch, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const hintId = `${inputId}-hint`;
    const errorId = `${inputId}-error`;

    const hasError = !!error;

    return (
      <div className={`flex flex-col gap-1 ${className ?? ""}`}>
        <div className="relative overflow-visible pt-1">
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            placeholder={label ? " " : props.placeholder}
            className={`peer w-full p-3 rounded-xl border border-slate-200/90 ${
              disabled ? "bg-gray-100 text-gray-700 cursor-not-allowed" : "bg-white"
            } text-slate-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition hover:border-slate-300 ${
              label ? "placeholder:text-transparent" : ""
            } ${hasError ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
            {...props}
          />

          {label && (
            <label
              htmlFor={inputId}
              className="pointer-events-none absolute left-5 top-1/2 z-10 -translate-y-1/2 origin-left text-[15px] text-slate-500 transition-all duration-200 ease-out peer-focus:top-0 peer-focus:-translate-y-[calc(100%+0.1rem)] peer-focus:left-0 peer-focus:text-[11px] peer-focus:font-medium peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-[calc(100%+0.1rem)] peer-[:not(:placeholder-shown)]:left-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-medium peer-[:not(:placeholder-shown)]:text-slate-600"
            >
              {label}
              {required && <span className="text-red-400 pl-1">*</span>}
            </label>
          )}
          
          {suffix && (
            <div
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "#9a9188" }}
            >
              {suffix}
            </div>
          )}
        </div>
        
        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key="error"
              id={errorId}
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              className="text-[11px] font-medium flex items-center gap-1 pl-1"
              style={{ color: "#dc2626" }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 14.5h-2v-2h2v2zm0-4h-2v-5h2v5z" />
              </svg>
              {error}
            </motion.p>
          ) : hint ? (
            <motion.p
              key="hint"
              id={hintId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="text-[11px] pl-1"
              style={{ color: "#b8b0a8" }}
            >
              {hint}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };