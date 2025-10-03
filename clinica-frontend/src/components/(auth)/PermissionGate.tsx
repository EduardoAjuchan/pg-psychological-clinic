'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasPermission } from '@/lib/permissions';

export default function PermissionGate({
  required,
  fallbackHref = '/dashboard',
  children,
}: {
  required: string | string[];
  fallbackHref?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const req = Array.isArray(required) ? required : [required];
    const ok = req.every(hasPermission);
    setAllowed(ok);
    if (!ok) router.replace(fallbackHref);
  }, [required, router]);

  if (allowed === null) return null; // opcional: spinner
  if (!allowed) return null;
  return <>{children}</>;
}