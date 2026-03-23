import { useState, useEffect } from 'react';

export function useFeatures(clinic_id: string | null | undefined) {
  const [features, setFeatures] = useState<Record<string, { enabled: boolean; upgrade_hint?: string }>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!clinic_id) return;

    const cacheKeyPrefix = `mediq_features_${clinic_id}_v`;
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;

    // 1. Buscar en sessionStorage una versión existente
    let cachedData: any = null;
    let foundKey = '';

    for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k?.startsWith(cacheKeyPrefix)) {
            const timestamp = parseInt(k.replace(cacheKeyPrefix, ''), 10);
            if (now - timestamp < thirtyMinutes) {
                 cachedData = sessionStorage.getItem(k);
                 foundKey = k;
            } else {
                 sessionStorage.removeItem(k); // obsoleto
            }
            break;
        }
    }

    if (cachedData) {
        try {
            setFeatures(JSON.parse(cachedData));
            setIsLoading(false);
            return;
        } catch (e) {
            sessionStorage.removeItem(foundKey);
        }
    }

    // 2. Si no hay cache válido, consultar API
    const fetchFeatures = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/clinic/features?clinic_id=${clinic_id}`);
            if (res.ok) {
                const data = await res.json();
                setFeatures(data);

                // Guardar en sessionStorage
                const newKey = `${cacheKeyPrefix}${Date.now()}`;
                sessionStorage.setItem(newKey, JSON.stringify(data));
            }
        } catch (error) {
            console.error('Error cargando features:', error);
        } finally {
            setIsLoading(false);
        }
    };

    fetchFeatures();
  }, [clinic_id]);

  const hasFeature = (key: string): boolean => {
      return features[key]?.enabled === true;
  };

  const upgradeHint = (key: string): string => {
      return features[key]?.upgrade_hint || 'Enterprise';
  };

  return { features, isLoading, hasFeature, upgradeHint };
}
