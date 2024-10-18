"use client";

import { supabase } from '@/lib/supabase';
import styles from './Home.module.css';

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
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>Next Google Auth</h1>
        <button onClick={handleLogin}>Sign in with Google</button>
      </main>
    </div>
  );
}