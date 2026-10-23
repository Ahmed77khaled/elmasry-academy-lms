import { useEffect, useState, useCallback, createContext, useContext, useRef } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  ClipboardList,
  CreditCard,
  Receipt,
  Wallet,
  Settings,
  LogOut,
  Menu,
  Search,
  Shield,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getAdminDisplayName, getRoleDisplayName } from '@/lib/adminLabels';
import { supabase } from '@/lib/supabase';
import { formatEGP } from '@/lib/format';
import { PageLoader } from '@/components/ui/Feedback';
import { AcademyLogo } from '@/components/AcademyLogo';
import { AdminAvatar } from '@/components/AdminAvatar';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLocale } from '@/context/LocaleContext';
import { translate, translateTemplate } from '@/lib/translations';

type Page =
  | 'dashboard'
  | 'students'
  | 'student-details'
  | 'courses'
  | 'course-details'
  | 'enrollments'
  | 'payments'
  | 'expenses'
  | 'cashboxes'
  | 'settings';

interface RouteState {
  page: Page;
  params: Record<string, string>;
}

interface RouterContextType {
  route: RouteState;
  navigate: (page: Page, params?: Record<string, string>) => void;
}

const RouterContext = createContext<RouterContextType | null>(null);

export function useRouter(): RouterContextType {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}

function parseHash(): RouteState {
  const hash = window.location.hash.slice(1) || '/';
  const parts = hash.split('/');
  const page = (parts[1] as Page) || 'dashboard';
  const params: Record<string, string> = {};
  for (let i = 2; i < parts.length; i += 2) {
    if (parts[i] && parts[i + 1]) {
      params[parts[i]] = decodeURIComponent(parts[i + 1]);
    }
  }
  return { page, params };
}

