import { Box, Group, Button, Text } from '@mantine/core';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  async function handleLogin() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/dashboard',
      },
    });

    if (error) console.error(error);
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
          <Button onClick={handleLogin} variant="filled" style={{ backgroundColor: '#e4f6d7', color: '#000000' }}>
            Iniciar sesión con Google
          </Button>
        </Group>
      </Group>
    </Box>
  );
}
