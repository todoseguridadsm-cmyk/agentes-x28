import { NextResponse } from 'next/server';
import { parseX28Email } from '@/lib/parser';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    // 0. Autenticar al Agente usando el ?token=
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
       return NextResponse.json({ error: "Token de Agente Faltante" }, { status: 401 });
    }

    const { data: agent } = await supabase.from('agents').select('id').eq('webhook_token', token).single();
    
    if (!agent) {
       return NextResponse.json({ error: "Token Invalido" }, { status: 403 });
    }
    const agentId = agent.id;

    // 1. Usar el "cerebro" para parsear texto
    const body = await req.text();
    const rawText = body || "";
    const parsed = parseX28Email(rawText);

    if (parsed.type === "DESCONOCIDO") {
      return NextResponse.json({ message: "Formato no detectado", parsed }, { status: 400 });
    }

    // 2. Manejo de Cliente: Buscar o Crear atado al Agente
    let customerId = null;
    if (parsed.account) {
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('account_number', parsed.account)
        .eq('agent_id', agentId)
        .single();
      
      if (customer) {
         customerId = customer.id;
      } else {
         const { data: newCustomer } = await supabase
           .from('customers')
           .insert({ 
               agent_id: agentId,
               account_number: parsed.account, 
               full_name: parsed.name,
               phone: parsed.technicalOrder?.phone,
               address: parsed.technicalOrder?.address,
               panel_model: parsed.technicalOrder?.panelModel
           })
           .select('id')
           .single();
           
         customerId = newCustomer?.id;
      }
    }

    // 3. Insertar dependendiendo del tipo (atado al Agente)
    if (parsed.type === "SEÑAL_NO_RECIBIDA") {
       await supabase.from('events').insert({
          agent_id: agentId,
          customer_id: customerId,
          account_number: parsed.account,
          event_type: "FALLO_SEÑAL",
          priority: "AMARILLO",
          description: "GPRS se ha generado una Señal No Recibida.",
          raw_email_text: rawText
       });
    }

    if (parsed.type === "REPORTE_EVENTOS" && parsed.events) {
       const eventsToInsert = parsed.events.map(ev => ({
          agent_id: agentId,
          customer_id: customerId,
          account_number: parsed.account,
          event_type: "ALERTA_ROBO",
          priority: "ROJO",
          description: `${ev.description} en zona: ${ev.zone}. Fecha: ${ev.date}`,
          raw_email_text: rawText
       }));
       await supabase.from('events').insert(eventsToInsert);
    }

    if (parsed.type === "SERVICIO_TECNICO" && parsed.technicalOrder) {
       await supabase.from('technical_orders').insert({
          agent_id: agentId,
          customer_id: customerId,
          priority: "AZUL",
          observations: parsed.technicalOrder.observations
       });
    }

    return NextResponse.json({ success: true, message: "Evento procesado y asignado al Agente!" });

  } catch (error: any) {
    console.error("Webhook Error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
