// C:\Users\jazco\Firmare-web\components\Navbar.tsx
import { Box, Group, Button, Text } from '@mantine/core';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// Declaración global (asegúrate de que esté aquí y sea correcta)
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: any) => void; }) => void;
          renderButton: (element: HTMLElement, options: { theme: string; size: string; }) => void;
          // Añade otras propiedades/métodos que uses
        };
      };
    };
    onGoogleScriptLoad?: () => void; // Callback que definimos en layout.tsx
  }
}

export default function Navbar() {
  console.error("--- NAVBAR: Component Render START ---"); // Log de inicio del componente

  const router = useRouter();
  const clientId = '1012870521703-bg5soonu6mtncbvhinvnih1e17nrkrf6.apps.googleusercontent.com'; // Confirma que este ID es correcto
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const signInButtonRef = useRef<HTMLDivElement>(null); // Ref para el div del botón

  // Función para inicializar y renderizar el botón de Google
  const initializeAndRenderGoogleButton = () => {
    console.error("--- NAVBAR: initializeAndRenderGoogleButton called ---");
    if (window.google && window.google.accounts && window.google.accounts.id && signInButtonRef.current) {
      try {
        console.error("--- NAVBAR: Attempting to initialize Google ID ---");
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCallback,
        });
        console.error("--- NAVBAR: Attempting to render Google button ---");
        window.google.accounts.id.renderButton(
          signInButtonRef.current, // Usar la referencia
          { theme: 'outline', size: 'large' }
        );
        console.error("--- NAVBAR: Botón de Google renderizado (o intento enviado). ---");
      } catch (error) {
        console.error("--- NAVBAR: Error inicializando o renderizando el botón de Google:", error);
      }
    } else {
      // Log detallado de por qué no se cumplen las precondiciones
      console.warn("--- NAVBAR: initializeAndRenderGoogleButton - Preconditions not met ---", {
        googleExists: !!window.google,
        googleAccountsExists: !!(window.google && window.google.accounts),
        googleIdExists: !!(window.google && window.google.accounts && window.google.accounts.id),
        signInButtonRefExists: !!signInButtonRef.current,
      });
    }
  };

  useEffect(() => {
    console.error("--- NAVBAR: First useEffect (script load handling) START ---");
    
    const handleScriptLoad = () => {
      console.error("--- NAVBAR: handleScriptLoad (callback for script readiness) called ---");
      setGoogleScriptLoaded(true); // Actualizar estado para indicar que el script está listo
    };

    // Verificar si el script ya está cargado cuando el componente se monta
    if (window.google && window.google.accounts && window.google.accounts.id) {
      console.error("--- NAVBAR: First useEffect - Google API already available on mount ---");
      handleScriptLoad();
    } else {
      // Si el script no está cargado, nos "enganchamos" al callback global onGoogleScriptLoad
      // que se espera sea llamado por el script de Google cuando termine de cargar.
      console.error("--- NAVBAR: First useEffect - Google API not yet available, attaching to onGoogleScriptLoad ---");
      
      const existingOnLoad = window.onGoogleScriptLoad;
      window.onGoogleScriptLoad = () => {
        console.error("--- NAVBAR: window.onGoogleScriptLoad (assigned from Navbar) CALLED ---");
        if (existingOnLoad) {
          // Llama a la función original si existía (la del layout.tsx que hace console.log)
          console.error("--- NAVBAR: Calling existingOnLoad (from layout) ---");
          existingOnLoad(); 
        }
        handleScriptLoad(); // Llama a nuestra función para actualizar el estado
      };
    }
    
    console.error("--- NAVBAR: First useEffect END ---");

    // Opcional: Limpieza si es necesario
    return () => {
      console.error("--- NAVBAR: First useEffect CLEANUP ---");
      // Si necesitas "desregistrar" el window.onGoogleScriptLoad, aquí sería el lugar.
      // Por ejemplo, si la función original (existingOnLoad) debe restaurarse:
      // if (window.onGoogleScriptLoad === /* la función que acabamos de asignar */) {
      //   window.onGoogleScriptLoad = existingOnLoad;
      // }
      // Pero para este caso, podría no ser estrictamente necesario si el Navbar es persistente.
    };

  }, []); // El array vacío asegura que este efecto se ejecute solo una vez (al montar y desmontar)

  // Un segundo useEffect que reacciona al cambio de googleScriptLoaded
  useEffect(() => {
    console.error("--- NAVBAR: Second useEffect (button rendering) START ---", { 
      googleScriptLoaded, 
      signInButtonRefHasCurrent: !!signInButtonRef.current 
    });

    const attemptRender = () => {
      if (googleScriptLoaded && signInButtonRef.current) {
        console.error("--- NAVBAR: Second useEffect - Conditions met, calling initializeAndRenderGoogleButton ---");
        initializeAndRenderGoogleButton();
      } else {
        console.warn("--- NAVBAR: Second useEffect - Conditions NOT met for rendering button ---", {
          scriptLoaded: googleScriptLoaded,
          refAvailable: !!signInButtonRef.current
        });
      }
    };

    if (googleScriptLoaded) {
      // Si el script está cargado, intentamos renderizar.
      // Si signInButtonRef.current no está listo inmediatamente, el setTimeout ayudará.
      if (signInButtonRef.current) {
        attemptRender();
      } else {
        // El ref no está listo, esperamos un poco.
        // Esto es una solución para dar tiempo al DOM a actualizarse.
        console.warn("--- NAVBAR: signInButtonRef.current is not yet available, but script is loaded. Will re-check shortly. ---");
        const timeoutId = setTimeout(() => {
          console.error("--- NAVBAR: Re-checking for signInButtonRef.current after timeout ---");
          attemptRender(); // Intenta de nuevo después del timeout
        }, 150); // 150ms de retraso, puedes ajustar este valor
        
        // Es importante limpiar este timeout si el componente se desmonta antes de que se ejecute
        return () => {
          console.error("--- NAVBAR: Second useEffect CLEANUP (clearing timeout) ---");
          clearTimeout(timeoutId);
        };
      }
    }
    
    console.error("--- NAVBAR: Second useEffect END ---");
  }, [googleScriptLoaded]); // Solo depende de googleScriptLoaded

  async function handleGoogleCallback(response: any) {
    console.error("--- NAVBAR: handleGoogleCallback called ---", response);
    const { credential } = response;
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credential,
      });
      if (error) {
        console.error('Error al iniciar sesión con Google:', error.message);
      } else {
        console.log('Inicio de sesión exitoso:', data); // Puedes dejar este como log normal
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Error inesperado al autenticar:', err);
    }
  }

  console.error("--- NAVBAR: Component Render END (before return) ---");
  return (
    <Box
      style={{
        backgroundColor: '#f0fce8',
        padding: '1rem',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <Group position="apart" style={{ width: '100%' }}>
        <Group spacing="xs">
          {/* Si usas next/image aquí, asegúrate de actualizarlo */}
          <img
            src="/images/UdeC_2L izq Negro.png"
            alt="Logo UdeC"
            style={{ height: '40px', width: 'auto' }}
          />
          <Text size="xl" fw={700}>
            Firmare
          </Text>
        </Group>
        <Group>
          <Button variant="filled" style={{ backgroundColor: '#e4f6d7', color: '#000000' }} component="a" href="/">
            Inicio
          </Button>
          <Button variant="filled" style={{ backgroundColor: '#e4f6d7', color: '#000000' }} component="a" href="/guides">
            Guías
          </Button>
          <Button variant="filled" style={{ backgroundColor: '#e4f6d7', color: '#000000' }} component="a" href="/legal">
            Legales
          </Button>
          {/* El botón se renderizará aquí cuando el script de Google esté listo */}
          <div id="google-signin-button" ref={signInButtonRef}></div>
        </Group>
      </Group>
    </Box>
  );
}