"use client";
import { motion } from "framer-motion";

export const SISGOPasswordStrengthIndicator = ({ password }: { password: string }) => {
  const rules = [
    { label: "Minimal 8 karakter", test: password.length >= 8 },
    { label: "Satu huruf kecil", test: /[a-z]/.test(password) },
    { label: "Satu huruf besar", test: /[A-Z]/.test(password) },
    { label: "Satu angka", test: /\d/.test(password) },
    { label: "Satu karakter khusus (!@#$%^&*()-+)", test: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute z-50 mt-2 p-4 bg-white rounded-xl shadow-lg border border-gray-100 text-xs w-full"
      style={{ width:'100%' }}
    >
      <p className="font-semibold mb-2 text-gray-700">Password must:</p>
      {rules.map((rule, idx) => (
        <div key={idx} className="flex items-center gap-2 mb-1.5">
          <div className={`w-2 h-2 rounded-full ${rule.test ? "bg-green-500" : "bg-gray-300 "}`} />
          <span className={rule.test ? "text-green-600" : "text-gray-500"}>{rule.label}</span>
        </div>
      ))}
    </motion.div>
  );
};