"use client";
import { useState } from "react";
import { ORG, MOTTO } from "../../lib/config";
export default function Login() {
  const [pw, setPw] = useState(""); const [err, setErr] = useState(false);
  async function go(e) {
    e.preventDefault();
    const r = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    if (r.ok) location.href = "/"; else setErr(true);
  }
  return (
    <main className="min-h-screen grid place-items-center p-6 bg-gradient-to-br from-[#7a1f3d] to-[#3d0f1f]">
      <form onSubmit={go} className="w-full max-w-sm bg-white rounded-3xl p-7 shadow-2xl">
        <div className="text-4xl text-center">⛪</div>
        <h1 className="text-xl font-bold text-center mt-2">Inscriptions</h1>
        <p className="text-center text-sm text-gray-500">{ORG}</p>
        <p className="text-center text-xs italic text-gray-400 mb-5">{MOTTO}</p>
        <input type="password" value={pw} onChange={(e) => { setPw(e.target.value); setErr(false); }} placeholder="Mot de passe"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 ring-[#7a1f3d]" />
        {err && <p className="text-red-600 text-sm mt-2">Mot de passe incorrect</p>}
        <button className="w-full mt-4 rounded-xl bg-[#7a1f3d] text-white font-semibold py-3 active:scale-95 transition">Se connecter</button>
      </form>
    </main>
  );
}
