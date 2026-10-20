import React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
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

function PageRenderer() {
  const { route } = useRouter();

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
  const { user, loading } = useAuth();

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
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
