SAFE MODE - MedIQ

Este sistema protege la seguridad del proyecto contra modificaciones accidentales por IA.

USO DIARIO:

1. Al iniciar trabajo:
   - Copiar contenido de /ai/START_PROMPT.txt
   - Pegarlo en Antigravity

2. Antes de cambios importantes:
   - Ejecutar /ai/security_check.sql

3. En cada prompt:
   - Incluir: "SAFE MODE activo. No modificar seguridad."

4. Si se detecta algo raro:
   - Detener cambios inmediatamente

OBJETIVO:
Evitar:
- duplicación de políticas RLS
- uso de lógica insegura
- modificación de auditoría
- rompimiento de aislamiento por doctor
