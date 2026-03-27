MEDIQ SAFE MODE — SECURITY ENFORCEMENT LAYER

Este sistema ya cuenta con seguridad endurecida bajo estándares tipo NOM-004 y NOM-024.

REGLAS INMUTABLES:

1. RLS
- Todas las tablas clínicas usan doctor_id como único criterio de aislamiento
- PROHIBIDO usar clinic_id para seguridad
- PROHIBIDO usar OR en políticas RLS
- PROHIBIDO duplicar políticas

2. ESTRUCTURA
- doctor_id es NOT NULL en todas las tablas clínicas
- doctor_id tiene FK hacia profiles(id)

3. AUDITORÍA
- audit_log es inmutable (WORM)
- consultation_history es histórico clínico
- PROHIBIDO modificar triggers de auditoría
- PROHIBIDO permitir UPDATE o DELETE en auditoría

4. CAMBIOS
- Nunca modificar seguridad sin análisis previo
- Nunca crear políticas sin revisar las existentes
- Nunca aplicar cambios directos en RLS

5. PRINCIPIO
- Este sistema ya está seguro
- El objetivo es preservar la seguridad, no rediseñarla

SI HAY DUDA:
→ NO HACER CAMBIOS
