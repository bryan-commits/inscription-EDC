"use client";
import { useEffect, useState, useCallback } from "react";
import { ORG, MOTTO, YEAR, CUR, STS } from "../lib/config";

const money = (n) => Number(n).toLocaleString("fr-FR") + " " + CUR;
const paid = (m) => m.payments.reduce((a, p) => a + p.amount, 0);
const fdate = (d) => new Date(d).toLocaleDateString("fr-FR");
const api = (u, o = {}) =>
  fetch(u, { headers: { "Content-Type": "application/json" }, ...o }).then((r) => {
    if (r.status === 401) location.href = "/login";
    return r.json();
  });
const state = (m) => { const p = paid(m);
  return p >= m.fee ? ["Soldé", "bg-emerald-100 text-emerald-700"] : p > 0 ? ["Partiel", "bg-amber-100 text-amber-700"] : ["Impayé", "bg-rose-100 text-rose-700"]; };

const pm = (n) => money(n).replace(/[\u202f\u00a0]/g, " ");
async function exportPdf(ms) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF();
  const got = ms.reduce((a, m) => a + paid(m), 0), exp = ms.reduce((a, m) => a + m.fee, 0);
  doc.setFontSize(15); doc.text(ORG, 14, 16);
  doc.setFontSize(11); doc.text("Inscriptions " + YEAR + " - situation au " + new Date().toLocaleDateString("fr-FR"), 14, 23);
  const sorted = [...ms].sort((a, b) => a.name.localeCompare(b.name));
  autoTable(doc, {
    startY: 29,
    head: [["Nom", "Statut", "Tarif", "Verse", "Reste", "Situation"].map((h) => (h === "Verse" ? "Versé" : h))],
    body: sorted.map((m) => [m.name, STS[m.st].l, pm(m.fee), pm(paid(m)), pm(Math.max(0, m.fee - paid(m))), state(m)[0]]),
    foot: [["Total (" + ms.length + ")", "", pm(exp), pm(got), pm(Math.max(0, exp - got)), ""]],
    headStyles: { fillColor: [122, 31, 61] }, footStyles: { fillColor: [240, 235, 228], textColor: 20 },
  });
  doc.save("inscriptions-" + YEAR + ".pdf");
}

