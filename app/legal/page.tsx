"use client";

import { Container, Title, Text } from '@mantine/core';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Legal() {
  return (
    <>
      <Navbar />
      <Container style={{ padding: '2rem 0' }}>
        <Title order={1} style={{ textAlign: 'center' }} mb="md">
          Términos y Condiciones
        </Title>
        <Text>
          Bienvenido a nuestra página de términos y condiciones. Aquí encontrarás toda la información legal relacionada con el uso de nuestro sitio web y servicios.
        </Text>
        <Title order={2} mt="lg" mb="sm">
          1. Introducción
        </Title>
        <Text>
          Estos términos y condiciones rigen el uso de nuestro sitio web. Al acceder a nuestro sitio, aceptas cumplir con estos términos.
        </Text>
        <Title order={2} mt="lg" mb="sm">
          2. Uso del Sitio
        </Title>
        <Text>
          El contenido de nuestro sitio web es solo para tu información general y uso. Está sujeto a cambios sin previo aviso.
        </Text>
        <Title order={2} mt="lg" mb="sm">
          3. Propiedad Intelectual
        </Title>
        <Text>
          Todo el contenido, marcas comerciales, logotipos y otros materiales en nuestro sitio web son propiedad de sus respectivos dueños.
        </Text>
        <Title order={2} mt="lg" mb="sm">
          4. Limitación de Responsabilidad
        </Title>
        <Text>
          No seremos responsables por cualquier daño que resulte del uso o la imposibilidad de uso de nuestro sitio web.
        </Text>
        <Title order={2} mt="lg" mb="sm">
          5. Cambios en los Términos
        </Title>
        <Text>
          Nos reservamos el derecho de modificar estos términos en cualquier momento. Te recomendamos revisar esta página periódicamente para estar al tanto de cualquier cambio.
        </Text>
      </Container>
      <Footer />
    </>
  );
}