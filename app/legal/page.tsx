"use client";

import { Container, Title, Text } from '@mantine/core';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Legal() {
  return (
    <>
      <Navbar />
      <Container m={0} p="md" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
        <Title order={1} style={{ textAlign: 'center' }} mb="md">
          Términos y Condiciones
        </Title>
        <Text mb="lg">
          Bienvenido a nuestra página de términos y condiciones. Aquí encontrarás toda la información legal relacionada con el uso de nuestro sitio web y servicios.
        </Text>
        <Title order={2} mt="lg" mb="sm">
          1. Introducción
        </Title>
        <Text mb="lg">
          Estos términos y condiciones rigen el uso de nuestro sitio web. Al acceder a nuestro sitio, aceptas cumplir con estos términos.
        </Text>
        <Title order={2} mt="lg" mb="sm">
          2. Uso del Sitio
        </Title>
        <Text mb="lg">
          El contenido de nuestro sitio web es solo para tu información general y uso. Está sujeto a cambios sin previo aviso.
        </Text>
        <Title order={2} mt="lg" mb="sm">
          3. Propiedad Intelectual
        </Title>
        <Text mb="lg">
          Todo el contenido, marcas comerciales, logotipos y otros materiales en nuestro sitio web son propiedad de sus respectivos dueños.
        </Text>
        <Title order={2} mt="lg" mb="sm">
          4. Limitación de Responsabilidad
        </Title>
        <Text mb="lg">
          No seremos responsables por cualquier daño que resulte del uso o la imposibilidad de uso de nuestro sitio web.
        </Text>
        <Title order={2} mt="lg" mb="sm">
          5. Cambios en los Términos
        </Title>
        <Text mb="lg">
          Nos reservamos el derecho de modificar estos términos en cualquier momento. Te recomendamos revisar esta página periódicamente para estar al tanto de cualquier cambio.
        </Text>
        <Footer />
      </Container>
    </>
  );
}