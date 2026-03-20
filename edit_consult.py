import re

with open('/home/jorge/MedIQ/MedIQ/src/components/ConsultationForm.tsx', 'r') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "import { Loader2, AlertTriangle } from 'lucide-react';",
    "import { Loader2, AlertTriangle, Sparkles, X, Plus } from 'lucide-react';"
)

# 2. Add new states inside component
state_replacement = """  const [aiSuggestions, setAiSuggestions] = useState<{
    symptoms: string[];
    diagnosis: string[];
    treatment: string[];
  }>({ symptoms: [], diagnosis: [], treatment: [] });

  // AI Integration States
  const [symptomsList, setSymptomsList] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isTreating, setIsTreating] = useState(false);
  const [patientContext, setPatientContext] = useState<any>(null);"""

content = content.replace(
    """  const [aiSuggestions, setAiSuggestions] = useState<{
    symptoms: string[];
    diagnosis: string[];
    treatment: string[];
  }>({ symptoms: [], diagnosis: [], treatment: [] });""",
    state_replacement
)

# 3. Add useEffect to fetch patient context
effect_patient = """  useEffect(() => {
    if (!formData.patient_id) {
      setPatientContext(null);
      return;
    }
    const fetchPatientData = async () => {
      const { data } = await supabase.from('patients').select('*').eq('id', formData.patient_id).single();
      if (data) setPatientContext(data);
    };
    fetchPatientData();
  }, [formData.patient_id, supabase]);

  const mockAiSytmpoms = ['Fiebre', 'Dolor de cabeza', 'Tos seca', 'Dolor de garganta', 'Congestión nasal', 'Fatiga', 'Náuseas'];"""

content = content.replace(
    "  // AI Mock Autocomplete mechanism\n  useEffect(() => {\n    const mockAiSytmpoms = ['Fiebre', 'Dolor de cabeza', 'Tos seca', 'Dolor de garganta', 'Congestión nasal'];",
    effect_patient
)

# 4. Remove diagnosis and treatment mock autocomplete (keep symptoms autocomplete but based on symptomInput)
content = re.sub(
    r"    setAiSuggestions\(\{[\s\S]*?\}\);\n  \}, \[formData\.symptoms, formData\.diagnosis, formData\.treatment\]\);",
    """    setAiSuggestions({
      symptoms: mockAiSytmpoms.filter(s => symptomInput && s.toLowerCase().includes(symptomInput.toLowerCase()) && !symptomsList.includes(s)),
      diagnosis: [],
      treatment: []
    });
  }, [symptomInput, symptomsList]);

  const handleAddSymptom = (s: string) => {
    if (!s.trim()) return;
    if (!symptomsList.includes(s.trim())) {
      setSymptomsList([...symptomsList, s.trim()]);
    }
    setSymptomInput('');
  };

  const generateDiagnosis = async (retry = false) => {
    if (symptomsList.length === 0 && !formData.symptoms) {
      setFeedback({ isOpen: true, title: 'Atención', message: 'Agrega síntomas primero', type: 'error' });
      return;
    }
    setIsDiagnosing(true);
    try {
      const res = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: symptomsList.length > 0 ? symptomsList : [formData.symptoms],
          weight: formData.weight,
          blood_pressure: formData.blood_pressure,
          temperature: formData.temperature,
          age: patientContext?.dob ? Math.floor((new Date().getTime() - new Date(patientContext.dob).getTime()) / 31557600000) : null,
          medical_history: patientContext?.medical_history || ''
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      if (retry) {
        setFormData(prev => ({ ...prev, diagnosis: prev.diagnosis + '\\n\\nOtra opción IA:\\n' + data.diagnosis }));
      } else {
        setFormData(prev => ({ ...prev, diagnosis: data.diagnosis }));
      }
    } catch (err: any) {
      setFeedback({ isOpen: true, title: 'Error IA', message: err.message, type: 'error' });
    } finally {
      setIsDiagnosing(false);
    }
  };

  const generateTreatment = async () => {
    if (!formData.diagnosis) {
      setFeedback({ isOpen: true, title: 'Atención', message: 'Genera o escribe un diagnóstico primero', type: 'error' });
      return;
    }
    setIsTreating(true);
    try {
      const res = await fetch('/api/ai/treat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: symptomsList.length > 0 ? symptomsList : [formData.symptoms],
          diagnosis: formData.diagnosis,
          weight: formData.weight,
          blood_pressure: formData.blood_pressure,
          temperature: formData.temperature,
          age: patientContext?.dob ? Math.floor((new Date().getTime() - new Date(patientContext.dob).getTime()) / 31557600000) : null,
          medical_history: patientContext?.medical_history || ''
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFormData(prev => ({ ...prev, treatment: data.treatment }));
    } catch (err: any) {
      setFeedback({ isOpen: true, title: 'Error IA', message: err.message, type: 'error' });
    } finally {
      setIsTreating(false);
    }
  };
""",
    content
)

