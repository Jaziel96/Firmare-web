"use client";

import { Container } from '@mantine/core';
import dynamic from 'next/dynamic';
import Footer from '@/components/Footer';
// Importar estilos globales de Mantine


const Navbar = dynamic(() => import('@/components/Navbar'), { ssr: false });
const ImageSlider = dynamic(() => import('@/components/ImageSlider'), { ssr: false });

const Page = () => {
  return (
    <>
      <Navbar />
      <Container m={0} p={0}>
        <ImageSlider />
      </Container>
      <Footer />
    </>
  );
}

export default Page;
