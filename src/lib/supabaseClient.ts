import { createClient } from './supabase/client';

const supabase = createClient();

export const createPatient = async (patient: {
  name: string;
  birthdate?: string;
  phone?: string;
  email?: string;
  address?: string;
  allergies?: string;
  medical_history?: string;
}) => {
  return await supabase.from('patients').insert([patient]).select();
};

export const getPatients = async () => {
  return await supabase.from('patients').select('*').order('created_at', { ascending: false });
};

export const createConsultation = async (consultation: {
  patient_id: string;
  doctor_id: string;
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  weight?: number;
  blood_pressure?: string;
  temperature?: number;
  notes?: string;
}) => {
  return await supabase.from('consultations').insert([consultation]).select();
};

export const getPatientHistory = async (patientId: string) => {
  return await supabase
    .from('consultations')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
};

export const createBillingRecord = async (billing: {
  consultation_id: string;
  patient_id: string;
  normal_fee: number;
  discount?: number;
  extra_charge?: number;
}) => {
  return await supabase.from('billing').insert([billing]).select();
};

export { supabase };
