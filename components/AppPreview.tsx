/** Abstrakte Dashboard-Visualisierung für Landing Hero */
export default function AppPreview() {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      <div className="absolute -inset-4 rounded-[20px] bg-gradient-to-br from-brand-500/20 via-transparent to-accent/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-modal border border-white/[0.08] bg-dark-900 shadow-modal">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
          <span className="ml-3 text-[11px] font-medium uppercase tracking-wide text-dark-500">
            MeisterFlow · Dashboard
          </span>
        </div>
        <div className="grid grid-cols-[56px_1fr] gap-0">
          <div className="space-y-3 border-r border-white/[0.06] bg-dark-950/60 p-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-8 rounded-btn ${i === 1 ? "bg-brand-500/20" : "bg-white/[0.04]"}`}
              />
            ))}
          </div>
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Offen", value: "12.400€", tone: "text-brand-300" },
                { label: "Bezahlt", value: "48.200€", tone: "text-success" },
                { label: "Follow-ups", value: "3", tone: "text-accent" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-card border border-white/[0.06] bg-dark-950/50 p-3"
                >
                  <p className="text-[10px] uppercase tracking-wide text-dark-500">{s.label}</p>
                  <p className={`kpi mt-1 text-sm sm:text-base ${s.tone}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-card border border-white/[0.06] bg-dark-950/40 p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium text-dark-300">Letzte Angebote</p>
                <span className="badge badge-blue">Live</span>
              </div>
              <div className="space-y-2">
                {["Müller Bau · 4.200€", "Schmidt Sanitär · 1.850€", "Weber Elektro · 6.100€"].map(
                  (row, i) => (
                    <div
                      key={row}
                      className="flex items-center justify-between rounded-btn bg-white/[0.03] px-3 py-2"
                    >
                      <span className="truncate text-xs text-dark-300">{row}</span>
                      <span
                        className={`badge ${i === 0 ? "badge-yellow" : i === 1 ? "badge-green" : "badge-blue"}`}
                      >
                        {i === 0 ? "Offen" : i === 1 ? "Bezahlt" : "Versendet"}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
