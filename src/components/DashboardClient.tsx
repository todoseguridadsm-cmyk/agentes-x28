"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { markOrderCompleted, deleteOrder, deleteEvent } from "@/lib/actions";

type Item = {
  id: string;
  type: "ROJO" | "AMARILLO" | "AZUL";
  customerName: string;
  account: string;
  description: string;
  date: string;
  status: string;
  details?: any;
};

export default function DashboardClient({ agent, rojoItems, amarilloItems, azulItems }: { agent: any, rojoItems: Item[], amarilloItems: Item[], azulItems: Item[] }) {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const router = useRouter();

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleCompleteOrder = async (id: string, e: React.MouseEvent) => {
     e.stopPropagation();
     await markOrderCompleted(id);
     router.refresh();
  };

  const handleDeleteOrder = async (id: string, e: React.MouseEvent) => {
     e.stopPropagation();
     await deleteOrder(id);
     router.refresh();
  };

  const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
     e.stopPropagation();
     await deleteEvent(id);
     router.refresh();
  };

  const renderGroupList = (items: Item[]) => {
    if (items.length === 0) return <div className="text-slate-400 py-4 px-2 text-sm italic">No hay registros pendientes en esta categoría.</div>;
    
    return (
      <div className="flex flex-col gap-3 mt-4 w-full">
        {items.map((it, idx) => {
          const isAzul = it.type === "AZUL";
          const isCompleted = it.status === "COMPLETADA";

          return (
            <div key={idx} className={`border rounded-xl p-4 transition text-left cursor-default
               ${isCompleted ? 'bg-slate-900/40 border-green-500/30' : 'bg-black/40 border-white/5 hover:bg-black/60'}
            `}>
              <div className="flex justify-between items-start">
                 <h4 className="font-semibold text-slate-200">{it.customerName}</h4>
                 {isAzul && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-300'}`}>
                      {it.status || 'PENDIENTE'}
                    </span>
                 )}
              </div>
              <div className="flex justify-between items-center mt-1 opacity-70">
                 <span className="text-xs">Cta: {it.account}</span>
                 <span className="text-[10px] uppercase">{it.date}</span>
              </div>
              <p className="text-sm mt-3 text-slate-300 font-light line-clamp-2">{it.description}</p>
              
              <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
                 {/* Mostrar para servicios AZUL incompletos */}
                 {isAzul && !isCompleted && (
                    <button onClick={(e) => handleCompleteOrder(it.id, e)} className="text-[10px] uppercase font-bold text-blue-300 hover:text-white hover:bg-blue-600/30 tracking-widest px-3 py-1.5 rounded transition">
                       ✔ Marcar Terminado
                    </button>
                 )}
                 
                 {/* Mostrar para servicios AZUL terminados, y eventos Rojos/Amarillos en general */}
                 {( (isAzul && isCompleted) || !isAzul ) && (
                    <button onClick={(e) => !isAzul ? handleDeleteEvent(it.id, e) : handleDeleteOrder(it.id, e)} className="text-[10px] uppercase font-bold text-red-400 hover:text-white hover:bg-red-600/30 tracking-widest px-3 py-1.5 rounded transition">
                       🗑 Eliminar
                    </button>
                 )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center flex-1 pb-16">
        
       {/* Saludo Personalizado */}
       <div className="mb-12 flex flex-col items-center">
         <div className="border border-white/20 bg-white/5 backdrop-blur-md rounded-full px-6 py-2 mb-4 text-sm font-bold tracking-[0.2em] text-slate-200">
           AGENTES X-28: {agent.first_name} {agent.last_name}
         </div>
         <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-center uppercase">
           SERVICIOS TÉCNICOS
         </h1>
       </div>

       {/* 3 Master Cards Acordeón */}
        <div className="flex flex-col gap-6 w-full max-w-3xl">
          
          {/* GRUPO ROJO */}
          <div 
             onClick={() => toggleSection('ROJO')}
             className={`relative overflow-hidden rounded-[2rem] border transition-all duration-500 cursor-pointer backdrop-blur-md bg-slate-950/60
             ${openSection === 'ROJO' ? 'border-red-500/40' : 'border-white/10 hover:border-white/30'}
             ${openSection === 'ROJO' ? 'min-h-[24rem]' : 'h-32'}`}
          >
            <div className={`absolute bottom-0 left-0 right-0 h-48 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-red-600 via-red-900/30 to-transparent opacity-90 pointer-events-none transition duration-700`}></div>
            
            <div className="relative z-10 w-full h-32 flex items-center justify-between px-8">
              <div>
                <span className="text-sm font-bold text-red-500 tracking-widest">ALERTA ROJA ({rojoItems.length})</span>
                <h2 className="text-xl md:text-2xl font-medium mt-1">Emergencia / Robo</h2>
              </div>
              <div className="text-3xl text-red-500/50">{openSection === 'ROJO' ? '-' : '+'}</div>
            </div>

            <div className={`relative z-10 px-8 pb-8 transition-opacity duration-300 ${openSection === 'ROJO' ? 'opacity-100' : 'opacity-0 h-0 hidden'}`}>
               <hr className="border-white/10 mb-2" />
               {renderGroupList(rojoItems)}
            </div>
          </div>

          {/* GRUPO AMARILLO */}
          <div 
             onClick={() => toggleSection('AMARILLO')}
             className={`relative overflow-hidden rounded-[2rem] border transition-all duration-500 cursor-pointer backdrop-blur-md bg-slate-950/60
             ${openSection === 'AMARILLO' ? 'border-amber-500/40' : 'border-white/10 hover:border-white/30'}
             ${openSection === 'AMARILLO' ? 'min-h-[24rem]' : 'h-32'}`}
          >
            <div className={`absolute bottom-0 left-0 right-0 h-48 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-500 via-amber-900/30 to-transparent opacity-90 pointer-events-none transition duration-700`}></div>
            
            <div className="relative z-10 w-full h-32 flex items-center justify-between px-8">
              <div>
                <span className="text-sm font-bold text-amber-500 tracking-widest">FALLO ({amarilloItems.length})</span>
                <h2 className="text-xl md:text-2xl font-medium mt-1">Fallo de Comunicación</h2>
              </div>
              <div className="text-3xl text-amber-500/50">{openSection === 'AMARILLO' ? '-' : '+'}</div>
            </div>

            <div className={`relative z-10 px-8 pb-8 transition-opacity duration-300 ${openSection === 'AMARILLO' ? 'opacity-100' : 'opacity-0 h-0 hidden'}`}>
               <hr className="border-white/10 mb-2" />
               {renderGroupList(amarilloItems)}
            </div>
          </div>

          {/* GRUPO AZUL */}
          <div 
             onClick={() => toggleSection('AZUL')}
             className={`relative overflow-hidden rounded-[2rem] border transition-all duration-500 cursor-pointer backdrop-blur-md bg-slate-950/60
             ${openSection === 'AZUL' ? 'border-blue-500/40' : 'border-white/10 hover:border-white/30'}
             ${openSection === 'AZUL' ? 'min-h-[24rem]' : 'h-32'}`}
          >
            <div className={`absolute bottom-0 left-0 right-0 h-48 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-600 via-blue-900/30 to-transparent opacity-90 pointer-events-none transition duration-700`}></div>
            
            <div className="relative z-10 w-full h-32 flex items-center justify-between px-8">
              <div>
                <span className="text-sm font-bold text-blue-500 tracking-widest">NORMAL ({azulItems.length})</span>
                <h2 className="text-xl md:text-2xl font-medium mt-1">Servicios Técnicos</h2>
              </div>
              <div className="text-3xl text-blue-500/50">{openSection === 'AZUL' ? '-' : '+'}</div>
            </div>

            <div className={`relative z-10 px-8 pb-8 transition-opacity duration-300 ${openSection === 'AZUL' ? 'opacity-100' : 'opacity-0 h-0 hidden'}`}>
               <hr className="border-white/10 mb-2" />
               {renderGroupList(azulItems)}
            </div>
          </div>

        </div>

        {/* Zona de Ajustes Privados del Agente (Minimizada) */}
        <details className="mt-16 w-full max-w-2xl text-center group">
           <summary className="text-xs text-slate-500 cursor-pointer hover:text-white transition outline-none list-none uppercase tracking-widest font-bold">
              🛠️ Configuraciones de Agencia
           </summary>
           <div className="mt-4 bg-slate-900/50 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
             <p className="text-sm text-slate-300 mb-2">Tu Enlace de Recepción Webhook (Secreto):</p>
             <code className="bg-black/50 text-xs px-4 py-2 rounded text-blue-100 select-all border border-white/10 overflow-x-auto block">
               https://[nombre-de-tu-sitio-vercel].vercel.app/api/webhook/email?token={agent.webhook_token}
             </code>
             <p className="text-[11px] text-slate-400 mt-2">Configura tu correo personal para reenviar los mensajes de X-28 a esta URL. Reemplazaremos el dominio cuando lo subamos a Vercel.</p>
           </div>
        </details>
    </div>
  );
}
