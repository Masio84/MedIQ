import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import FeatureGate from '@/components/FeatureGate';
import { PlusCircle, AlertTriangle, HelpCircle } from 'lucide-react';

export default function BillingPanel() {
  const [billing, setBilling] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    patient_id: '',
    normal_fee: '',
    discount: '0',
    extra_charge: '0',
    paid: true,
    requiresCfdi: false,
    rfc_receptor: '',
    uso_cfdi: 'G03',
    forma_pago: '01',
    metodo_pago: 'PUE'
  });

  const [rfcError, setRfcError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const fetchBilling = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/billing/list');
        const result = await res.json();
        if (result.success && result.data) setBilling(Array.isArray(result.data) ? result.data : []);
      } catch (error) {
        console.error("Error fetching billing:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchPatients = async () => {
      const { data } = await supabase.from('patients').select('id, name');
      setPatients(Array.isArray(data) ? data : []);
    };

    fetchBilling();
    fetchPatients();
  }, [supabase]);

  const validateRfc = (rfc: string) => {
    const regex = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i;
    if (formData.requiresCfdi && !regex.test(rfc)) {
      setRfcError('RFC inválido (12-13 caracteres alfanuméricos).');
      return false;
    }
    setRfcError(null);
    return true;
  };

  const handleSaveBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.patient_id || !formData.normal_fee) {
       setFormError('Completa los campos obligatorios (Paciente y Tarifa).');
       return;
    }

    if (formData.requiresCfdi) {
       if (!formData.rfc_receptor) {
           setFormError('Completa los datos fiscales o desactiva la factura.');
           return;
       }
       if (!validateRfc(formData.rfc_receptor)) return;
    }

    setSaving(true);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user?.id).single();

        const insertPayload = {
            clinic_id: profile?.clinic_id,
            patient_id: formData.patient_id,
            normal_fee: Number(formData.normal_fee),
            discount: Number(formData.discount),
            extra_charge: Number(formData.extra_charge),
            paid: formData.paid,
            rfc_receptor: formData.requiresCfdi ? formData.rfc_receptor.toUpperCase() : null,
            uso_cfdi: formData.requiresCfdi ? formData.uso_cfdi : null,
            forma_pago: formData.requiresCfdi ? formData.forma_pago : null,
            metodo_pago: formData.requiresCfdi ? formData.metodo_pago : null,
            cfdi_status: formData.requiresCfdi ? 'pendiente' : null
        };

        const { error } = await supabase.from('billing').insert([insertPayload]);
        if (error) throw error;

        setIsModalOpen(false);
        setFormData({ ...formData, patient_id: '', normal_fee: '', requiresCfdi: false, rfc_receptor: '' });
        
        // Refetch list
        const res = await fetch('/api/billing/list');
        const result = await res.json();
        if (result.success && result.data) setBilling(result.data);

    } catch (err: any) {
        setFormError(err.message);
    } finally {
        setSaving(false);
    }
  };

  const totalBase = billing.reduce((acc, b) => acc + Number(b.normal_fee || 0), 0);
  const totalAjuste = billing.reduce((acc, b) => acc + Number(b.extra_charge || 0) - Number(b.discount || 0), 0);
  const totalRecaudado = billing.reduce((acc, b) => b.paid ? acc + (Number(b.normal_fee || 0) + Number(b.extra_charge || 0) - Number(b.discount || 0)) : acc, 0);

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100/50 shadow-sm relative">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
        <h3 className="text-lg font-bold text-gray-900">Registro de Facturación</h3>
        <button 
           onClick={() => setIsModalOpen(true)}
           className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold"
        >
          <PlusCircle size={14} /> Registrar Cobro
        </button>
      </div>

      {loading && <p className="text-sm text-gray-400">Cargando facturas...</p>}
      {!loading && billing.length === 0 && (
        <p className="text-sm text-gray-400">No hay registros de facturación aún.</p>
      )}

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-3">
        {Array.isArray(billing) && billing.map((b) => {
          try {
            const normal = Number(b.normal_fee);
            const discount = Number(b.discount || 0);
            const extra = Number(b.extra_charge || 0);
            const total = normal + extra - discount;

            const cfdiStatusColors: any = {
                pendiente: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'CFDI Pendiente' },
                en_proceso: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'CFDI Proceso' },
                timbrado: { bg: 'bg-green-100', text: 'text-green-700', label: 'CFDI Timbrado' },
                cancelado: { bg: 'bg-red-100', text: 'text-red-700', label: 'CFDI Cancelado' }
            };

            return (
              <div key={b.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100/30 shadow-sm space-y-2">
                <div className="flex justify-between items-center border-b border-gray-200/40 pb-2">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-gray-900 text-sm">{b.patientName || b.patients?.name || 'N/A'}</span>
                    <div className="flex gap-1 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md inline-block" style={{ backgroundColor: b.paid ? '#E6F5F0' : '#FAEEDA', color: b.paid ? '#0F6E56' : '#854F0B' }}>
                          {b.paid ? 'Pagado' : 'Pendiente'}
                        </span>
                        {b.rfc_receptor && b.cfdi_status && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${cfdiStatusColors[b.cfdi_status]?.bg} ${cfdiStatusColors[b.cfdi_status]?.text}`}>
                                {cfdiStatusColors[b.cfdi_status]?.label}
                            </span>
                        )}
                    </div>
                  </div>
                  <span className="text-xxs text-gray-400" suppressHydrationWarning>
                    {new Date(b.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
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
            return <div key={b.id}>Error</div>;
          }
        })}
      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden md:block overflow-x-auto">
         <table className="w-full text-left text-sm text-gray-700">
           <thead className="bg-gray-100 text-gray-400 uppercase text-xs">
             <tr>
               <th className="px-4 py-3">Paciente</th>
               <th className="px-4 py-3">Fecha</th>
               <th className="px-4 py-3">Tarifa Normal</th>
               <th className="px-4 py-3">Ajustes</th>
               <th className="px-4 py-3">Total</th>
               <th className="px-4 py-3 text-center">Estado</th>
               <th className="px-4 py-3 text-center">CFDI</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-100">
             {Array.isArray(billing) && billing.map((b) => {
               const normal = Number(b.normal_fee);
               const discount = Number(b.discount || 0);
               const extra = Number(b.extra_charge || 0);
               const total = normal + extra - discount;

               const tooltips: any = {
                   pendiente: "Factura pendiente de timbrar",
                   en_proceso: "En proceso con el PAC",
                   timbrado: b.cfdi_uuid ? `CFDI timbrado — UUID: ${b.cfdi_uuid}` : "CFDI timbrado",
                   cancelado: "CFDI cancelado"
               };

               const badgeColors: any = {
                   pendiente: 'bg-gray-100 text-gray-500',
                   en_proceso: 'bg-yellow-100 text-yellow-700',
                   timbrado: 'bg-green-100 text-green-700',
                   cancelado: 'bg-red-100 text-red-700'
               };

               return (
                 <tr key={b.id} className="hover:bg-gray-100/50 transition-colors">
                   <td className="px-4 py-4 font-medium text-gray-900">{b.patientName || b.patients?.name || 'N/A'}</td>
                   <td className="px-4 py-4 text-xs text-gray-400">{new Date(b.created_at).toLocaleDateString('es-MX')}</td>
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
                   <td className="px-4 py-4 text-center">
                       {b.rfc_receptor && b.cfdi_status ? (
                           <div className="relative group inline-block">
                               <span className={`text-[10px] font-bold px-2 py-1 rounded-md cursor-pointer ${badgeColors[b.cfdi_status]}`}>
                                   {b.cfdi_status.toUpperCase()}
                               </span>
                               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-900 text-white text-[10px] p-1.5 rounded shadow-xl r_width max-w-xs z-50 whitespace-nowrap">
                                   {tooltips[b.cfdi_status]}
                               </div>
                           </div>
                       ) : <span className="text-gray-300">-</span>}
                   </td>
                 </tr>
               );
             })}
           </tbody>
         </table>
      </div>

      {/* MODAL REGISTRAR COBRO */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSaveBilling} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
                <h3 className="font-bold text-lg text-gray-900 border-b pb-2">Registrar Cobro</h3>

                {formError && (
                    <div className="bg-red-50 text-red-600 p-2.5 rounded-xl text-xs border border-red-100 flex items-start gap-1.5">
                        <AlertTriangle size={16} /> {formError}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                        <label className="block text-xxs font-black text-gray-400 uppercase">Paciente</label>
                        <select 
                           value={formData.patient_id} 
                           onChange={e => setFormData({ ...formData, patient_id: e.target.value })}
                           className="w-full text-sm border rounded-lg p-2 focus:outline-none focus:border-blue-500 mt-1"
                        >
                            <option value="">Selecciona paciente...</option>
                            {Array.isArray(patients) && patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xxs font-black text-gray-400 uppercase">Tarifa Base ($)</label>
                        <input type="number" required value={formData.normal_fee} onChange={e => setFormData({ ...formData, normal_fee: e.target.value })} className="..." />
                    </div>

                    <div>
                        <label className="block text-xxs font-black text-gray-400 uppercase">Descuento ($)</label>
                        <input type="number" value={formData.discount} onChange={e => setFormData({ ...formData, discount: e.target.value })} className="..." />
                    </div>
                </div>

                <div className="flex items-center gap-2 border-t pt-2">
                    <input type="checkbox" id="isPaid" checked={formData.paid} onChange={e => setFormData({ ...formData, paid: e.target.checked })} className="..." />
                    <label htmlFor="isPaid" className="text-sm font-medium text-gray-700">Ya está pagado</label>
                </div>

                {/* CFDI Sección */}
                <FeatureGate feature="billing_cfdi" showUpgradePrompt={true}>
                    <div className="border-t pt-3 space-y-3">
                         <div className="flex items-center gap-2">
                             <input type="checkbox" id="cfdi" checked={formData.requiresCfdi} onChange={e => setFormData({ ...formData, requiresCfdi: e.target.checked })} className="..." />
                             <label htmlFor="cfdi" className="text-sm font-bold text-gray-800 flex items-center gap-1">¿Requiere Factura? <HelpCircle size={12} className="text-gray-400"/></label>
                         </div>

                         {formData.requiresCfdi && (
                             <div className="space-y-3 bg-gray-50 p-3 rounded-xl border border-gray-100 animate-fadeIn">
                                  <div>
                                      <label className="block text-xxs font-black text-gray-400 uppercase">RFC Receptor</label>
                                      <input 
                                         type="text" 
                                         maxLength={13} 
                                         placeholder="XAXX010101000"
                                         value={formData.rfc_receptor} 
                                         onChange={e => {
                                             setFormData({ ...formData, rfc_receptor: e.target.value });
                                             validateRfc(e.target.value);
                                         }} 
                                         className={`w-full text-sm border rounded-lg p-2 mt-1 focus:outline-none ${rfcError ? 'border-red-500' : 'focus:border-blue-500'}`}
                                      />
                                      {rfcError && <p className="text-xxs text-red-500 mt-0.5">{rfcError}</p>}
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                      <div>
                                          <label className="block text-xxs font-black text-gray-400 uppercase">Uso CFDI</label>
                                          <select value={formData.uso_cfdi} onChange={e => setFormData({ ...formData, uso_cfdi: e.target.value })} className="...">
                                              <option value="G03">G03 - Gastos General</option>
                                              <option value="D01">D01 - Honorarios Médicos</option>
                                              <option value="D02">D02 - Gastos Médicos Incap.</option>
                                              <option value="S01">S01 - Sin Efectos Fiscales</option>
                                          </select>
                                      </div>
                                      <div>
                                          <label className="block text-xxs font-black text-gray-400 uppercase">Forma Pago</label>
                                          <select value={formData.forma_pago} onChange={e => setFormData({ ...formData, forma_pago: e.target.value })} className="...">
                                              <option value="01">01 - Efectivo</option>
                                              <option value="04">04 - Tarjeta Crédito</option>
                                              <option value="03">03 - Transferencia</option>
                                              <option value="28">28 - Tarjeta Débito</option>
                                          </select>
                                      </div>
                                  </div>
                             </div>
                         )}
                    </div>
                </FeatureGate>

                {/* Botones */}
                <div className="flex gap-2 border-t pt-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="w-full py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium">Cancelar</button>
                    <button type="submit" disabled={saving} className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1">
                        {saving && <PlusCircle size={14} className="animate-spin" />} Registrar
                    </button>
                </div>
            </form>
         </div>
      )}
    </div>
  );
}
