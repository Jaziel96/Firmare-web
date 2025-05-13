"use client";

// app/layout.tsx
import { Mantine } from '@/lib/mantine';
import '../styles/fonts.css';
import Script from 'next/script'; // Asegúrate de que este import es correcto
import { useEffect } from 'react'; // Importa useEffect

interface RootLayoutProps {
  children: React.ReactNode;
}

// Define la función de callback en el ámbito global ANTES del componente RootLayout
// para asegurar que esté disponible cuando el script de Google la necesite.
if (typeof window !== 'undefined') {
  console.error("--- LAYOUT SCRIPT (global scope): Defining window.onGoogleScriptLoad ---");
  // @ts-ignore // Para TypeScript si se queja de que onGoogleScriptLoad no está en window
  window.onGoogleScriptLoad = () => {
    console.error("--- LAYOUT SCRIPT (global scope): window.onGoogleScriptLoad CALLED! ---");
    // Aquí podrías disparar un evento personalizado si Navbar necesita reaccionar
    // window.dispatchEvent(new CustomEvent('google-script-loaded'));
  };
}


export default function RootLayout({ children }: RootLayoutProps) {
  console.error("--- RootLayout Component: Render START ---");

  useEffect(() => {
    console.error("--- RootLayout Component: useEffect executed (mount) ---");
    // Puedes verificar si window.google está disponible aquí después de un tiempo
    // para ver si el script se cargó pero el callback falló.
    const timeoutId = setTimeout(() => {
      // @ts-ignore // Para TypeScript si se queja de que google no está en window
      if (window.google && window.google.accounts) {
        console.error("--- RootLayout Component: useEffect - window.google IS available after timeout ---");
      } else {
        console.warn("--- RootLayout Component: useEffect - window.google IS STILL NOT available after timeout ---");
      }
    }, 3000); // 3 segundos de espera

    return () => clearTimeout(timeoutId); // Limpiar el timeout al desmontar
  }, []);

  console.error("--- RootLayout Component: Before return ---");
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Firmare App</title>

        {/* NO pongas la definición de onGoogleScriptLoad dentro de otro Script tag aquí si ya está global */}
        
        <Script
          id="google-gsi-client"
          src="https://accounts.google.com/gsi/client?onload=onGoogleScriptLoad"
          strategy="afterInteractive" // Intentemos 'afterInteractive'
          // async y defer son manejados por 'strategy' o son implícitos.
          // No es necesario especificarlos explícitamente con 'afterInteractive'.
          onLoad={() => {
            console.error("--- LAYOUT (Script Component): Google GSI Script onLoad event FIRED ---");
            // @ts-ignore
            if (window.google && window.google.accounts) {
              console.error("--- LAYOUT (Script Component): onLoad - window.google IS available ---");
            } else {
              console.warn("--- LAYOUT (Script Component): onLoad - window.google IS NOT available --- (Esto es un problema)");
            }
          }}
          onError={(e: any) => { // Añade tipo al error para evitar problemas de linter
            console.error("--- LAYOUT (Script Component): ERROR LOADING GOOGLE GSI SCRIPT ---", e);
          }}
        />
      </head>
      <body style={{ margin: 0, fontFamily: 'FuturaBT, Arial, sans-serif' }}>
        <Mantine>{children}</Mantine>
      </body>
    </html>
  );
}

// Si TypeScript se sigue quejando de window.google o window.onGoogleScriptLoad
// a pesar de los @ts-ignore, puedes añadir/modificar tu archivo de declaraciones globales
// (por ejemplo, next-env.d.ts o un archivo custom.d.ts) para incluir esto:
/*
declare global {
  interface Window {
    onGoogleScriptLoad?: () => void;
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: any) => void; }) => void;
          renderButton: (element: HTMLElement, options: { theme: string; size: string; }) => void;
          // Añade otras propiedades/métodos que uses
        };
      };
    };
  }
}
// Esto es para evitar que TypeScript marque errores por estas propiedades globales.
// Asegúrate de que esta declaración no entre en conflicto con otras que puedas tener.
*/