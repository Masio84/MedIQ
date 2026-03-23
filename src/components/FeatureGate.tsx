'use client';

import { useFeatures } from '@/hooks/useFeatures';
import { useRole } from '@/context/RoleContext';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { ReactNode } from 'react';

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export default function FeatureGate({ feature, children, fallback = null, showUpgradePrompt = false }: FeatureGateProps) {
  const { clinicId } = useRole();
  const { hasFeature, upgradeHint, isLoading } = useFeatures(clinicId);

  if (isLoading) {
      return fallback ? <>{fallback}</> : null; // evitamos flashes
  }

  const enabled = hasFeature(feature);

  if (enabled) {
      return <>{children}</>;
  }

  if (showUpgradePrompt) {
      const hint = upgradeHint(feature);
      return (
          <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-amber-700 text-xxs font-bold flex items-center gap-2">
              <AlertTriangle size={16} /> 
              <span>Esta función está disponible en el plan <strong>{hint}</strong>. Contacta a tu administrador.</span>
          </div>
      );
  }

  return fallback ? <>{fallback}</> : null;
}
