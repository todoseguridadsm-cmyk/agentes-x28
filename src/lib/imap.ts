
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { supabase } from './supabase';
import { parseX28Email } from './parser';

export async function fetchAndProcessEmails() {
  const client = new ImapFlow({
    host: process.env.IMAP_HOST || 'imap.hostinger.com',
    port: parseInt(process.env.IMAP_PORT || '993'),
    secure: true,
    auth: {
      user: process.env.IMAP_USER || '',
      pass: process.env.IMAP_PASS || ''
    },
    logger: false
  });

  try {
    await client.connect();
    let lock = await client.getMailboxLock('INBOX');
    
    try {
      // 1. Obtener todos los agentes para saber a quién pertenecen los mails reenviados
      const { data: agents } = await supabase.from('agents').select('id, email');
      if (!agents) throw new Error("No se pudieron cargar los agentes.");

      // 2. Buscar mails no leídos
      for await (let message of client.list({ seen: false }, { source: true })) {
        const parsed = await simpleParser(message.source);
        const bodyText = parsed.text || "";
        const subject = parsed.subject || "";
        
        // 3. Identificar al Agente
        // Buscamos el mail del agente en el cuerpo (cuando se reenvía, suele aparecer "To: agente@mail.com")
        // O en los headers de entrega original si están disponibles
        let targetAgent = null;
        
        // Estrategia A: Buscar en el cuerpo del mensaje (Forwarded lines)
        for (const agent of agents) {
          if (bodyText.includes(agent.email) || subject.includes(agent.email)) {
            targetAgent = agent;
            break;
          }
        }
        
        // Estrategia B: Si no se encontró, buscar en el header 'to' o 'delivered-to' (por si acaso)
        if (!targetAgent) {
           const toHeader = parsed.to?.text || "";
           for (const agent of agents) {
              if (toHeader.includes(agent.email)) {
                 targetAgent = agent;
                 break;
              }
           }
        }

        if (targetAgent) {
          console.log(`Procesando mail para agente: ${targetAgent.email}`);
          
          // 4. Parsear el contenido de X-28
          const x28Data = parseX28Email(bodyText);
          
          if (x28Data.type !== "DESCONOCIDO") {
             // Reutilizamos la lógica de inserción (aquí simplificada)
             await processX28Data(x28Data, targetAgent.id, bodyText);
          } else {
             // Guardar como desconocido para debug si es necesario
             await supabase.from('events').insert({
                agent_id: targetAgent.id,
                event_type: "FORMATO_DESCONOCIDO",
                priority: "GRIS",
                description: `Mail recibido de ${parsed.from?.text} pero formato no reconocido.`,
                raw_email_text: bodyText.substring(0, 1500)
             });
          }
        }

        // Marcar como leído
        await client.messageFlagsAdd(message.uid, ['\\Seen'], { uid: true });
      }
    } finally {
      lock.release();
    }

    await client.logout();
    return { success: true };
  } catch (error) {
    console.error("IMAP Error:", error);
    try { await client.logout(); } catch(e) {}
    throw error;
  }
}

async function processX28Data(parsed: any, agentId: string, rawText: string) {
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
            priority: "AMARILLO",
            eventType: "FALLO_SEÑAL",
            zone: ""
        });
    }

    for (const ev of eventsToProcess) {
        let customerId = null;
        const accountNum = ev.account || parsed.account;
        const customerName = ev.name || parsed.name;

        if (accountNum) {
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
}

