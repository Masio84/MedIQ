'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function BillingPanel() {
  const [billing, setBilling] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchBilling = async () => {
      const { data, error } = await supabase
        .from('billing')
        .select(`
          id,
          normal_fee,
          discount,
          extra_charge,
          created_at,
          patients ( name )
        `)
        .order('created_at', { ascending: false });

      if (data) setBilling(data);
      setLoading(false);
    };

    fetchBilling();
  }, [supabase]);

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
                  <span className="font-bold text-gray-900 text-sm">{(b.patients as any)?.name || 'N/A'}</span>
                  <span className="text-xxs text-gray-400" suppressHydrationWarning>{new Date(b.created_at).toLocaleDateString()}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Base:</span>
                    <span className="font-medium">${normal.toFixed(2)}</span>
                  </div>
                  {extra > 0 && (
                    <div className="flex justify-between text-xs text-red-500">
                      <span>Extra:</span>
                      <span className="font-medium">+${extra.toFixed(2)}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-xs text-green-600">
                      <span>Descuento:</span>
                      <span className="font-medium">-${discount.toFixed(2)}</span>
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
              <th className="px-4 py-3">Descuento</th>
              <th className="px-4 py-3">Total Final</th>
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
                    <td className="px-4 py-4 font-medium text-gray-900">{(b.patients as any)?.name || 'N/A'}</td>
                    <td className="px-4 py-4 text-xs text-gray-400" suppressHydrationWarning>{new Date(b.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-4">${normal.toFixed(2)}</td>
                    <td className="px-4 py-4 text-red-500">-${discount.toFixed(2)}</td>
                    <td className="px-4 py-4 font-bold text-green-600">${total.toFixed(2)}</td>
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
