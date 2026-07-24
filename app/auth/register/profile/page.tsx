"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterProfilePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function saveProfile() {
    try {
      setLoading(true);

      const res = await fetch("/api/auth/passkey/register/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      router.replace("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-8">
        <h1 className="text-2xl font-bold">
          Lengkapi Profil
        </h1>

        <p className="mt-2 text-slate-500">
          Passkey berhasil dibuat. Silakan lengkapi data akun.
        </p>

        <div className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Nama Lengkap
            </label>

            <input
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama Lengkap"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Email
            </label>

            <input
              type="email"
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required={true}
            />
          </div>

          <button
            onClick={saveProfile}
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Lanjut ke Dashboard"}
          </button>
        </div>
      </div>
    </main>
  );
}