# 5. Modify Handle Submit to include symptomsList -> String
content = content.replace(
    "symptoms: formData.symptoms || null,",
    "symptoms: symptomsList.length > 0 ? symptomsList.join(', ') : (formData.symptoms || null),"
)

# 6. Replace JSX of Symptoms, Diagnosis, Treatment
start_s = content.find('{/* Symptoms filed with AI Autocomplete */}')
end_s = content.find('{/* AI Warning Footer */}')

new_jsx = """{/* Symptoms (Capsules) */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Síntomas *</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {symptomsList.map(s => (
              <span key={s} className="inline-flex items-center gap-1 bg-gray-100 border-[0.5px] border-black/8 text-gray-800 px-2 py-1 rounded-md text-xs font-medium">
                {s}
                <button type="button" onClick={() => setSymptomsList(symptomsList.filter(item => item !== s))} className="text-gray-400 hover:text-red-500"><X size={12}/></button>
              </span>
            ))}
          </div>
          <div className="relative flex gap-2">
            <input
              type="text"
              value={symptomInput}
              onChange={(e) => setSymptomInput(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter'){ e.preventDefault(); handleAddSymptom(symptomInput); } }}
              className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="Escribe síntoma y presiona Enter..."
            />
            <button type="button" onClick={() => handleAddSymptom(symptomInput)} className="px-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-600">
              <Plus size={16}/>
            </button>
            {aiSuggestions.symptoms.length > 0 && (
              <div className="absolute top-full z-10 w-full shadow-lg rounded-xl mt-1 p-3 bg-[#F8F9FA] border border-gray-100 border-l-[2px] border-l-[#1A4A8A]">
                <div className="mb-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ backgroundColor: '#E8F0FB', color: '#1A4A8A' }}>
                    ✦ Sugerencias IA
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {aiSuggestions.symptoms.map(s => (
                    <button key={s} type="button" onClick={() => handleAddSymptom(s)} className="text-xs bg-white border-[0.5px] border-black/8 text-gray-700 px-2.5 py-1.5 rounded-md hover:bg-gray-50 transition-colors shadow-sm">{s}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Diagnosis */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-medium text-gray-500">Diagnóstico</label>
            <div className="flex gap-2">
              {formData.diagnosis && (
                 <button type="button" onClick={() => generateDiagnosis(true)} disabled={isDiagnosing} className="text-[10px] font-bold px-2 py-1 rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors disabled:opacity-50">
                    Sugerir otro
                 </button>
              )}
              <button type="button" onClick={() => generateDiagnosis(false)} disabled={isDiagnosing} className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md transition-colors disabled:opacity-50" style={{ backgroundColor: '#E8F0FB', color: '#1A4A8A' }}>
                {isDiagnosing ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />} Sugerencia IA
              </button>
            </div>
          </div>
          <textarea
            name="diagnosis"
            rows={3}
            value={formData.diagnosis}
            onChange={handleInputChange}
            className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
            placeholder="Ej: Rinofaringitis aguda..."
          />
        </div>

        {/* Treatment */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-medium text-gray-500">Tratamiento / Receta</label>
            <button type="button" onClick={generateTreatment} disabled={isTreating} className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md transition-colors disabled:opacity-50" style={{ backgroundColor: '#E8F0FB', color: '#1A4A8A' }}>
              {isTreating ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />} Sugerir Tratamiento IA
            </button>
          </div>
          <textarea
            name="treatment"
            rows={4}
            value={formData.treatment}
            onChange={handleInputChange}
            className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
            placeholder="Prescribir medicamentos y dosis..."
          />
        </div>

        """

content = content[:start_s] + new_jsx + content[end_s:]

with open('/home/jorge/MedIQ/MedIQ/src/components/ConsultationForm.tsx', 'w') as f:
    f.write(content)
print("Success")
