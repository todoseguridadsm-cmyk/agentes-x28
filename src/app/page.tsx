
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/DashboardClient";

export default async function Home() {
  const supabase = await createClient();

  // 1. Obtener el agente actual (simulado o desde auth)
  const { data: agent } = await supabase
    .from("agents")
    .select("*")
    .eq("email", "todoseguridadsm@outlook.com")
    .single();

  if (!agent) {
    return <div className="p-20 text-center text-white">Agente no encontrado. Verifica la tabla 'agents'.</div>;
  }

  // 2. Obtener eventos y órdenes técnicas
  const { data: events } = await supabase
    .from("events")
    .select("*, customers(*)")
    .eq("agent_id", agent.id)
    .order("created_at", { ascending: false });

  const { data: orders } = await supabase
    .from("technical_orders")
    .select("*, customers(*)")
    .eq("agent_id", agent.id)
    .order("created_at", { ascending: false });

  // 3. Unificar y clasificar para el dashboard
  const allFeedItems = [...(events || []), ...(orders || [])].sort((a, b) => {
     return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const rojoItems: any[] = [];
  const amarilloItems: any[] = [];
  const azulItems: any[] = [];
  const grisItems: any[] = [];

  allFeedItems.forEach(item => {
     const isEvent = item.event_type !== undefined;

     const parsedItem = {
        id: item.id,
        type: (item.priority || "GRIS") as "ROJO" | "AMARILLO" | "AZUL" | "GRIS",
        customerName: item.customers?.full_name || "Desconocido",
        account: item.account_number || item.customers?.account_number || "S/D",
        description: isEvent ? item.description : item.observations || "Alta Pendiente",
        date: new Date(item.created_at).toLocaleString('es-AR', { 
            timeZone: 'America/Argentina/Buenos_Aires',
            hour12: false 
        }),
        status: item.status,
        details: item
     };

     if (parsedItem.type === "ROJO") rojoItems.push(parsedItem);
     else if (parsedItem.type === "AMARILLO") amarilloItems.push(parsedItem);
     else if (parsedItem.type === "AZUL") azulItems.push(parsedItem);
     else grisItems.push(parsedItem);
  });

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden font-sans flex flex-col">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image 
          src="/los especialistas 1.jpg"
          alt="Fondo Los Especialistas"
          fill
          className="object-cover object-top opacity-[0.35] brightness-90 mix-blend-lighten" 
          quality={100}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-black/20 via-black/50 to-black"></div>
      </div>
      
      <nav className="relative z-10 w-full max-w-6xl mx-auto px-6 py-8 flex justify-between items-center">
        <a href="https://x-28.com/" target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition">
          <Image 
            src="/logo x-28.jpg" 
            alt="X-28 Alarmas Logo" 
            width={350} 
            height={120} 
            className="w-40 md:w-56 h-auto drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]"
            priority
          />
        </a>
        <form action="/login" method="GET">
           <button type="submit" className="text-xs text-slate-400 border border-slate-700/50 rounded-full px-4 py-1.5 hover:bg-white/10 transition">Cerrar Sesión</button>
        </form>
      </nav>

      <a href="tel:08105555666" className="fixed bottom-6 right-6 z-50 bg-green-600 hover:bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] rounded-full px-6 py-4 font-bold tracking-widest text-sm flex items-center gap-2 transition hover:scale-105">
         📞 0810-555-5666
      </a>

      <DashboardClient agent={agent} rojoItems={rojoItems} amarilloItems={amarilloItems} azulItems={azulItems} grisItems={grisItems} />
    </main>
  );
}
