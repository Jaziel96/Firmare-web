import { Container, Group, Button, Text, useMantineTheme, MantineProvider, createTheme, MantineColorsTuple } from '@mantine/core';
import { createStyles } from '@mantine/styles';  // Cambiar la importación
import { supabase } from '@/lib/supabase';
import { ReactNode } from 'react';
import { cx } from 'class-variance-authority';

const useStyles = createStyles((theme) => {
  return {
    header: {
      height: 60,
      marginBottom: 120,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.blue[5],
      borderBottom: `1px solid ${theme.colors.gray[2]}`,
    },
    title: {
      color: theme.white,
    },
    button: {
      color: theme.white,
      borderColor: theme.white,
      '&:hover': {
        backgroundColor: theme.colors.blue[7],
      },
    },
  };
});

const myColor: MantineColorsTuple = [
  '#f0fce8',
  '#e4f6d7',
  '#c8ebb0',
  '#aadf85',
  '#91d561',
  '#80cf4a',
  '#77cd3d',
  '#65b52e',
  '#58a126',
  '#488b1a'
];

const theme = createTheme({
  colors: {
    myColor,
  },
  primaryColor: 'myColor',
});

interface RootLayoutProps {
  children: ReactNode;
}


export default function Navbar() {
  const theme = useMantineTheme();
  const { classes } = useStyles();

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
    <div className={cx(classes.header)}>
      <Container>
        <Group justify="space-between">
          <Text size="xl" fw={700} className={classes.title}>
            Mi Aplicación
          </Text>
          <Group>
            <Button variant="outline" className={classes.button} component="a" href="/">
              Inicio
            </Button>
            <Button onClick={handleLogin} variant="outline" className={classes.button}>
              Iniciar sesión con Google
            </Button>
            <Button variant="outline" className={classes.button} component="a" href="/guides">
              Guías
            </Button>
            <Button variant="outline" className={classes.button} component="a" href="/legal">
              Legales
            </Button>
          </Group>
        </Group>
      </Container>
    </div>
  );
}
