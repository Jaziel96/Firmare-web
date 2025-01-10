"use client";

import { Container } from '@mantine/core';
import dynamic from 'next/dynamic';
import Footer from '@/components/Footer';



const Navbar = dynamic(() => import('@/components/Navbar'), { ssr: false });
const ImageSlider = dynamic(() => import('@/components/ImageSlider'), { ssr: false });

const Page = () => {
  return (
    <>
      
      <Container m={0} p={0} style={{ maxWidth: '100%', overflowX: 'hidden' }}>
        <Navbar />
        <ImageSlider />
        <Footer />
      </Container>
    </>
  );
}

export default Page;
