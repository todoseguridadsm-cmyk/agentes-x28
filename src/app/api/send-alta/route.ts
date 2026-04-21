import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';
import { cookies } from "next/headers";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const agentId = cookieStore.get("agent_id")?.value;

    if (!agentId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: agent } = await supabase.from('agents').select('*').eq('id', agentId).single();
    if (!agent) {
      return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });
    }

    const formData = await req.formData();
    const cliente = formData.get('cliente') as string || '';
    const cuenta = formData.get('cuenta') as string || '';
    const instalador = formData.get('instalador') as string || '';
    const plan = formData.get('plan') as string || '';
    const photos = formData.getAll('photos') as File[];

    if (!cliente || !instalador) {
       return NextResponse.json({ error: "Omitiste campos obligatorios (Nombre e Instalador)" }, { status: 400 });
    }

    // Convertir a Buffer (la API de Resend toma un array de numbers o un Buffer puro o strings base64, 
    // en la SDK de resend para NextJS podemos pasar content: Buffer o Uint8Array)
    const attachments = await Promise.all(photos.map(async (file) => {
       const bytes = await file.arrayBuffer();
       return {
          filename: file.name,
          content: Buffer.from(bytes) // Next.js backend supports Buffer
       };
    }));

    const agentEmail = agent.email;
    const agentName = `${agent.first_name} ${agent.last_name}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; color: #333;">
        <h2 style="color: #ea580c;">Alta de Monitoreo - Sistema Agentes</h2>
        <p>Se ha generado una nueva presentación de alta de monitoreo emitida por la Agencia <b>${agentName}</b>.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
           <tr style="background-color: #f8f9fa;">
               <td style="padding: 10px; border: 1px solid #ddd; width: 30%;"><b>Cliente:</b></td>
               <td style="padding: 10px; border: 1px solid #ddd;">${cliente.toUpperCase()}</td>
           </tr>
           <tr>
               <td style="padding: 10px; border: 1px solid #ddd;"><b>N° Cuenta:</b></td>
               <td style="padding: 10px; border: 1px solid #ddd;">${cuenta.toUpperCase() || 'A Asignar'}</td>
           </tr>
           <tr style="background-color: #f8f9fa;">
               <td style="padding: 10px; border: 1px solid #ddd;"><b>Plan Contratado:</b></td>
               <td style="padding: 10px; border: 1px solid #ddd;">${plan.toUpperCase()}</td>
           </tr>
           <tr>
               <td style="padding: 10px; border: 1px solid #ddd;"><b>Instalador:</b></td>
               <td style="padding: 10px; border: 1px solid #ddd;">${instalador.toUpperCase()}</td>
           </tr>
        </table>
        <p style="margin-top: 25px;">Se adjuntan ${attachments.length} fotografías / digitalizaciones correspondientes a esta instalación.</p>
        <p style="margin-top: 30px; font-size: 11px; color: #888;">Este correo es generado automáticamente por el portal SaaS de Agentes X-28.</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'Agentes X-28 <altas@alertas.agentes28.com>',
      to: ['cuidar@x-28.com'],
      cc: [agentEmail], // El agente obtiene su propia copia exacta de respaldo
      replyTo: agentEmail, // Si X-28 toca 'Responder', le responde directo al agente
      subject: `ALTA MONITOREO | ${cliente.toUpperCase()} | CTA: ${cuenta || 'S-D'}`,
      html: htmlBody,
      attachments: attachments,
    });

    if (error) {
       console.error("Resend Error:", error);
       return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "¡Alta despachada con éxito!" });
  } catch (error: any) {
    console.error("Altas Catch Error:", error);
    return NextResponse.json({ error: error.message || "Error desconocido procesando las imágenes." }, { status: 500 });
  }
}