function Sheet({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-20 bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-[#f7f3ee] w-full max-w-lg max-h-[92vh] overflow-auto rounded-t-3xl sm:rounded-3xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-2xl text-gray-400 px-2">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
const inp = "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 mb-3 outline-none focus:ring-2 ring-[#7a1f3d]";
const btn = "rounded-xl bg-[#7a1f3d] text-white font-semibold px-5 py-3 active:scale-95 transition disabled:opacity-50";
const ghost = "rounded-xl border border-[#7a1f3d] text-[#7a1f3d] font-semibold px-4 py-3 active:scale-95 transition";

export default function Home() {
  const [ms, setMs] = useState(null);
  const [q, setQ] = useState(""); const [f, setF] = useState("all");
  const [sel, setSel] = useState(null); const [add, setAdd] = useState(false); const [rc, setRc] = useState(null);

  const load = useCallback(() => api("/api/members").then((d) => Array.isArray(d) && setMs(d)), []);
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, [load]);

  const list = (ms || []).filter((m) => m.name.toLowerCase().includes(q.toLowerCase()) &&
    (f === "all" || (f === "due" ? paid(m) < m.fee : m.st === +f)));
  const got = (ms || []).reduce((a, m) => a + paid(m), 0), exp = (ms || []).reduce((a, m) => a + m.fee, 0);
  const member = ms?.find((m) => m.id === sel);

  function receipt(m, p) {
    const sorted = [...m.payments].sort((a, b) => a.created_at.localeCompare(b.created_at));
    const upto = sorted.slice(0, sorted.findIndex((x) => x.id === p.id) + 1).reduce((a, x) => a + x.amount, 0);
    setRc({ no: String(p.n).padStart(4, "0"), date: fdate(p.created_at), name: m.name, st: STS[m.st].l, fee: m.fee, amount: p.amount, upto, rest: Math.max(0, m.fee - upto) });
  }

  return (
    <main className="max-w-2xl mx-auto pb-28">
      <header className="bg-gradient-to-br from-[#7a1f3d] to-[#3d0f1f] text-white px-5 pt-8 pb-14 rounded-b-[2rem]">
        <p className="text-sm opacity-80">{ORG}</p>
        <h1 className="text-2xl font-bold">Inscriptions {YEAR}</h1>
        <p className="text-sm italic opacity-80 mt-1">{MOTTO}</p>
      </header>
      <div className="grid grid-cols-3 gap-2 px-4 -mt-9">
        {[["Encaissé", got, "text-emerald-700"], ["Attendu", exp, ""], ["Reste", Math.max(0, exp - got), "text-rose-700"]].map(([l, v, c]) => (
          <div key={l} className="bg-white rounded-2xl p-3 shadow-sm"><p className="text-xs text-gray-500">{l}</p><p className={"font-bold text-[15px] " + c}>{money(v)}</p></div>
        ))}
      </div>
      <div className="px-4 mt-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Rechercher un nom…" className={inp + " shadow-sm"} />
        <div className="flex gap-2 overflow-x-auto pb-2 -mt-1">
          {[["all", "Tous"], ["due", "Reste à payer"], ["0", "Nouveaux"], ["1", "Bureau"], ["2", "Anciens"]].map(([k, l]) => (
            <button key={k} onClick={() => setF(k)} className={"whitespace-nowrap rounded-full px-4 py-1.5 text-sm border " + (f === k ? "bg-[#7a1f3d] text-white border-[#7a1f3d]" : "bg-white border-gray-200")}>{l}</button>
          ))}
        </div>
        <div className="mt-2 space-y-2">
          {ms === null && <p className="text-center text-gray-400 py-10">Chargement…</p>}
          {ms && !list.length && <p className="text-center text-gray-400 py-10">{ms.length ? "Aucun résultat" : "Aucune inscription. Appuyez sur « + Inscrire »."}</p>}
          {list.map((m) => { const s = state(m); return (
            <button key={m.id} onClick={() => setSel(m.id)} className="w-full text-left bg-white rounded-2xl p-4 shadow-sm flex justify-between items-center gap-2 active:scale-[.98] transition">
              <div><p className="font-semibold">{m.name}</p><p className="text-sm text-gray-500">{STS[m.st].l} · {money(paid(m))} / {money(m.fee)}</p></div>
              <span className={"text-xs font-bold rounded-full px-3 py-1 " + s[1]}>{s[0]}</span>
            </button>); })}
        </div>
        <button onClick={() => exportPdf(ms || [])} className={ghost + " w-full mt-6"}>📄 Télécharger la liste en PDF</button>
      </div>
      <button onClick={() => setAdd(true)} className={btn + " fixed right-4 bottom-5 shadow-xl rounded-full"}>+ Inscrire</button>

      {add && <AddSheet onClose={() => setAdd(false)} onDone={async (r) => { setAdd(false); await load(); if (r.payment) receipt({ ...r.member, payments: [r.payment] }, r.payment); }} />}
      {member && !rc && (
        <Sheet title={member.name} onClose={() => setSel(null)}>
          <DetailBody m={member} reload={load} receipt={receipt} close={() => setSel(null)} />
        </Sheet>
      )}
      {rc && <Sheet title="Reçu" onClose={() => setRc(null)}><Receipt r={rc} /></Sheet>}
    </main>
  );
}

function AddSheet({ onClose, onDone }) {
  const [name, setName] = useState(""), [tel, setTel] = useState(""), [st, setSt] = useState(0), [amount, setAmount] = useState(""), [busy, setBusy] = useState(false);
  return (
    <Sheet title="Nouvelle inscription" onClose={onClose}>
      <input className={inp} placeholder="Nom complet" value={name} onChange={(e) => setName(e.target.value)} />
      <input className={inp} placeholder="Téléphone (optionnel)" type="tel" value={tel} onChange={(e) => setTel(e.target.value)} />
      <select className={inp} value={st} onChange={(e) => setSt(+e.target.value)}>
        {STS.map((s, i) => <option key={i} value={i}>{s.l} — {money(s.fee)}</option>)}
      </select>
      <input className={inp} placeholder="Avance versée maintenant (optionnel)" type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <button disabled={busy || !name.trim()} className={btn + " w-full"} onClick={async () => { setBusy(true); onDone(await api("/api/members", { method: "POST", body: JSON.stringify({ name, tel, st, amount }) })); }}>Enregistrer</button>
    </Sheet>
  );
}

function DetailBody({ m, reload, receipt, close }) {
  const rest = Math.max(0, m.fee - paid(m)); const [a, setA] = useState(rest);
  const s = state(m);
  const sorted = [...m.payments].sort((x, y) => y.created_at.localeCompare(x.created_at));
  return (<>
    <p className="text-sm text-gray-500 mb-3">{STS[m.st].l}{m.tel ? " · " + m.tel : ""} <span className={"ml-1 text-xs font-bold rounded-full px-3 py-1 " + s[1]}>{s[0]}</span></p>
    <div className="grid grid-cols-3 gap-2 mb-4 text-center">
      {[["À payer", m.fee], ["Versé", paid(m)], ["Reste", rest]].map(([l, v]) => <div key={l} className="bg-white rounded-xl p-2"><p className="text-xs text-gray-500">{l}</p><p className="font-bold text-sm">{money(v)}</p></div>)}
    </div>
    {rest > 0 && <div className="flex gap-2 mb-4"><input className={inp + " !mb-0"} type="number" inputMode="numeric" value={a} max={rest} onChange={(e) => setA(e.target.value)} />
      <button className={btn} onClick={async () => { const p = await api("/api/payments", { method: "POST", body: JSON.stringify({ member_id: m.id, amount: a }) }); await reload(); if (p.id) receipt(m, p); }}>Encaisser</button></div>}
    <p className="font-semibold text-sm mb-1">Versements</p>
    {!sorted.length && <p className="text-gray-400 text-sm py-2">Aucun versement</p>}
    {sorted.map((p) => (
      <div key={p.id} className="flex justify-between items-center py-2 border-b border-gray-200">
        <span>{fdate(p.created_at)}<br /><b>{money(p.amount)}</b></span>
        <span className="flex gap-3 text-sm"><button className="text-[#7a1f3d]" onClick={() => receipt(m, p)}>Reçu</button>
          <button className="text-rose-600" onClick={async () => { if (confirm("Supprimer ce versement ?")) { await api("/api/payments?id=" + p.id, { method: "DELETE" }); reload(); } }}>Suppr.</button></span>
      </div>))}
    <button className="w-full mt-5 text-rose-600 text-sm" onClick={async () => { if (confirm("Supprimer cette fiche et ses versements ?")) { await api("/api/members/" + m.id, { method: "DELETE" }); await reload(); close(); } }}>Supprimer la fiche</button>
  </>);
}

async function receiptPdf(r) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ format: "a5" });
  const W = doc.internal.pageSize.getWidth();
  doc.setFontSize(15); doc.setTextColor(30); doc.text(ORG, W / 2, 20, { align: "center" });
  doc.setFontSize(11); doc.setTextColor(100); doc.text("Inscription " + YEAR, W / 2, 27, { align: "center" });
  doc.setFontSize(14); doc.setTextColor(122, 31, 61); doc.text("REÇU N° " + r.no, W / 2, 38, { align: "center" });
  const rows = [["Date", r.date], ["Nom", r.name], ["Statut", r.st], ["Inscription", pm(r.fee)], ["Montant reçu", pm(r.amount)], ["Total versé", pm(r.upto)], ["Reste à payer", r.rest ? pm(r.rest) : "Soldé"]];
  let y = 52; doc.setFontSize(11);
  rows.forEach(([k, v], i) => {
    doc.setTextColor(100); doc.setFont("helvetica", "normal"); doc.text(k, 15, y);
    doc.setTextColor(20); doc.setFont("helvetica", i === 4 ? "bold" : "normal"); doc.text(v, W - 15, y, { align: "right" });
    doc.setDrawColor(220); doc.line(15, y + 3, W - 15, y + 3); y += 10;
  });
  doc.setTextColor(100); doc.setFont("helvetica", "normal"); doc.text("Signature du trésorier :", 15, y + 15);
  doc.line(62, y + 15, W - 15, y + 15);
  doc.setFont("helvetica", "italic"); doc.setFontSize(10); doc.text(MOTTO, W / 2, 198, { align: "center" });
  doc.save("recu-" + r.no + "-" + r.name.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase() + ".pdf");
}