function buildHash(page: Page, params?: Record<string, string>): string {
  let hash = `/${page}`;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      hash += `/${key}/${encodeURIComponent(value)}`;
    }
  }
  return hash;
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = useState<RouteState>(parseHash());

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((page: Page, params?: Record<string, string>) => {
    window.location.hash = buildHash(page, params);
    window.scrollTo(0, 0);
  }, []);

  return (
    <RouterContext.Provider value={{ route, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

const NAV_ITEMS: { page: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { page: 'students', label: 'الطلاب', icon: GraduationCap },
  { page: 'courses', label: 'الكورسات', icon: BookOpen },
  { page: 'enrollments', label: 'الاشتراكات', icon: ClipboardList },
  { page: 'payments', label: 'الدفعات', icon: CreditCard },
  { page: 'expenses', label: 'المصروفات', icon: Receipt },
  { page: 'cashboxes', label: 'الخزن وصناديق المال', icon: Wallet },
  { page: 'settings', label: 'الإعدادات والأمان', icon: Settings },
];

const PAGE_TITLES: Record<Page, string> = {
  dashboard: 'لوحة المؤشرات المالية والتشغيلية',
  students: 'إدارة الطلاب',
  'student-details': 'ملف الطالب',
  courses: 'إدارة الكورسات',
  'course-details': 'تفاصيل الكورس',
  enrollments: 'جدول الاشتراكات المركزي',
  payments: 'الدفعات والمقبوضات',
  expenses: 'إدارة المصروفات',
  cashboxes: 'الخزن وصناديق المال',
  settings: 'الإعدادات والأمان',
};

interface SearchResults {
  students: { student_id: string; name: string; phone: string | null }[];
  courses: { course_id: string; course_name: string; default_cost: number | null }[];
  payments: { payment_id: string; receipt_number: number; receipt_ref: string | null; amount: number; payment_date: string }[];
}

function canAccessPage(page: Page, permissions: string[]): boolean {
  if (page === 'settings') return true;
  if (page === 'dashboard') {
    return permissions.includes('dashboard.operational.read') || permissions.includes('dashboard.finance.read');
  }
  if (page === 'students' || page === 'student-details') return permissions.includes('students.read');
  if (page === 'courses' || page === 'course-details') return permissions.includes('courses.read');
  if (page === 'enrollments') return permissions.includes('enrollments.read');
  if (page === 'payments') return permissions.includes('finance.payments.read');
  if (page === 'expenses') return permissions.includes('finance.expenses.read');
  if (page === 'cashboxes') return permissions.includes('finance.cash_boxes.read');
  return false;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { route, navigate } = useRouter();
  const { locale } = useLocale();
  const { user, signOut, permissions, authorizationReady, loading: authLoading, isOwner, roleKey } = useAuth();
  const displayName = getAdminDisplayName(user);
  const roleLabel = isOwner ? translate('مالك المنصة') : translate(getRoleDisplayName(roleKey ?? ''));
  const pageTitle = route.page === 'dashboard' && !permissions.includes('dashboard.finance.read')
    ? translate('لوحة المؤشرات التشغيلية')
    : translate(PAGE_TITLES[route.page]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults>({ students: [], courses: [], payments: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleNav = (page: Page) => {
    navigate(page);
    setSidebarOpen(false);
  };

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults({ students: [], courses: [], payments: [] });
      setSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        if (!authorizationReady) {
          setSearchResults({ students: [], courses: [], payments: [] });
          setSearchOpen(true);
          return;
        }

        const [studentsRes, coursesRes, paymentsRes] = await Promise.all([
          permissions.includes('students.read')
            ? supabase.rpc('rbac_list_students', { p_search: q, p_limit: 5, p_offset: 0 })
            : Promise.resolve({ data: [], error: null }),
          permissions.includes('courses.read')
            ? supabase.rpc('rbac_list_courses', { p_limit: 500, p_offset: 0 })
            : Promise.resolve({ data: [], error: null }),
          permissions.includes('finance.payments.read')
            ? supabase.rpc('rbac_search_payments', { p_query: q, p_limit: 5 })
            : Promise.resolve({ data: [], error: null }),
        ]);

        const normalizedQuery = q.toLocaleLowerCase();
        const matchingCourses = ((coursesRes.data ?? []) as SearchResults['courses'])
          .filter((course) => course.course_name.toLocaleLowerCase().includes(normalizedQuery))
          .slice(0, 5);
        setSearchResults({
          students: studentsRes.data ?? [],
          courses: matchingCourses,
          payments: paymentsRes.data ?? [],
        });
        setSearchOpen(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, authorizationReady, permissions]);

  const hasResults =
    searchResults.students.length > 0 ||
    searchResults.courses.length > 0 ||
    searchResults.payments.length > 0;

  return (
    <div className="min-h-screen bg-obsidian-900 flex flex-col" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Backdrop Overlay when Sidebar Drawer is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Slide-in Sidebar Drawer (Toggled via the 3-line hamburger menu) */}
      <aside
        className={`
          fixed top-0 z-50 h-screen w-80 max-w-[85vw]
          bg-obsidian-800 border-obsidian-500/50 shadow-2xl
          flex flex-col transition-transform duration-300 ease-in-out
          ${locale === 'ar' ? 'right-0 border-l' : 'left-0 border-r'}
          ${sidebarOpen ? 'translate-x-0' : locale === 'ar' ? 'translate-x-full' : '-translate-x-full'}
        `}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-obsidian-500/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-brand to-emerald-dark flex items-center justify-center shrink-0 shadow-lg shadow-emerald-brand/20">
              <AcademyLogo imageClassName="w-full h-full object-contain p-1" fallbackClassName="text-white font-bold text-xl font-arabic" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">{translate("أكاديمية المصري")}</h1>
              <p className="text-obsidian-300 text-xs">{translate("نظام إدارة التدريب المعتمد")}</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-obsidian-300 hover:text-white p-1.5 rounded-lg hover:bg-obsidian-700 transition-colors"
            title={translate("إغلاق القائمة")}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1.5">
          {(authorizationReady ? NAV_ITEMS.filter((item) => canAccessPage(item.page, permissions)) : []).map((item) => {
            const isActive =
              route.page === item.page ||
              (route.page === 'student-details' && item.page === 'students') ||
              (route.page === 'course-details' && item.page === 'courses');
            const Icon = item.icon;
            return (
              <button
                key={item.page}
                onClick={() => handleNav(item.page)}
                className={`
                  w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all
                  ${
                    isActive
                      ? 'bg-emerald-brand/20 text-emerald-light border border-emerald-brand/40 shadow-sm'
                      : 'text-obsidian-200 hover:bg-obsidian-700/60 hover:text-white border border-transparent'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className={isActive ? 'text-emerald-light' : 'text-obsidian-300'} />
                  <span>{translate(item.label)}</span>
                </div>
                {isActive && <div className="w-2 h-2 rounded-full bg-emerald-brand" />}
              </button>
            );
          })}
        </nav>

        {/* Drawer Footer */}
        <div className="shrink-0 p-4 border-t border-obsidian-500/40 space-y-3 bg-obsidian-850">
          <div className="bg-obsidian-700/70 rounded-xl p-3 border border-obsidian-500/30 text-center">
            <p className="text-obsidian-300 text-xs">{translate("بوابة الإدارة")}</p>
            <p className="text-emerald-light text-sm font-bold mt-1">{roleLabel}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/30"
          >
            <LogOut size={18} />
            <span>{translate("تسجيل الخروج")}</span>
          </button>
        </div>
      </aside>

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-obsidian-800/90 backdrop-blur-md border-b border-obsidian-500/40">
        <div className="flex items-center gap-3 px-4 lg:px-6 h-16">
          {/* 3-Lines Hamburger Menu Button — Always Available on Right (RTL) */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-obsidian-700 hover:bg-obsidian-600 border border-obsidian-500/40 text-emerald-light hover:text-white transition-all shadow-sm"
            title={translate("فتح القائمة الرئيسية")}
          >
            <Menu size={22} />
          </button>
          <LanguageToggle compact />

          {/* Logo & Platform Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-brand to-emerald-dark flex items-center justify-center shrink-0 shadow-md shadow-emerald-brand/20">
              <AcademyLogo imageClassName="w-full h-full object-contain p-1" fallbackClassName="text-white font-bold text-sm font-arabic" />
            </div>
            <div className="min-w-0">
              <h2 className="text-white font-bold text-sm lg:text-base leading-tight truncate">
                {translate("أكاديمية المصري")}</h2>
              <p className="text-obsidian-300 text-xs truncate hidden sm:block">
                {pageTitle}
              </p>
            </div>
          </div>

          {/* Global Header Search Bar with Dropdown Results */}
          <div ref={searchContainerRef} className="relative mr-auto w-64 md:w-80 lg:w-96">
            <div className="flex items-center gap-2 bg-obsidian-700/80 rounded-xl px-3 py-2 border border-obsidian-500/40 focus-within:border-emerald-brand/50 focus-within:ring-1 focus-within:ring-emerald-brand/30 transition-all">
              <Search size={16} className="text-obsidian-300 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim() && hasResults) setSearchOpen(true);
                }}
                placeholder={translate("دوّر على طالب، كورس، أو رقم إيصال...")}
                className="bg-transparent text-sm text-obsidian-100 placeholder:text-obsidian-300 outline-none w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-obsidian-300 hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Dropdown Results */}
            {searchOpen && (
              <div className="absolute top-full right-0 left-0 mt-2 bg-obsidian-800 border border-obsidian-500/50 rounded-2xl shadow-2xl p-2 z-50 max-h-96 overflow-y-auto space-y-2 animate-fade-in">
                {isSearching ? (
                  <p className="p-3 text-xs text-obsidian-300 text-center">{translate("جاري البحث...")}</p>
                ) : !hasResults ? (
                  <p className="p-3 text-xs text-obsidian-300 text-center">{translateTemplate('لا توجد نتائج مطابقة لـ «{query}»', { query: searchQuery })}</p>
                ) : (
                  <>
                    {/* Students */}
                    {searchResults.students.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold text-obsidian-400 px-2.5 py-1 flex items-center gap-1">
                          <GraduationCap size={13} className="text-emerald-light" /> {translate("الطلاب")}</p>
                        {searchResults.students.map((s) => (
                          <button
                            key={s.student_id}
                            onClick={() => {
                              navigate('student-details', { id: s.student_id });
                              setSearchOpen(false);
                              setSearchQuery('');
                            }}
                            className="w-full text-right p-2 rounded-lg hover:bg-obsidian-700 flex items-center justify-between transition-colors"
                          >
                            <span className="text-sm font-medium text-white">{s.name}</span>
                            <span className="text-xs text-obsidian-300 font-num">{s.phone ?? ''}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Courses */}
                    {searchResults.courses.length > 0 && (
                      <div className="border-t border-obsidian-600/40 pt-1.5">
                        <p className="text-[11px] font-bold text-obsidian-400 px-2.5 py-1 flex items-center gap-1">
                          <BookOpen size={13} className="text-azure-brand" /> {translate("الكورسات")}</p>
                        {searchResults.courses.map((c) => (
                          <button
                            key={c.course_id}
                            onClick={() => {
                              navigate('course-details', { id: c.course_id });
                              setSearchOpen(false);
                              setSearchQuery('');
                            }}
                            className="w-full text-right p-2 rounded-lg hover:bg-obsidian-700 flex items-center justify-between transition-colors"
                          >
                            <span className="text-sm font-medium text-white">{c.course_name}</span>
                            {c.default_cost != null && <span className="text-xs text-emerald-light font-num font-bold">
                              {formatEGP(c.default_cost)}
                            </span>}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Payments */}
                    {searchResults.payments.length > 0 && (
                      <div className="border-t border-obsidian-600/40 pt-1.5">
                        <p className="text-[11px] font-bold text-obsidian-400 px-2.5 py-1 flex items-center gap-1">
                          <Receipt size={13} className="text-violet-400" /> {translate("إيصالات الدفع")}</p>
                        {searchResults.payments.map((p) => (
                          <button
                            key={p.payment_id}
                            onClick={() => {
                              navigate('payments');
                              setSearchOpen(false);
                              setSearchQuery('');
                            }}
                            className="w-full text-right p-2 rounded-lg hover:bg-obsidian-700 flex items-center justify-between transition-colors"
                          >
                            <span className="text-sm font-medium text-white">{translateTemplate('إيصال: REC-{number}', { number: String(p.receipt_number).padStart(8, '0') })}</span>
                            <span className="text-xs text-emerald-light font-num font-bold">
                              {formatEGP(p.amount)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 bg-emerald-brand/10 border border-emerald-brand/30 rounded-full px-3 py-1.5 shrink-0">
            <Shield size={14} className="text-emerald-light" />
            <span className="text-emerald-light text-xs font-semibold">
              {authorizationReady ? translate("تم التحقق من الصلاحيات") : translate("جارٍ التحقق من الصلاحيات")}
            </span>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-azure-brand to-azure-light flex items-center justify-center shrink-0 shadow-sm">
              <AdminAvatar user={user} className="w-full h-full rounded-xl object-cover text-white font-bold text-sm font-arabic flex items-center justify-center" />
            </div>
            <div className="hidden lg:block">
              <p className="text-white text-xs font-bold">{displayName}</p>
              <p className="text-obsidian-300 text-[11px]">{roleLabel}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area (Now gets 100% full width when sidebar is closed) */}
      <main className="flex-1 p-4 lg:p-6 overflow-x-hidden max-w-7xl mx-auto w-full">
        <div className="animate-fade-in">
          {!authorizationReady
            ? authLoading
              ? <PageLoader />
              : <div role="alert" className="card-surface p-6 text-center text-rose-200 space-y-3">
                  <p>{translate("تعذر التحقق من الصلاحيات. تم إيقاف الوصول لحين توفر خدمة الصلاحيات.")}</p>
                  <button onClick={() => void signOut()} className="btn-secondary">{translate("تسجيل الخروج")}</button>
                </div>
            : !canAccessPage(route.page, permissions)
              ? <div role="alert" className="card-surface p-6 text-center text-rose-200">{translate("غير مصرح لك بعرض هذه الصفحة.")}</div>
              : children}
        </div>
      </main>
    </div>
  );
}
