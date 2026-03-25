export default function Simulator() {
  return (
    <section id="simulador" className="py-24 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-blue-500/10 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-indigo-500/10 translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs font-black uppercase tracking-widest text-blue-400 mb-3">Herramienta gratuita</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            ¿Cuánto dinero estás<br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">perdiendo cada mes?</span>
          </h2>
          <p className="mt-4 text-blue-200/80 text-lg max-w-xl mx-auto">
            Calcula en 2 minutos el impacto real de no tener un sistema clínico digital. Sin correo, sin registro.
          </p>
        </div>

        {/* Simulator iframe frame */}
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-2 shadow-2xl">
          {/* Browser-like top bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 mb-2">
            <span className="w-3 h-3 rounded-full bg-red-400/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
            <span className="w-3 h-3 rounded-full bg-green-400/70" />
            <div className="ml-4 flex-1 bg-white/10 rounded-full h-5 max-w-xs" />
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ height: '600px' }}>
            <iframe
              src="/simulador.html"
              className="w-full h-full border-none"
              title="Simulador MedIQ ROI"
            />
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { val: '+72%', label: 'Horas recuperadas en gestión' },
            { val: '+8', label: 'Consultas extra posibles al mes' },
            { val: '+$4,400', label: 'Ingreso adicional promedio/mes' },
          ].map((kpi, i) => (
            <div key={i} className="bg-white/5 rounded-2xl border border-white/10 p-5 text-center">
              <div className="text-3xl font-black text-white">{kpi.val}</div>
              <div className="text-sm text-blue-300/70 mt-1">{kpi.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
