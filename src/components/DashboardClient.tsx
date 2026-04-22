"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { markOrderCompleted, deleteOrder, deleteEvent, deleteEventsByCategory, deleteAllOrders } from "@/lib/actions";



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


  const handleBulkDelete = async (type: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar TODOS los registros de esta categoría?`)) return;
    
    if (type === "AZUL") {
      await deleteAllOrders(agent.id);
    } else {
      await deleteEventsByCategory(agent.id, type);
    }
    router.refresh();
  };

  const renderGroupList = (items: Item[], categoryType: string) => {
    if (items.length === 0) return <div className="text-slate-400 py-4 px-2 text-sm italic">No hay registros pendientes en esta categoría.</div>;
    
    // AGRUPAR POR CUENTA
    const grouped: { [key: string]: Item[] } = {};
    items.forEach(it => {
      const key = it.account || "SD";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(it);
    });

    return (
      <div className="flex flex-col gap-4 mt-4 w-full">
        {/* Botón de Eliminación Masiva */}
        <div className="flex justify-end mb-2">
          <button 
            onClick={(e) => { e.stopPropagation(); handleBulkDelete(categoryType); }}
            className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full hover:bg-red-500/20 transition uppercase font-bold tracking-widest"
          >
            🗑 Limpiar Categoría
          </button>
        </div>

        {Object.entries(grouped).map(([account, groupItems], gIdx) => {
          const first = groupItems[0];
          const hasMultiple = groupItems.length > 1;
          const isAzul = first.type === "AZUL";
          const isCompleted = first.status === "COMPLETADA";

          return (
            <div key={gIdx} className={`border rounded-2xl overflow-hidden transition-all duration-300
               ${isCompleted ? 'bg-slate-900/40 border-green-500/30' : 'bg-black/40 border-white/5'}
            `}>
              {/* Header del Grupo / Item Único */}
              <div className="p-4 flex flex-col gap-1">
                <div className="flex justify-between items-start">
                   <div className="flex flex-col">
                      <h4 className="font-bold text-slate-100 text-lg">{first.customerName}</h4>
                      <span className="text-xs text-slate-400 font-mono">CTA: {account}</span>
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

                {/* Lista de eventos del grupo */}
                <div className="mt-3 flex flex-col gap-2">
                   {groupItems.map((it, idx) => (
                     <div key={idx} className={`p-3 rounded-lg bg-white/5 border border-white/5 ${idx > 0 && !isAzul ? 'mt-1' : ''}`}>
                        <div className="flex justify-between items-center mb-1">
                           <span className="text-[10px] text-slate-400 uppercase font-bold">{it.date}</span>
                           <button onClick={(e) => !isAzul ? handleDeleteEvent(it.id, e) : handleDeleteOrder(it.id, e)} className="text-red-400/50 hover:text-red-400 transition text-xs">✕</button>
                        </div>
                        <p className="text-sm text-slate-200 font-light leading-relaxed">
                           {it.description}
                           {it.details?.zone && <span className="ml-2 text-slate-400 text-xs italic">({it.details.zone})</span>}
                        </p>
                        
                        {isAzul && !isCompleted && (
                          <button onClick={(e) => handleCompleteOrder(it.id, e)} className="mt-3 w-full text-[10px] uppercase font-bold bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 tracking-widest py-2 rounded-lg transition border border-blue-500/20">
                            ✔ Marcar Terminado
                          </button>
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


  // --- ESTADOS PARA MODAL DE ALTA ---
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
      
      if (!res.ok) {
        throw new Error(data.error || "Ocurrió un error al enviar el alta.");
      }

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
        
       {/* Saludo Personalizado */}
       <div className="mb-10 flex flex-col items-center">
         <div className="border border-white/20 bg-white/5 backdrop-blur-md rounded-full px-6 py-2 mb-4 text-sm font-bold tracking-[0.2em] text-slate-200">
           AGENTES X-28: {agent.first_name} {agent.last_name}
         </div>
         <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-center uppercase">
           SERVICIOS TÉCNICOS
         </h1>
       </div>

       {/* Botón Flotante/Master para Nueva Alta */}
       <button 
          onClick={() => setIsAltaModalOpen(true)}
          className="mb-10 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 hover:scale-105 transition-all text-white font-bold py-4 px-8 rounded-full shadow-[0_0_30px_rgba(234,88,12,0.4)] tracking-wider uppercase text-sm md:text-base flex items-center gap-3 border border-white/10"
       >
          <span>📸</span> CREAR ALTA DE MONITOREO
       </button>

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

               {renderGroupList(rojoItems, 'ROJO')}
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
               {renderGroupList(amarilloItems, 'AMARILLO')}
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
               {renderGroupList(azulItems, 'AZUL')}
            </div>


          </div>

          {/* GRUPO GRIS (TEST MANUAL) */}
          <div 
             onClick={() => toggleSection('GRIS')}
             className={`relative overflow-hidden rounded-[2rem] border transition-all duration-500 cursor-pointer backdrop-blur-md bg-slate-950/60
             ${openSection === 'GRIS' ? 'border-slate-500/40' : 'border-white/10 hover:border-white/30'}
             ${openSection === 'GRIS' ? 'min-h-[24rem]' : 'h-32'}`}
          >
            <div className={`absolute bottom-0 left-0 right-0 h-48 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-slate-600 via-slate-900/30 to-transparent opacity-90 pointer-events-none transition duration-700`}></div>
            
            <div className="relative z-10 w-full h-32 flex items-center justify-between px-8">
              <div>
                <span className="text-sm font-bold text-slate-500 tracking-widest">PRUEBAS ({grisItems.length})</span>
                <h2 className="text-xl md:text-2xl font-medium mt-1">Test Manual / Pruebas</h2>
              </div>
              <div className="text-3xl text-slate-500/50">{openSection === 'GRIS' ? '-' : '+'}</div>
            </div>

            <div className={`relative z-10 px-8 pb-8 transition-opacity duration-300 ${openSection === 'GRIS' ? 'opacity-100' : 'opacity-0 h-0 hidden'}`}>
               <hr className="border-white/10 mb-2" />
               {renderGroupList(grisItems, 'GRIS')}
            </div>
          </div>

        </div>




        {/* MODAL DE ALTAS DE MONITOREO */}
        {isAltaModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             {/* Backdrop oscuro */}
             <div 
               className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer" 
               onClick={() => !isSubmittingAlta && setIsAltaModalOpen(false)}
             ></div>
             
             {/* Modal Contenedor */}
             <div className="relative bg-slate-950 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.8)] rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 p-6 border-b border-white/5 flex justify-between items-center">
                   <h2 className="text-xl font-bold uppercase tracking-widest">Alta de Monitoreo</h2>
                   <button onClick={() => !isSubmittingAlta && setIsAltaModalOpen(false)} className="text-white/50 hover:text-white text-2xl font-light">&times;</button>
                </div>
                
                <form onSubmit={handleAltaSubmit} className="p-6 overflow-y-auto flex flex-col gap-4">
                   
                   {altaSuccess ? (
                      <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
                         <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500">
                            <span className="text-green-500 text-3xl">✓</span>
                         </div>
                         <h3 className="text-green-400 font-bold text-xl uppercase tracking-widest">¡Enviado a Cuidar!</h3>
                         <p className="text-slate-300 text-sm">Se despachó el correo a X-28 y te enviamos una copia a tu bandeja ({agent.email}).</p>
                      </div>
                   ) : (
                     <>
                       {altaError && (
                         <div className="bg-red-500/20 border border-red-500 text-red-300 text-sm p-3 rounded-lg text-center font-medium">
                            {altaError}
                         </div>
                       )}

                       <div className="flex flex-col gap-1">
                          <label className="text-xs text-slate-400 uppercase tracking-wider font-bold ml-1">Nombre Completo del Cliente <span className="text-orange-500">*</span></label>
                          <input required name="cliente" type="text" placeholder="Ej: SARSAR ROBERTO MARIO" className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500/50 transition font-medium" />
                       </div>

                       <div className="flex gap-4">
                         <div className="flex flex-col gap-1 w-1/2">
                            <label className="text-xs text-slate-400 uppercase tracking-wider font-bold ml-1">N° Cuenta</label>
                            <input name="cuenta" type="text" placeholder="Opcional" className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500/50 transition font-medium" />
                         </div>
                         <div className="flex flex-col gap-1 w-1/2">
                            <label className="text-xs text-slate-400 uppercase tracking-wider font-bold ml-1">Plan Asignado</label>
                            <input name="plan" type="text" placeholder="Ej: WIFI / GPRS" className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500/50 transition font-medium" />
                         </div>
                       </div>

                       <div className="flex flex-col gap-1">
                          <label className="text-xs text-slate-400 uppercase tracking-wider font-bold ml-1">Nombre del Instalador <span className="text-orange-500">*</span></label>
                          <input required name="instalador" type="text" placeholder="Ej: JUAN PEREZ" className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500/50 transition font-medium" />
                       </div>

                       <div className="flex flex-col gap-1 mt-2">
                          <label className="text-xs text-slate-400 uppercase tracking-wider font-bold ml-1">Fotos y Planillas (Hasta 6) <span className="text-orange-500">*</span></label>
                          <div className="relative border-2 border-dashed border-white/10 bg-black/30 rounded-xl hover:bg-black/50 hover:border-orange-500/30 transition p-6 text-center group cursor-pointer">
                             <input 
                                required
                                name="photos"
                                type="file" 
                                accept="image/*" 
                                multiple 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => {
                                   if (e.target.files && e.target.files.length > 6) {
                                      alert("Por favor selecciona máximo 6 imágenes.");
                                      e.target.value = ""; // reset
                                   }
                                }}
                             />
                             <span className="text-3xl block mb-2 opacity-50 group-hover:opacity-100 transition">📸</span>
                             <p className="text-sm text-slate-400 font-medium">Toca para abrir cámara o galería</p>
                             <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">De 1 a 6 archivos</p>
                          </div>
                       </div>

                       <button 
                          type="submit" 
                          disabled={isSubmittingAlta}
                          className="mt-6 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold tracking-widest uppercase py-4 rounded-xl shadow-[0_0_20px_rgba(234,88,12,0.3)] transition-all flex items-center justify-center gap-2"
                       >
                          {isSubmittingAlta ? (
                            <span className="animate-pulse">ENVIANDO PAQUETE...</span>
                          ) : (
                            <><span>✉</span> ENVIAR A CUIDAR@X-28.COM</>
                          )}
                       </button>
                       <p className="text-center text-[10px] text-slate-500 uppercase mt-2">Doble envío automático (X-28 + Respaldo a tu mail)</p>
                     </>
                   )}
                </form>
             </div>
          </div>
        )}
    </div>
  );
}
