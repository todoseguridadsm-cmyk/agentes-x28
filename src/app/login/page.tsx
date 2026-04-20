"use client";

import { useState } from "react";
import Image from "next/image";
import { registerAgentAction, loginAgentAction } from "@/lib/actions";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    
    if (isRegister) {
       const res = await registerAgentAction({
          email,
          firstName: formData.get("firstName") as string,
          lastName: formData.get("lastName") as string,
          phone: formData.get("phone") as string
       });
       if (res.error) setErrorMsg(res.error);
       else window.location.href = "/";
    } else {
       const res = await loginAgentAction(email);
       if (res.error) setErrorMsg(res.error);
       else window.location.href = "/";
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-black text-white relative flex flex-col justify-center items-center overflow-hidden font-sans">
      
      {/* Background visual */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image 
          src="/los especialistas 1.jpg"
          alt="Fondo"
          fill
          className="object-cover opacity-20 brightness-50 mix-blend-lighten scale-105 blur-sm" 
          quality={80}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-slate-900/80 to-black"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-8 py-10 rounded-[2.5rem] bg-slate-950/80 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_-12px_rgba(255,255,255,0.1)] flex flex-col items-center">
        
        <Image 
           src="/logo x-28.jpg" 
           alt="X-28 Alarmas Logo" 
           width={200} 
           height={80} 
           className="w-40 h-auto mb-8 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
        />

        <div className="border border-white/20 bg-white/5 rounded-full px-5 py-1.5 mb-8 text-xs font-bold tracking-[0.2em] text-slate-200">
          {isRegister ? "NUEVO AGENTE" : "ACCESO AGENTES"}
        </div>
        
        {errorMsg && (
          <div className="w-full bg-red-900/50 border border-red-500 text-red-200 text-sm px-4 py-3 rounded-xl mb-6 text-center">
             {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
           {isRegister && (
             <>
               <div className="flex gap-4">
                  <input required name="firstName" type="text" placeholder="Nombre" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40 focus:bg-white/5 transition" />
                  <input required name="lastName" type="text" placeholder="Apellido" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40 focus:bg-white/5 transition" />
               </div>
               <input required name="phone" type="tel" placeholder="Tu número de Celular" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40 focus:bg-white/5 transition" />
             </>
           )}

           <input required name="email" type="email" placeholder="Correo electrónico @outlook, @gmail" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40 focus:bg-white/5 transition" />
           
           {!isRegister && (
              <input name="password" type="password" placeholder="Tu Contraseña Maestra (MVP Opcional)" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40 focus:bg-white/5 transition" />
           )}
           {isRegister && (
              <input required name="password" type="password" placeholder="Crea tu contraseña maestra" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40 focus:bg-white/5 transition" />
           )}

           <button disabled={loading} type="submit" className="w-full mt-4 bg-white text-black font-bold tracking-widest text-sm py-4 rounded-xl hover:bg-slate-200 hover:scale-[1.02] transition duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center">
             {loading ? "PROCESANDO..." : (isRegister ? "CREAR MI CUENTA" : "INGRESAR AL SISTEMA")}
           </button>
        </form>

        <button 
          onClick={() => { setIsRegister(!isRegister); setErrorMsg(""); }}
          className="mt-8 text-sm text-slate-400 hover:text-white transition"
        >
          {isRegister ? "¿Ya eres Agente? Inicia Sesión" : "¿Agencia Nueva? Regístrate aquí"}
        </button>

      </div>
    </main>
  );
}
