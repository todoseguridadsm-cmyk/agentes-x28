"use server";

import { supabase, supabaseAdmin } from "./supabase";
import { cookies } from "next/headers";

export async function loginAgentAction(email: string) {
  const { data: agent, error } = await supabase
    .from("agents")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !agent) {
    return { error: "Cuenta no encontrada. Verifica tu correo o regístrate." };
  }

  const cookieStore = await cookies();
  cookieStore.set("agent_id", agent.id, { 
     secure: process.env.NODE_ENV === "production", 
     maxAge: 60 * 60 * 24 * 7 
  });
  return { success: true };
}

export async function registerAgentAction(data: { email: string, firstName: string, lastName: string, phone: string }) {
  const { data: existing } = await supabase.from("agents").select("id").eq("email", data.email).single();
  if (existing) return { error: "Este correo ya está registrado." };

  const randomStr = Math.random().toString(36).substring(2, 10);
  const webhookToken = `webhook_xtoken_${randomStr}`;

  const { data: newAgent, error } = await supabase.from("agents").insert({
     email: data.email,
     first_name: data.firstName,
     last_name: data.lastName,
     phone: data.phone,
     webhook_token: webhookToken
  }).select("id").single();

  if (error || !newAgent) return { error: "Falló la creación." };

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
  const { error } = await supabaseAdmin.from("technical_orders").update({ status: "COMPLETADA" }).eq("id", orderId);
  return { success: !error, error };
}

export async function deleteOrder(orderId: string) {
  const { error } = await supabaseAdmin.from("technical_orders").delete().eq("id", orderId);
  if (error) console.error("Error deleting order:", error);
  return { success: !error, error };
}

export async function deleteEvent(eventId: string) {
  const { error } = await supabaseAdmin.from("events").delete().eq("id", eventId);
  if (error) console.error("Error deleting event:", error);
  return { success: !error, error };
}

export async function deleteEventsByAccount(agentId: string, account: string) {
  const { error } = await supabaseAdmin.from("events").delete().eq("agent_id", agentId).eq("account_number", account);
  return { success: !error, error };
}

export async function deleteOrdersByAccount(agentId: string, account: string) {
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("agent_id", agentId)
    .eq("account_number", account)
    .single();

  if (!customer) return { error: "Cliente no encontrado." };

  const { error } = await supabaseAdmin
    .from("technical_orders")
    .delete()
    .eq("agent_id", agentId)
    .eq("customer_id", customer.id);
    
  return { success: !error, error };
}
