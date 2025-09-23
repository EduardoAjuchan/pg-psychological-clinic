import AuthGuard from '@/components/(auth)/AuthGuard';
import Shell from '@/components/layout/Shell';
import TourProvider from '@/modules/tour/TourProvider';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <TourProvider>
        <Shell>{children}</Shell>
      </TourProvider>
    </AuthGuard>
  );
}
