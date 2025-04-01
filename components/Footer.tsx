import { Container, Text, Group } from '@mantine/core';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#f8f9fa', padding: '1rem 0', marginTop: 'auto' }}>
      <Container>
        <Group position="apart">
          <Text size="sm" color="dimmed">
            © {new Date().getFullYear()} Firmare. Todos los derechos reservados.
          </Text>
          <Group>
            <Text size="sm" color="dimmed">
              <a href="/guides" style={{ textDecoration: 'none', color: 'inherit' }}>Guías</a>
            </Text>
            <Text size="sm" color="dimmed">
              <a href="/legal" style={{ textDecoration: 'none', color: 'inherit' }}>Legales</a>
            </Text>
          </Group>
        </Group>
      </Container>
    </footer>
  );
};

export default Footer;