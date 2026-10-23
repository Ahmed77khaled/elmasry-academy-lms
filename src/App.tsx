import { translate } from '@/lib/translations';
import { useLocale } from '@/context/LocaleContext';
import React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { BrandingProvider } from '@/context/BrandingContext';
import { LocaleProvider } from '@/context/LocaleContext';
import { RouterProvider, AppShell, useRouter } from '@/components/AppShell';
import { DashboardPage } from '@/pages/DashboardPage';
import { StudentsPage } from '@/pages/StudentsPage';
import { StudentDetailsPage } from '@/pages/StudentDetailsPage';
import { CoursesPage } from '@/pages/CoursesPage';
import { CourseDetailsPage } from '@/pages/CourseDetailsPage';
import { EnrollmentsPage } from '@/pages/EnrollmentsPage';
import { PaymentsPage } from '@/pages/PaymentsPage';
import { ExpensesPage } from '@/pages/ExpensesPage';
import { CashBoxesPage } from '@/pages/CashBoxesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { LoginPage } from '@/pages/LoginPage';
import { PageLoader } from '@/components/ui/Feedback';
import { ShieldAlert, LogOut } from 'lucide-react';

function PageRenderer() {
  const { route } = useRouter();
  const { locale } = useLocale();
  void locale;

  switch (route.page) {
    case 'dashboard':
      return <DashboardPage />;
    case 'students':
      return <StudentsPage />;
    case 'student-details':
      return <StudentDetailsPage key={route.params.id ?? 'student'} studentId={route.params.id ?? ''} />;
    case 'courses':
      return <CoursesPage />;
    case 'course-details':
      return <CourseDetailsPage key={route.params.id ?? 'course'} courseId={route.params.id ?? ''} />;
    case 'enrollments':
      return <EnrollmentsPage />;
    case 'payments':
      return <PaymentsPage />;
    case 'expenses':
      return <ExpensesPage />;
    case 'cashboxes':
      return <CashBoxesPage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <DashboardPage />;
  }
}

function AuthenticatedApp() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const { locale } = useLocale();

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian-900 flex items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Strict UI Guard: Only administrators can access the system
  if (!isAdmin) {
    return (
      <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-obsidian-900 flex items-center justify-center p-4">
        <div className="card-surface p-8 max-w-md w-full text-center space-y-5 border border-rose-500/30 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center shadow-lg shadow-rose-500/10 border border-rose-500/20">
            <ShieldAlert size={34} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{translate("غير مصرح بالدخول")}</h2>
            <p className="text-obsidian-300 text-sm mt-2 leading-relaxed">
              {translate("هذا النظام مخصص لمسؤولي ومديري أكاديمية المصري فقط. الحساب المسجل به (")}{user.email}{translate(") غير مدرج في سجل المسؤولين المعتمدين.")}</p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => void signOut()}
              className="btn-secondary w-full flex items-center justify-center gap-2 text-rose-300 hover:text-rose-200 border-rose-500/30 hover:bg-rose-500/10"
            >
              <LogOut size={16} />
              {translate("تسجيل الخروج والعودة")}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RouterProvider>
      <AppShell>
        <PageRenderer />
      </AppShell>
    </RouterProvider>
  );
}

function App() {
  return (
    <LocaleProvider>
      <BrandingProvider>
        <AuthProvider>
          <AuthenticatedApp />
        </AuthProvider>
      </BrandingProvider>
    </LocaleProvider>
  );
}

export default App;
