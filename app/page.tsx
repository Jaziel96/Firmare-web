"use client";

import { Container } from '@mantine/core';
import Navbar from '@/components/Navbar';
import ImageSlider from '@/components/ImageSlider';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

export default function Home() {
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
    <>
      <Navbar />
      <Container>
        <ImageSlider />
      </Container>
      <Footer />
    </>
  );
}