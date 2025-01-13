import { Box, Group, Button, Text } from '@mantine/core';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  useEffect(() => {
    /* global google */
    google.accounts.id.initialize({
      client_id: '1012870521703-bg5soonu6mtncbvhinvnih1e17nrkrf6.apps.googleusercontent.com',
      callback: handleGoogleCallback, // Manejar el token de Google aquí
    });
    google.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      { theme: 'outline', size: 'large' } // Personaliza el botón aquí
    );
  }, []);

  async function handleGoogleCallback(response: any) {
    const { credential } = response;

    try {
      // Utiliza el token de Google directamente con Supabase
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credential,
      });

      if (error) {
        console.error('Error al iniciar sesión con Google:', error);
      } else {
        console.log('Inicio de sesión exitoso:', data);
        window.location.href = '/dashboard'; // Redirige al dashboard
      }
    } catch (err) {
      console.error('Error inesperado al autenticar:', err);
    }
  }

  return (
    <Box
      style={{
        backgroundColor: '#f0fce8', // Primer color de myColor
        padding: '1rem',
        width: '100%', // Abarcar el ancho total de la página
        boxSizing: 'border-box', // Incluir el padding en el ancho total
        overflow: 'hidden', // Evitar desbordamiento
      }}
    >
      <Group position="apart" style={{ width: '100%' }}>
        <Text size="xl" fw={700}>
          Firmare
        </Text>
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
          <div id="google-signin-button"></div> {/* Botón oficial de Google Sign-In */}
        </Group>
      </Group>
    </Box>
  );
}

