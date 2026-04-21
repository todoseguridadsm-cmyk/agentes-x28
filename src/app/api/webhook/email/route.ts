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

    // 1. Manejar tanto texto plano directo (Raw POST) como JSON (De Zapier/Make)
    let rawText = "";
    const contentType = req.headers.get("content-type") || "";
    const rawBody = await req.text();


    if (contentType.includes("application/json")) {
      try {
        const jsonBody = JSON.parse(rawBody);
        // Intentar sacar el texto directo de los campos comunes
        rawText = jsonBody?.data?.text || jsonBody?.data?.html || jsonBody.body_plain || jsonBody.body || jsonBody.text || jsonBody.content || jsonBody.raw;
        
        // --- NUEVA LÓGICA: Si no hay cuerpo pero hay un email_id, lo buscamos en la API de Resend ---
        const emailId = jsonBody?.data?.email_id || jsonBody?.email_id;
        if (!rawText && emailId) {
          console.log("Cuerpo vacío en webhook, intentando recuperar email_id:", emailId);

          const res = await fetch(`https://api.resend.com/emails/${emailId}`, {
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
            }
          });
          if (res.ok) {
            const fullEmail = await res.json();
            rawText = fullEmail.text || fullEmail.html || "";
          } else {
            const errorData = await res.text();
            console.error(`Resend API Error (${res.status}):`, errorData);
            // Si falló la API, guardamos el error en rawText para verlo en el dashboard
            rawText = `ERROR_RESEND_API_${res.status}: ${errorData}`;
          }

        }

        // Si sigue sin haber texto, volcamos todo el JSON para debug
        if (!rawText && typeof jsonBody === 'object') {
           rawText = JSON.stringify(jsonBody); 
        }
      } catch (e) {
        rawText = rawBody;
      }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {

      try {
         const searchParams = new URLSearchParams(rawBody);
         rawText = searchParams.get('body_plain') || searchParams.get('body') || searchParams.get('text') || searchParams.get('raw') || decodeURIComponent(rawBody);
      } catch(e) {
         rawText = decodeURIComponent(rawBody);
      }
    } else {
      rawText = rawBody;
    }


    const parsed = parseX28Email(rawText);


    if (parsed.type === "DESCONOCIDO") {
       // Intentar extraer quién envió el mail para el debug
       let sender = "Desconocido";
       try {
         const json = JSON.parse(rawBody);
         sender = json?.data?.from || json?.from || "Desconocido";
       } catch(e) {}

       await supabase.from('events').insert({
          agent_id: agentId,
          event_type: "FORMATO_DESCONOCIDO",
          priority: "GRIS",
          description: `Formato no reconocido. Enviado por: ${sender}`,
          raw_email_text: rawText.substring(0, 1500)
       });
       return NextResponse.json({ success: true, message: "Guardado como desconocido para debug." });
    }


    // 2. Procesar Eventos (pueden ser uno o muchos)
    const eventsToProcess = [];

    if (parsed.type === "MULTIPLE_EVENTS" && parsed.events) {
        eventsToProcess.push(...parsed.events);
    } else if (parsed.type === "REPORTE_EVENTOS" && parsed.events) {
        eventsToProcess.push(...parsed.events);
    } else if (parsed.type === "SEÑAL_NO_RECIBIDA") {
        eventsToProcess.push({
            account: parsed.account,
            name: parsed.name,
            date: new Date().toISOString(),
            description: "Se ha generado una Señal No Recibida.",
            priority: "AMARILLO" as const,
            eventType: "FALLO_SEÑAL",
            zone: ""
        });
    }

    // Procesar cada evento encontrado
    for (const ev of eventsToProcess) {
        let customerId = null;
        const accountNum = ev.account || parsed.account;
        const customerName = ev.name || parsed.name;

        if (accountNum) {
            // Buscar o Crear Cliente
            const { data: customer } = await supabase
                .from('customers')
                .select('id')
                .eq('account_number', accountNum)
                .eq('agent_id', agentId)
                .single();
            
            if (customer) {
                customerId = customer.id;
            } else {
                const { data: newCustomer } = await supabase
                    .from('customers')
                    .insert({ 
                        agent_id: agentId,
                        account_number: accountNum, 
                        full_name: customerName || "Cliente Desconocido",
                    })
                    .select('id')
                    .single();
                
                customerId = newCustomer?.id;
            }
        }

        // Insertar en la tabla de eventos
        await supabase.from('events').insert({
            agent_id: agentId,
            customer_id: customerId,
            account_number: accountNum,
            event_type: ev.eventType || (ev.priority === "ROJO" ? "ALERTA_ROBO" : "FALLO_SEÑAL"),
            priority: ev.priority || "AMARILLO",
            description: `${ev.description} ${ev.zone ? `(Zona: ${ev.zone})` : ""}`.trim(),
            raw_email_text: rawText
        });
    }

    // 3. Manejo especial de Servicio Técnico
    if (parsed.type === "SERVICIO_TECNICO" && parsed.technicalOrder) {
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

        await supabase.from('technical_orders').insert({
            agent_id: agentId,
            customer_id: customerId,
            priority: "AZUL",
            observations: parsed.technicalOrder.observations
        });
    }

    return NextResponse.json({ success: true, message: "Emails procesados correctamente." });


  } catch (error: any) {
    console.error("Webhook Error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
