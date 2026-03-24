import { Resend } from 'resend';
import { NextResponse } from 'next/server';

// Inicializar con la clave, si no existe no romperá el build pero regresará error en POST
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function POST(req: Request) {
  try {
    const { email, folio, pdfBase64, patientName } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'El correo electrónico es requerido.' }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
       return NextResponse.json({ 
         success: false, 
         error: 'Configuración SMTP pendiente. El Desarrollador debe ingresar su RESEND_API_KEY en las variables de entorno (.env).' 
       }, { status: 500 });
    }

    // fallback si el correo es de desarrollo
    let fromEmail = 'MedIQ <onboarding@resend.dev>'; // Por defecto para Sandbox de Resend
    // Si tienen dominio verificado, pueden usar uno propio. Para no fallar por defecto, se usa onboarding.

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `Tu Certificado Médico - Folio ${folio || 'N/A'}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; rounded-lg: 12px;">
          <h2 style="color: #2563eb; margin-bottom: 12px;">MedIQ</h2>
          <p style="font-size: 14px;">Hola <strong>${patientName || 'Paciente'}</strong>,</p>
          <p style="font-size: 14px;">Te compartimos tu Certificado Médico expedido en nuestro sistema con el Folio: <strong>${folio || 'Sin Folio'}</strong>.</p>
          <p style="font-size: 14px; margin-top: 20px;">Saludos,<br/><strong>Equipo Médico MedIQ</strong></p>
        </div>
      `,
      attachments: pdfBase64 ? [
        {
          filename: `Certificado_${folio || 'MedIQ'}.pdf`,
          content: pdfBase64.split(',')[1], // Extraer solo la cadena base64
        }
      ] : []
    });

    if (error) {
       throw error;
    }

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('Error en API Send:', error);
    return NextResponse.json({ success: false, error: error.message || 'Error al enviar correo.' }, { status: 500 });
  }
}
