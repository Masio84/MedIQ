import { redirect } from 'next/navigation';

export default function RootPage() {
  // Simple entry point, usually checks auth or redirects
  redirect('/login');
}
