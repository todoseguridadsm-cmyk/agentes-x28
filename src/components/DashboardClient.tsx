
"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { markOrderCompleted, deleteOrder, deleteEvent, deleteEventsByAccount, deleteOrdersByAccount } from "@/lib/actions";

type Item = {
  id: string;
  type: "ROJO" | "AMARILLO" | "AZUL" | "GRIS";
  customerName: string;
  account: string;
  description: string;
  date: string;
  status: string;
  details?: any;
};

export default function DashboardClient({ agent, rojoItems, amarilloItems, azulItems, grisItems }: { agent: any, rojoItems: Item[], amarilloItems: Item[], azulItems: Item[], grisItems: Item[] }) {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const router = useRouter();

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleCompleteOrder = async (id: string, e: React.MouseEvent) => {
     e.stopPropagation();
     if(!confirm("¿Marcar este servicio como completado?")) return;
     const res = await markOrderCompleted(id);
     if (res.error) alert("Error al completar.");
     router.refresh();
  };

  const handleDeleteOrder = async (id: string, e: React.MouseEvent) => {
     e.stopPropagation();
     if(!confirm("¿Eliminar este registro permanentemente?")) return;
     const res = await deleteOrder(id);
     if (res.error) alert("Error al eliminar.");
     router.refresh();
  };

  const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
     e.stopPropagation();
     if(!confirm("¿Eliminar este evento?")) return;
     const res = await deleteEvent(id);
     if (res.error) alert("Error al eliminar.");
     router.refresh();
  };

  const handleAccountDelete = async (type: string, account: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar TODOS los registros de la cuenta ${account}?`)) return;
    
    let res;
    if (type === "AZUL") {
      res = await deleteOrdersByAccount(agent.id, account);
    } else {
      res = await deleteEventsByAccount(agent.id, account);
    }
    
    if (res?.error) alert("Error al limpiar cuenta.");
    router.refresh();
  };

  const renderGroupList = (items: Item[], categoryType: string) => {
    if (items.length === 0) return <div className="text-slate-400 py-4 px-2 text-sm italic">No hay registros pendientes en esta categoría.</div>;
    
    const grouped: { [key: string]: Item[] } = {};
    items.forEach(it => {
      const key = it.account || "SD";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(it);
    });

    return (
      <div className="flex flex-col gap-4 mt-4 w-full">
        {Object.entries(grouped).map(([account, groupItems], gIdx) => {
          const first = groupItems[0];
          const hasMultiple = groupItems.length > 1;
          const isAzul = first.type === "AZUL";
          const isCompleted = first.status === "COMPLETADA";

          return (
            <div key={gIdx} className={`border rounded-2xl overflow-hidden transition-all duration-300
               ${isCompleted ? 'bg-slate-900/40 border-green-500/30' : 'bg-black/40 border-white/5'}
            `}>
              <div className="p-4 flex flex-col gap-1 text-left">
                <div className="flex justify-between items-start">
                   <div className="flex flex-col">
                      <h4 className="font-bold text-slate-100 text-lg">{first.customerName}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono">CTA: {account}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleAccountDelete(categoryType, account); }}
                          className="text-[9px] text-red-400/70 hover:text-red-400 uppercase font-bold tracking-tighter"
                        >
                          [ Limpiar Cliente ]
                        </button>
                      </div>
                   </div>
                   {isAzul && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-300'}`}>
                        {first.status || 'PENDIENTE'}
                      </span>
                   )}
                   {!isAzul && hasMultiple && (
                      <span className="bg-white/10 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {groupItems.length} EVENTOS
                      </span>
                   )}
                </div>

                <div className="mt-3 flex flex-col gap-2">
                   {groupItems.map((it, idx) => (
                     <div key={idx} className={`p-3 rounded-lg bg-white/5 border border-white/5 ${idx > 0 && !isAzul ? 'mt-1' : ''}`}>
                        <div className="flex justify-between items-center mb-1">
                           <span className="text-[10px] text-slate-400 uppercase font-bold">{it.date}</span>
                           <button onClick={(e) => !isAzul ? handleDeleteEvent(it.id, e) : handleDeleteOrder(it.id, e)} className="text-red-400/50 hover:text-red-400 transition text-xs">✕</button>
                        </div>

                        <p className="text-sm text-slate-200 font-light leading-relaxed">
                           {it.description}
                           {it.details && (it.details as any).zone && <span className="ml-2 text-slate-400 text-xs italic">({(it.details as any).zone})</span>}
                        </p>

                        
                        {isAzul && !isCompleted && (
                          <div className="mt-3 flex gap-2">
                            <button onClick={(e) => handleCompleteOrder(it.id, e)} className="flex-1 text-[10px] uppercase font-bold bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 tracking-widest py-2 rounded-lg transition border border-blue-500/20">
                              ✔ Terminar
                            </button>
                            <button onClick={(e) => handleDeleteOrder(it.id, e)} className="px-4 text-[10px] uppercase font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 tracking-widest py-2 rounded-lg transition border border-red-500/20">
                              🗑 Borrar
                            </button>
                          </div>
                        )}
                     </div>
                   ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // --- MODAL DE ALTA ---
  const [isAltaModalOpen, setIsAltaModalOpen] = useState(false);
  const [isSubmittingAlta, setIsSubmittingAlta] = useState(false);
  const [altaError, setAltaError] = useState("");
  const [altaSuccess, setAltaSuccess] = useState(false);

  const handleAltaSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingAlta(true);
    setAltaError("");
    setAltaSuccess(false);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch("/api/send-alta", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ocurrió un error.");
      setAltaSuccess(true);
      setTimeout(() => {
        setIsAltaModalOpen(false);
        setAltaSuccess(false);
      }, 3000);
    } catch (err: any) {
      setAltaError(err.message);
    } finally {
      setIsSubmittingAlta(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center flex-1 pb-16 px-4">
       <div className="mb-10 flex flex-col items-center">
         <div className="border border-white/20 bg-white/5 backdrop-blur-md rounded-full px-6 py-2 mb-4 text-sm font-bold tracking-[0.2em] text-slate-200 uppercase">
           AGENTES X-28: {agent.first_name} {agent.last_name}
         </div>
         <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-center uppercase">
           MONITOREO DE ALARMAS
         </h1>
       </div>

       <button onClick={() => setIsAltaModalOpen(true)} className="mb-10 bg-gradient-to-r from-orange-600 to-red-600 hover:scale-105 transition-all text-white font-bold py-4 px-8 rounded-full shadow-[0_0_30px_rgba(234,88,12,0.4)] tracking-wider uppercase text-sm md:text-base flex items-center gap-3 border border-white/10">
          <span>📸</span> CREAR ALTA DE MONITOREO
       </button>

       <div className="flex flex-col gap-6 w-full max-w-3xl">
          <Section title="Emergencia / Robo" badge={`ALERTA ROJA (${rojoItems.length})`} items={rojoItems} type="ROJO" isOpen={openSection === 'ROJO'} onToggle={() => toggleSection('ROJO')} renderList={renderGroupList} color="red" />
          <Section title="Fallo de Comunicación" badge={`FALLO (${amarilloItems.length})`} items={amarilloItems} type="AMARILLO" isOpen={openSection === 'AMARILLO'} onToggle={() => toggleSection('AMARILLO')} renderList={renderGroupList} color="amber" />
          <Section title="Servicios Técnicos" badge={`NORMAL (${azulItems.length})`} items={azulItems} type="AZUL" isOpen={openSection === 'AZUL'} onToggle={() => toggleSection('AZUL')} renderList={renderGroupList} color="blue" />
          <Section title="Test Manual / Pruebas" badge={`PRUEBAS (${grisItems.length})`} items={grisItems} type="GRIS" isOpen={openSection === 'GRIS'} onToggle={() => toggleSection('GRIS')} renderList={renderGroupList} color="slate" />
       </div>

       {isAltaModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer" onClick={() => !isSubmittingAlta && setIsAltaModalOpen(false)}></div>
             <div className="relative bg-slate-950 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.8)] rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 p-6 border-b border-white/5 flex justify-between items-center text-left">
                   <h2 className="text-xl font-bold uppercase tracking-widest text-left">Alta de Monitoreo</h2>
                   <button onClick={() => !isSubmittingAlta && setIsAltaModalOpen(false)} className="text-white/50 hover:text-white text-2xl font-light">&times;</button>
                </div>
                <form onSubmit={handleAltaSubmit} className="p-6 overflow-y-auto flex flex-col gap-4 text-left">
                   {altaSuccess ? (
                      <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
                         <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500">
                            <span className="text-green-500 text-3xl">✓</span>
                         </div>
                         <h3 className="text-green-400 font-bold text-xl uppercase tracking-widest">¡Enviado a Cuidar!</h3>
                      </div>
                   ) : (

                      <>
                        {altaError && <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-xs border border-red-500/20">{String(altaError)}</div>}

                        <div className="flex flex-col gap-1">
                           <label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Cliente *</label>
                           <input required name="cliente" type="text" className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500/50 text-white" />
                        </div>
                        <div className="flex gap-4">
                          <div className="flex flex-col gap-1 w-1/2">
                             <label className="text-xs text-slate-400 uppercase tracking-wider font-bold">N° Cuenta</label>
                             <input name="cuenta" type="text" className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500/50 text-white" />
                          </div>
                          <div className="flex flex-col gap-1 w-1/2">
                             <label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Plan</label>
                             <input name="plan" type="text" className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500/50 text-white" />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                           <label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Instalador *</label>
                           <input required name="instalador" type="text" className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500/50 text-white" />
                        </div>
                        <div className="flex flex-col gap-1 mt-2">
                           <label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Fotos *</label>
                           <input required name="photos" type="file" multiple className="bg-black/30 border border-white/10 p-4 rounded-xl text-xs text-slate-400" />
                        </div>
                        <button type="submit" disabled={isSubmittingAlta} className="mt-6 bg-orange-600 hover:bg-orange-500 text-white font-bold tracking-widest uppercase py-4 rounded-xl shadow-[0_0_20px_rgba(234,88,12,0.3)] transition-all">
                           {isSubmittingAlta ? "ENVIANDO..." : "ENVIAR ALTA"}
                        </button>
                      </>
                   )}
                </form>
             </div>
          </div>
       )}
    </div>
  );
}

function Section({ title, badge, items, type, isOpen, onToggle, renderList, color }: any) {
  const colorMap: any = {
    red: "from-red-600 via-red-900/30",
    amber: "from-amber-500 via-amber-900/30",
    blue: "from-blue-600 via-blue-900/30",
    slate: "from-slate-600 via-slate-900/30"
  };
  const borderMap: any = {
    red: "border-red-500/40",
    amber: "border-amber-500/40",
    blue: "border-blue-500/40",
    slate: "border-slate-500/40"
  };
  const textMap: any = {
    red: "text-red-500",
    amber: "text-amber-500",
    blue: "text-blue-500",
    slate: "text-slate-500"
  };

  return (
    <div 
       onClick={onToggle}
       className={`relative overflow-hidden rounded-[2rem] border transition-all duration-500 cursor-pointer backdrop-blur-md bg-slate-950/60
       ${isOpen ? borderMap[color] : 'border-white/10 hover:border-white/30'}
       ${isOpen ? 'min-h-[24rem]' : 'h-32'}`}
    >
      <div className={`absolute bottom-0 left-0 right-0 h-48 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] ${colorMap[color]} to-transparent opacity-90 pointer-events-none transition duration-700`}></div>
      <div className="relative z-10 w-full h-32 flex items-center justify-between px-8">
        <div className="text-left">
          <span className={`text-sm font-bold ${textMap[color]} tracking-widest`}>{badge}</span>
          <h2 className="text-xl md:text-2xl font-medium mt-1">{title}</h2>
        </div>
        <div className={`text-3xl ${textMap[color]}/50 transition-transform ${isOpen ? 'rotate-45' : ''}`}>+</div>
      </div>
      <div className={`relative z-10 px-8 pb-8 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 h-0 hidden'}`}>
         <hr className="border-white/10 mb-2" />
         {renderList(items, type)}
      </div>
    </div>
  );
}
