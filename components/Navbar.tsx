import { Container, Group, Button, Text } from '@mantine/core';
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
    <div style={{ height: 60, marginBottom: 120 }}>
      <Container>
        <Group justify="space-between">
          <Text size="xl" fw={700}>
          Mi Aplicación
          </Text>
          <Group>
            <Button variant="outline" color="gray" component="a" href="/">
              Inicio
            </Button>
            <Button onClick={handleLogin} variant="outline" color="blue">
              Iniciar sesión con Google
            </Button>
            <Button variant="outline" color="gray" component="a" href="/guides">
              Guías
            </Button>
            <Button variant="outline" color="gray" component="a" href="/legal">
              Legales
            </Button>
          </Group>
        </Group>
      </Container>
    </div>
  );
}