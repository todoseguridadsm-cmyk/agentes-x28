"use server";

import { supabase } from "./supabase";
import { cookies } from "next/headers";

export async function loginAgentAction(email: string) {
  // Para MVP simple por ahora, sólo nos basamos en el Email exacto.
  // En producción usaríamos constraseña hasheada.
  const { data: agent, error } = await supabase
    .from("agents")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !agent) {
    return { error: "Cuenta no encontrada. Verifica tu correo o regístrate." };
  }

  // Set the session cookie
  const cookieStore = await cookies();
  cookieStore.set("agent_id", agent.id, { 
     secure: process.env.NODE_ENV === "production", 
     maxAge: 60 * 60 * 24 * 7 
  });
  return { success: true };
}

export async function registerAgentAction(data: { email: string, firstName: string, lastName: string, phone: string }) {
  // 1. Verificar si ya existe
  const { data: existing } = await supabase.from("agents").select("id").eq("email", data.email).single();
  
  if (existing) {
    return { error: "Este correo ya está registrado." };
  }

  // 2. Generar el webhook_token único
  const randomStr = Math.random().toString(36).substring(2, 10);
  const webhookToken = `webhook_xtoken_${randomStr}`;

  // 3. Crear Agente
  const { data: newAgent, error } = await supabase.from("agents").insert({
     email: data.email,
     first_name: data.firstName,
     last_name: data.lastName,
     phone: data.phone,
     webhook_token: webhookToken
  }).select("id").single();

  if (error || !newAgent) {
    return { error: "Falló la creación de cuenta en base de datos. Intenta nuevamente." };
  }

  // 4. Set Cookie Session
  const cookieStore = await cookies();
  cookieStore.set("agent_id", newAgent.id, { 
    secure: process.env.NODE_ENV === "production", 
    maxAge: 60 * 60 * 24 * 7 
  });
  return { success: true };
}

export async function logoutAgentAction() {
    const cookieStore = await cookies();
    cookieStore.delete("agent_id");
}

export async function markOrderCompleted(orderId: string) {
  const { error } = await supabase.from("technical_orders").update({ status: "COMPLETADA" }).eq("id", orderId);
  return { success: !error, error };
}

export async function deleteOrder(orderId: string) {
  const { error } = await supabase.from("technical_orders").delete().eq("id", orderId);
  return { success: !error, error };
}


export async function deleteEvent(eventId: string) {
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  return { success: !error, error };
}

export async function deleteEventsByCategory(agentId: string, priority: string) {
  const { error } = await supabase.from("events").delete().eq("agent_id", agentId).eq("priority", priority);
  return { success: !error, error };
}

export async function deleteAllOrders(agentId: string) {
  const { error } = await supabase.from("technical_orders").delete().eq("agent_id", agentId);
  return { success: !error, error };
}


