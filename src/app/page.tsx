import type { Metadata } from 'next';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import Trust from '@/components/landing/Trust';
import Simulator from '@/components/landing/Simulator';
import Plans from '@/components/landing/Plans';
import Contact from '@/components/landing/Contact';
import Footer from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'MedIQ - Sistema de Gestión Clínica Inteligente',
  description: 'Software médico con expediente clínico digital, agenda inteligente y cumplimiento NOM en México. Optimiza tu consultorio hoy.',
};

export default function RootPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Trust />
      <Features />
      <Simulator />
      <Plans />
      <Contact />
      <Footer />
    </main>
  );
}
