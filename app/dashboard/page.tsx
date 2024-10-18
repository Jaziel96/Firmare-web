"use client";

import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error(error);
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={handleLogout}>Sign out</button>
    </div>
  );
}