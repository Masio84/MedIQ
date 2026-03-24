'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type Role = 'admin' | 'doctor' | 'assistant' | 'superadmin';

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
  clinicId: string | null;
  setClinicId: (id: string | null) => void;
  doctorId: string | null; // For assistants linked to doctor
  setDoctorId: (id: string | null) => void;
  isLoading: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ 
  children, 
  initialRole,
  initialClinicId = null,
  initialDoctorId = null
}: { 
  children: ReactNode; 
  initialRole: Role;
  initialClinicId?: string | null;
  initialDoctorId?: string | null;
}) {
  const [role, setRole] = useState<Role>(initialRole);
  const [clinicId, setClinicId] = useState<string | null>(initialClinicId);
  const [doctorId, setDoctorId ] = useState<string | null>(initialDoctorId);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <RoleContext.Provider value={{ 
      role, setRole, 
      clinicId, setClinicId,
      doctorId, setDoctorId, 
      isLoading 
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
