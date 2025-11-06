import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // For MVP, we'll handle auth differently
  // This is a stub
  return <>{children}</>;
}

