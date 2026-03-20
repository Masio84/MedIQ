'use client';

import { useState, useEffect } from 'react';

export default function BillingPanel() {
  const [billing, setBilling] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBilling = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/billing/list');
        const result = await res.json();
        
        if (result.success && result.data) {
          setBilling(result.data);
        }
      } catch (error) {
        console.error("Error fetching billing:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBilling();
  }, []);

  const totalBase = billing.reduce((acc, b) => acc + Number(b.normal_fee || 0), 0);
  const totalAjuste = billing.reduce((acc, b) => acc + Number(b.extra_charge || 0) - Number(b.discount || 0), 0);
  const totalRecaudado = billing.reduce((acc, b) => b.paid ? acc + (Number(b.normal_fee || 0) + Number(b.extra_charge || 0) - Number(b.discount || 0)) : acc, 0);

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100/50 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4 mb-4">Registro de Facturación</h3>

      {loading && <p className="text-sm text-gray-400">Cargando facturas...</p>}
      {!loading && billing.length === 0 && (
        <p className="text-sm text-gray-400">No hay registros de facturación aún.</p>
      )}

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-3">
        {billing.map((b) => {
          try {
            const normal = Number(b.normal_fee);
            const discount = Number(b.discount || 0);
            const extra = Number(b.extra_charge || 0);
            const total = normal + extra - discount;

            return (
              <div key={b.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100/30 shadow-sm space-y-2">
                <div className="flex justify-between items-center border-b border-gray-200/40 pb-2">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-gray-900 text-sm">{b.patientName || 'N/A'}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md inline-block w-max" style={{ backgroundColor: b.paid ? '#E6F5F0' : '#FAEEDA', color: b.paid ? '#0F6E56' : '#854F0B' }}>
                      {b.paid ? 'Pagado' : 'Pendiente'}
                    </span>
                  </div>
                  <span className="text-xxs text-gray-400" suppressHydrationWarning>
                    {new Date(b.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date(b.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Base:</span>
                    <span className="font-medium">${normal.toFixed(2)}</span>
                  </div>
                  {extra > 0 && (
                    <div className="flex justify-between text-xs font-semibold" style={{ color: '#0F6E56' }}>
                      <span>Incremento:</span>
                      <span>+${extra.toFixed(2)}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-xs font-semibold" style={{ color: '#993C1D' }}>
                      <span>Descuento:</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-gray-200/40 pt-2 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-700">Total Final:</span>
                  <span className="font-black text-green-600 text-sm">${total.toFixed(2)}</span>
                </div>
              </div>
            );
          } catch (e) {
            console.error("Error rendering billing row (mobile):", e);
            return (
              <div key={b.id} className="p-4 bg-red-50 text-red-500 text-xs rounded-xl border border-red-200">
                Error al cargar este registro.
              </div>
            );
          }
        })}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-700">
          <thead className="bg-gray-100 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Paciente</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Tarifa Normal</th>
              <th className="px-4 py-3">Ajuste / Descuento</th>
              <th className="px-4 py-3">Total Final</th>
              <th className="px-4 py-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {billing.map((b) => {
              try {
                const normal = Number(b.normal_fee);
                const discount = Number(b.discount || 0);
                const extra = Number(b.extra_charge || 0);
                const total = normal + extra - discount;

                return (
                  <tr key={b.id} className="hover:bg-gray-100/50 transition-colors">
                    <td className="px-4 py-4 font-medium text-gray-900">
                      {b.patientName || 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-400" suppressHydrationWarning>
                      {new Date(b.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date(b.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-4">${normal.toFixed(2)}</td>
                    <td className="px-4 py-4 font-bold" style={{ color: extra > 0 ? '#0F6E56' : discount > 0 ? '#993C1D' : '#9CA3AF' }}>
                      {extra > 0 ? `+ $${extra.toFixed(2)}` : discount > 0 ? `- $${discount.toFixed(2)}` : `$0.00`}
                    </td>
                    <td className="px-4 py-4 font-black">${total.toFixed(2)}</td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-md" style={{ backgroundColor: b.paid ? '#E6F5F0' : '#FAEEDA', color: b.paid ? '#0F6E56' : '#854F0B' }}>
                        {b.paid ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                );
              } catch (e) {
                console.error("Error rendering billing row (desktop):", e);
                return (
                  <tr key={b.id} className="bg-red-50 text-red-500 text-xs">
                    <td colSpan={5} className="px-4 py-4 text-center">Error al cargar este registro de facturación.</td>
                  </tr>
                );
              }
            })}
            {/* SUMARIO */}
            <tr className="bg-gray-50 border-t-2 border-gray-200">
              <td colSpan={2} className="px-4 py-4 font-black text-right text-gray-900 text-sm uppercase tracking-wider">Totales Generales:</td>
              <td className="px-4 py-4 font-black text-gray-900">${totalBase.toFixed(2)}</td>
              <td className="px-4 py-4 font-black" style={{ color: totalAjuste > 0 ? '#0F6E56' : totalAjuste < 0 ? '#993C1D' : '#9CA3AF' }}>
                {totalAjuste > 0 ? `+ $${totalAjuste.toFixed(2)}` : totalAjuste < 0 ? `- $${Math.abs(totalAjuste).toFixed(2)}` : `$0.00`}
              </td>
              <td colSpan={2} className="px-4 py-4 font-black text-green-700 text-base">
                Recaudado: ${totalRecaudado.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
