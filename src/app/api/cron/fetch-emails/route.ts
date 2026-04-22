
import { NextResponse } from 'next/server';
import { fetchAndProcessEmails } from '@/lib/imap';

export const revalidate = 0;

export async function GET(req: Request) {
  try {
    // 1. Ejecutar el lector de IMAP
    const result = await fetchAndProcessEmails();
    
    return NextResponse.json({ 
      success: true, 
      message: "Emails sincronizados con éxito desde Hostinger.",
      result 
    });

  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