function Receipt({ r }) {
  const text = `REÇU N° ${r.no}\n${ORG}\nInscription ${YEAR}\n\nDate : ${r.date}\nNom : ${r.name}\nStatut : ${r.st}\nInscription : ${money(r.fee)}\nMontant reçu : ${money(r.amount)}\nTotal versé : ${money(r.upto)}\nReste à payer : ${r.rest ? money(r.rest) : "0 — Soldé ✓"}\n\n${MOTTO}`;
  const rows = [["Date", r.date], ["Nom", r.name], ["Statut", r.st], ["Inscription", money(r.fee)], ["Montant reçu", money(r.amount)], ["Total versé", money(r.upto)], ["Reste à payer", r.rest ? money(r.rest) : "Soldé ✓"]];
  return (<>
    <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-5">
      <p className="text-center font-bold">{ORG}</p><p className="text-center text-sm text-gray-500">Inscription {YEAR}</p>
      <p className="text-center font-bold text-[#7a1f3d] mt-2">REÇU N° {r.no}</p>
      <table className="w-full my-3 text-sm"><tbody>{rows.map(([k, v]) => <tr key={k} className="border-b border-gray-100"><td className="py-1.5 text-gray-500">{k}</td><td className="py-1.5 text-right font-semibold">{v}</td></tr>)}</tbody></table>
      <p className="text-sm text-gray-500 mt-6">Signature du trésorier : ____________</p>
      <p className="text-center text-xs italic text-gray-400 mt-4">{MOTTO}</p>
    </div>
    <div className="flex gap-2 mt-4">
      <button className={btn + " flex-1"} onClick={async () => { try { if (navigator.share) return await navigator.share({ text }); } catch {} navigator.clipboard.writeText(text); alert("Reçu copié"); }}>Partager</button>
      <button className={ghost} onClick={() => receiptPdf(r)}>PDF</button>
      <button className={ghost} onClick={() => { navigator.clipboard.writeText(text); alert("Reçu copié"); }}>Copier</button>
    </div>
  </>);
}
