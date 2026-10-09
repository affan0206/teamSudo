import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpenCheck,
  ClipboardCheck,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import {
  AcademicDataset,
  CsvImportRowValidation,
  InterventionStatus,
  RiskLevel,
  RiskThresholds,
} from './types/academic';
import { AuthenticatedUserProfile } from './types/auth';
import { DEFAULT_RISK_THRESHOLDS } from './data/syntheticCohort';
import {
  signOutCurrentSession,
  verifyCurrentSession,
} from './services/authService';
import {
  commitValidatedCsvRows,
  createInterventionRecord,
  fetchAuthorizedAcademicData,
  resetDatasetOnServer,
  saveRiskThresholdsOnServer,
  updateInterventionRecord,
  upsertAssessmentScore,
  upsertAttendanceRecord,
} from './services/dataService';
import { evaluateCohort } from './services/riskEngine';
import { LoginPage } from './components/LoginPage';
import { LandingPage } from './components/LandingPage';
import { StudyNotesView } from './components/StudyNotesView';
import { LandingSectionId } from './components/PublicNavbar';
import { OverviewDashboard } from './components/OverviewDashboard';
import { StudentDirectory } from './components/StudentDirectory';
import { StudentProfileView } from './components/StudentProfileView';
import { RecordsAndCsvView } from './components/RecordsAndCsvView';
import { InterventionsBoard } from './components/InterventionsBoard';
import { StudentSelfCheckView } from './components/StudentSelfCheckView';
import { RiskThresholdsModal } from './components/RiskThresholdsModal';
import { ThemeToggle } from './components/ThemeToggle';

type FacultyTab = 'OVERVIEW' | 'DIRECTORY' | 'PROFILE' | 'RECORDS' | 'INTERVENTIONS';

function normalizePathname(rawPathname: string): string {
  return rawPathname.replace(/\/+$/, '') || '/';
}

function isPublicPathname(pathname: string): boolean {
  const clean = normalizePathname(pathname);
  return clean === '/' || clean === '/notes' || clean.startsWith('/notes/');
}

function parsePathToFacultyTab(pathname: string): {
  tab: FacultyTab;
  studentIdFromUrl?: string;
} {
  const clean = normalizePathname(pathname);
  if (clean.startsWith('/faculty/students/')) {
    const id = clean.replace('/faculty/students/', '').trim();
    return { tab: 'PROFILE', studentIdFromUrl: id || undefined };
  }
  if (clean === '/faculty/students') return { tab: 'DIRECTORY' };
  if (clean === '/faculty/records') return { tab: 'RECORDS' };
  if (clean === '/faculty/interventions') return { tab: 'INTERVENTIONS' };
  return { tab: 'OVERVIEW' };
}

function facultyTabToPath(tab: FacultyTab, studentId?: string): string {
  switch (tab) {
    case 'OVERVIEW':
      return '/faculty/overview';
    case 'DIRECTORY':
      return '/faculty/students';
    case 'PROFILE':
      return `/faculty/students/${studentId || 'stu-001'}`;
    case 'RECORDS':
      return '/faculty/records';
    case 'INTERVENTIONS':
      return '/faculty/interventions';
  }
}

export function App() {
  const [currentPath, setCurrentPath] = useState<string>(() =>
    normalizePathname(window.location.pathname)
  );
  const [intendedRedirectPath, setIntendedRedirectPath] = useState<string | null>(
    null
  );

  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<AuthenticatedUserProfile | null>(null);
  const [authErrorBanner, setAuthErrorBanner] = useState<string | null>(null);

  const [dataset, setDataset] = useState<AcademicDataset | null>(null);
  const [thresholds, setThresholds] = useState<RiskThresholds>({
    ...DEFAULT_RISK_THRESHOLDS,
  });
  const [dataLoading, setDataLoading] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<FacultyTab>('OVERVIEW');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('stu-001');
  const [directoryRiskFilter, setDirectoryRiskFilter] = useState<RiskLevel | 'ALL'>('ALL');
  const [isThresholdsModalOpen, setIsThresholdsModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const navigatePath = useCallback((nextPath: string, replace = false) => {
    const cleanNext = normalizePathname(nextPath);
    if (window.location.pathname !== cleanNext) {
      if (replace) {
        window.history.replaceState({}, '', cleanNext);
      } else {
        window.history.pushState({}, '', cleanNext);
      }
    }
    setCurrentPath(cleanNext);
  }, []);

  const synchronizeRouteWithRole = useCallback(
    (user: AuthenticatedUserProfile, rawPathname: string, rawSearch: string) => {
      const cleanPath = normalizePathname(rawPathname);
      const params = new URLSearchParams(rawSearch);

      if (user.role === 'STUDENT') {
        const attemptedStudentParam = params.get('studentId');
        const attemptedFacultyRoute = cleanPath.startsWith('/faculty');
        const attemptedOtherStudentRoute =
          cleanPath.startsWith('/student/') &&
          cleanPath !== '/student/portal' &&
          cleanPath !== `/student/portal/${user.studentId}`;

        if (
          attemptedFacultyRoute ||
          attemptedOtherStudentRoute ||
          (attemptedStudentParam && attemptedStudentParam !== user.studentId)
        ) {
          showToast(
            'Access restricted: Student accounts can only view their own academic record.'
          );
        }

        if (user.studentId) {
          setSelectedStudentId(user.studentId);
        }
        navigatePath('/student/portal', true);
        return;
      }

      // FACULTY role
      if (
        cleanPath === '/' ||
        cleanPath === '/login' ||
        cleanPath.startsWith('/student') ||
        isPublicPathname(cleanPath)
      ) {
        setActiveTab('OVERVIEW');
        navigatePath('/faculty/overview', true);
        return;
      }

      const parsed = parsePathToFacultyTab(cleanPath);
      setActiveTab(parsed.tab);
      if (parsed.studentIdFromUrl) {
        setSelectedStudentId(parsed.studentIdFromUrl);
      }
      navigatePath(cleanPath, true);
    },
    [navigatePath, showToast]
  );

  const loadAuthorizedData = useCallback(
    async (user: AuthenticatedUserProfile) => {
      setDataLoading(true);
      try {
        const res = await fetchAuthorizedAcademicData();
        if (res.error || !res.dataset) {
          setAuthErrorBanner(res.error || 'Session expired. Please sign in again.');
          setCurrentUser(null);
          setDataset(null);
          navigatePath('/login', true);
          return;
        }
        setDataset(res.dataset);
        setThresholds(res.thresholds);
        if (user.role === 'STUDENT' && user.studentId) {
          setSelectedStudentId(user.studentId);
        } else if (res.dataset.students.length > 0) {
          setSelectedStudentId((prev) =>
            res.dataset!.students.some((s) => s.id === prev)
              ? prev
              : res.dataset!.students[0].id
          );
        }
      } finally {
        setDataLoading(false);
      }
    },
    [navigatePath]
  );

  // Verify session on initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      setAuthLoading(true);
      const initialCleanPath = normalizePathname(window.location.pathname);
      const session = await verifyCurrentSession();
      if (!mounted) return;

      if (!session.authenticated || !session.user) {
        setCurrentUser(null);
        setDataset(null);
        // Allow public routes ('/', '/notes', '/notes/:slug') and '/login' without redirecting
        if (!isPublicPathname(initialCleanPath) && initialCleanPath !== '/login') {
          setIntendedRedirectPath(initialCleanPath);
          setAuthErrorBanner(
            'Authentication required. Please sign in to access academic portals.'
          );
          navigatePath('/login', true);
        } else {
          setCurrentPath(initialCleanPath);
        }
        setAuthLoading(false);
        return;
      }

      setCurrentUser(session.user);
      if (isPublicPathname(initialCleanPath)) {
        // Keep public route visible if explicitly opened, while preloading authorized dataset
        setCurrentPath(initialCleanPath);
        await loadAuthorizedData(session.user);
      } else {
        synchronizeRouteWithRole(
          session.user,
          initialCleanPath,
          window.location.search
        );
        await loadAuthorizedData(session.user);
      }
      if (mounted) {
        setAuthLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [loadAuthorizedData, navigatePath, synchronizeRouteWithRole]);

  // Listen to browser Back/Forward navigation and enforce role guards
  useEffect(() => {
    const handlePopState = () => {
      const nextClean = normalizePathname(window.location.pathname);
      setCurrentPath(nextClean);

      if (isPublicPathname(nextClean)) {
        return;
      }

      if (!currentUser) {
        if (nextClean !== '/login') {
          setIntendedRedirectPath(nextClean);
          navigatePath('/login', true);
        }
        return;
      }

      synchronizeRouteWithRole(
        currentUser,
        nextClean,
        window.location.search
      );
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser, navigatePath, synchronizeRouteWithRole]);

  const handleLoginSuccess = async (user: AuthenticatedUserProfile) => {
    setAuthErrorBanner(null);
    setCurrentUser(user);
    const targetAfterLogin = intendedRedirectPath || '/login';
    setIntendedRedirectPath(null);
    synchronizeRouteWithRole(user, targetAfterLogin, window.location.search);
    await loadAuthorizedData(user);
  };

  const handleLogout = async () => {
    await signOutCurrentSession();
    setCurrentUser(null);
    setDataset(null);
    setMobileMenuOpen(false);
    navigatePath('/login', true);
  };

  const handleNavigateHome = useCallback(() => {
    navigatePath('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navigatePath]);

  const handleNavigateLandingSection = useCallback(
    (sectionId: LandingSectionId) => {
      if (normalizePathname(window.location.pathname) !== '/') {
        navigatePath('/');
        setTimeout(() => {
          if (sectionId === 'home') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            document
              .getElementById(sectionId)
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 60);
        return;
      }

      if (sectionId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        document
          .getElementById(sectionId)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [navigatePath]
  );

  const handleOpenNotesDirectory = useCallback(() => {
    navigatePath('/notes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navigatePath]);

  const handleOpenSubjectNotes = useCallback(
    (slug: string | null) => {
      navigatePath(slug ? `/notes/${slug}` : '/notes');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [navigatePath]
  );

  const handleNavigateLogin = useCallback(() => {
    setAuthErrorBanner(null);
    navigatePath('/login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navigatePath]);

  const handleNavigateAuthorizedDashboard = useCallback(() => {
    if (!currentUser) {
      navigatePath('/login');
      return;
    }
    if (currentUser.role === 'STUDENT') {
      navigatePath('/student/portal');
    } else {
      navigatePath(facultyTabToPath(activeTab, selectedStudentId));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, currentUser, navigatePath, selectedStudentId]);

  const evaluations = useMemo(
    () => (dataset ? evaluateCohort(dataset, thresholds) : []),
    [dataset, thresholds]
  );

  const selectedEvaluation = useMemo(() => {
    if (!currentUser || evaluations.length === 0) return undefined;
    if (currentUser.role === 'STUDENT') {
      return (
        evaluations.find((e) => e.student.id === currentUser.studentId) ??
        evaluations[0]
      );
    }
    return (
      evaluations.find((e) => e.student.id === selectedStudentId) ?? evaluations[0]
    );
  }, [currentUser, evaluations, selectedStudentId]);

  const handleSelectNavTab = (tab: FacultyTab) => {
    if (!currentUser || currentUser.role !== 'FACULTY') return;
    setActiveTab(tab);
    setMobileMenuOpen(false);
    navigatePath(facultyTabToPath(tab, selectedStudentId));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenStudentProfile = (studentId: string) => {
    if (!currentUser || currentUser.role !== 'FACULTY') return;
    setSelectedStudentId(studentId);
    setActiveTab('PROFILE');
    setMobileMenuOpen(false);
    navigatePath(`/faculty/students/${studentId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateDirectoryWithFilter = (riskFilter: RiskLevel | 'ALL') => {
    if (!currentUser || currentUser.role !== 'FACULTY') return;
    setDirectoryRiskFilter(riskFilter);
    setActiveTab('DIRECTORY');
    setMobileMenuOpen(false);
    navigatePath('/faculty/students');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateScore = async (
    studentId: string,
    assessmentId: string,
    marksObtained: number | null
  ): Promise<string | undefined> => {
    if (!dataset || currentUser?.role !== 'FACULTY') {
      return 'Forbidden: Faculty authorization required.';
    }
    const res = await upsertAssessmentScore(
      dataset,
      studentId,
      assessmentId,
      marksObtained
    );
    if (res.error) return res.error;
    setDataset(res.dataset);
    return undefined;
  };

  const handleUpdateAttendance = async (
    studentId: string,
    subjectId: string,
    classesAttended: number,
    classesHeld: number
  ): Promise<string | undefined> => {
    if (!dataset || currentUser?.role !== 'FACULTY') {
      return 'Forbidden: Faculty authorization required.';
    }
    const res = await upsertAttendanceRecord(
      dataset,
      studentId,
      subjectId,
      classesAttended,
      classesHeld
    );
    if (res.error) return res.error;
    setDataset(res.dataset);
    return undefined;
  };

  const handleCreateIntervention = async (input: {
    studentId: string;
    subjectId: string | null;
    actionTitle: string;
    description: string;
    assignedFaculty: string;
    followUpDate: string;
    triggerFactors: string[];
  }): Promise<string | undefined> => {
    if (!dataset || currentUser?.role !== 'FACULTY') {
      return 'Forbidden: Faculty authorization required.';
    }
    const targetEval = evaluations.find((e) => e.student.id === input.studentId);
    const res = await createInterventionRecord(dataset, {
      ...input,
      riskLevelAtCreation: targetEval?.riskLevel ?? 'MEDIUM',
    });
    if (res.error) return res.error;
    setDataset(res.dataset);
    showToast('Intervention recorded.');
    return undefined;
  };

  const handleUpdateIntervention = async (
    interventionId: string,
    status: InterventionStatus,
    outcomeNotes: string
  ): Promise<string | undefined> => {
    if (!dataset || currentUser?.role !== 'FACULTY') {
      return 'Forbidden: Faculty authorization required.';
    }
    const res = await updateInterventionRecord(dataset, interventionId, {
      status,
      outcomeNotes,
    });
    if (res.error) return res.error;
    setDataset(res.dataset);
    showToast('Intervention updated.');
    return undefined;
  };

  const handleCommitCsv = async (
    validRows: CsvImportRowValidation[]
  ): Promise<number> => {
    if (!dataset || currentUser?.role !== 'FACULTY') return 0;
    const res = await commitValidatedCsvRows(dataset, validRows);
    if (res.error) {
      showToast(res.error);
      return 0;
    }
    setDataset(res.dataset);
    showToast(`Imported ${res.appliedCount} record(s).`);
    return res.appliedCount;
  };

  const handleResetDemoData = async () => {
    if (!dataset || currentUser?.role !== 'FACULTY') return;
    const res = await resetDatasetOnServer(dataset);
    if (res.error) {
      showToast(res.error);
      return;
    }
    setDataset(res.dataset);
    setThresholds(res.thresholds);
    showToast('Cohort dataset restored to default baseline.');
  };

  const handleSaveThresholds = async (next: RiskThresholds) => {
    if (currentUser?.role !== 'FACULTY') return;
    const res = await saveRiskThresholdsOnServer(next);
    if (res.error) {
      showToast(res.error);
      return;
    }
    setThresholds(res.thresholds);
    showToast('Risk rules updated.');
  };

  // 1. Public Landing Page ('/')
  if (currentPath === '/') {
    return (
      <LandingPage
        onNavigateLogin={handleNavigateLogin}
        onOpenNotesDirectory={handleOpenNotesDirectory}
        onOpenSubjectNotes={(slug) => handleOpenSubjectNotes(slug)}
        onNavigateDashboard={
          currentUser ? handleNavigateAuthorizedDashboard : undefined
        }
        isAuthenticated={Boolean(currentUser)}
      />
    );
  }

  // 2. Public Study Notes Views ('/notes' and '/notes/:subjectSlug')
  if (currentPath === '/notes' || currentPath.startsWith('/notes/')) {
    const subjectSlug = currentPath.startsWith('/notes/')
      ? currentPath.slice('/notes/'.length).trim() || undefined
      : undefined;

    return (
      <StudyNotesView
        subjectSlug={subjectSlug}
        onNavigateHome={handleNavigateHome}
        onNavigateSection={handleNavigateLandingSection}
        onNavigateLogin={handleNavigateLogin}
        onSelectSubjectSlug={handleOpenSubjectNotes}
        onNavigateDashboard={
          currentUser ? handleNavigateAuthorizedDashboard : undefined
        }
        isAuthenticated={Boolean(currentUser)}
      />
    );
  }

  // 3. Dedicated Login Page ('/login')
  if (currentPath === '/login') {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        accessErrorMessage={authErrorBanner}
        onNavigateHome={handleNavigateHome}
      />
    );
  }

  // 4. Protected Routes ('/faculty/*' and '/student/*')
  if (authLoading) {
    return (
      <div className="min-h-screen bg-ghost flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-imperial">
          <Loader2 className="w-4 h-4 text-bluebell animate-spin" />
          <span>Verifying session credentials...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        accessErrorMessage={authErrorBanner}
        onNavigateHome={handleNavigateHome}
      />
    );
  }

  if (dataLoading || !dataset) {
    return (
      <div className="min-h-screen bg-ghost flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-imperial">
          <Loader2 className="w-4 h-4 text-bluebell animate-spin" />
          <span>Loading authorized academic records...</span>
        </div>
      </div>
    );
  }

  const activeInterventionsCount = dataset.interventions.filter(
    (i) => i.status === 'PLANNED' || i.status === 'IN_PROGRESS'
  ).length;

  const highRiskTotal = evaluations.filter((e) => e.riskLevel === 'HIGH').length;

  const facultyNavItems: {
    id: FacultyTab;
    label: string;
    Icon: React.FC<{ className?: string }>;
    badge?: string;
    badgeTone?: 'neutral' | 'danger' | 'info';
  }[] = [
    {
      id: 'OVERVIEW',
      label: 'Overview',
      Icon: LayoutDashboard,
      badge: highRiskTotal > 0 ? `${highRiskTotal}` : undefined,
      badgeTone: 'danger',
    },
    {
      id: 'DIRECTORY',
      label: 'Students',
      Icon: Users,
      badge: `${evaluations.length}`,
      badgeTone: 'neutral',
    },
    {
      id: 'PROFILE',
      label: 'Student Profile',
      Icon: UserCheck,
    },
    {
      id: 'RECORDS',
      label: 'Records',
      Icon: FileSpreadsheet,
    },
    {
      id: 'INTERVENTIONS',
      label: 'Interventions',
      Icon: ClipboardCheck,
      badge: activeInterventionsCount > 0 ? `${activeInterventionsCount}` : undefined,
      badgeTone: 'info',
    },
  ];

  const renderSidebarContent = () => (
    <div className="flex flex-col justify-between h-full bg-sidebar text-sidebar-text border-r border-sidebar-border select-none">
      <div className="space-y-6">
        {/* Brand Masthead */}
        <div className="px-5 pt-6 pb-5 border-b border-sidebar-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-apricot text-bordeaux flex items-center justify-center shrink-0 shadow-card">
              <BookOpenCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-sm font-bold tracking-tight text-sidebar-text leading-none truncate">
                Academic Insight
              </div>
              <div className="text-[11px] text-sidebar-muted mt-1 truncate">
                {currentUser.role === 'FACULTY' ? 'Faculty Portal' : 'Student Portal'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <ThemeToggle variant="sidebar" />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-sidebar-muted hover:text-sidebar-text rounded-lg transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Primary Navigation Links */}
        {currentUser.role === 'FACULTY' ? (
          <div className="px-3">
            <nav aria-label="Faculty Navigation" className="space-y-1">
              {facultyNavItems.map(({ id, label, Icon, badge, badgeTone }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelectNavTab(id)}
                    className={`group relative w-full flex items-center justify-between px-3.5 py-2.5 text-sm rounded-lg transition-all duration-150 ${
                      isActive
                        ? 'bg-berry/55 text-sidebar-text font-semibold shadow-card border border-blush/35'
                        : 'text-sidebar-text/80 hover:text-sidebar-text hover:bg-white/8'
                    }`}
                  >
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-cotton"
                      />
                    )}
                    <span className="flex items-center gap-3 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-cotton'
                            : 'text-sidebar-muted/75 group-hover:text-sidebar-text'
                        }`}
                      />
                      <span className="truncate">{label}</span>
                    </span>
                    {badge && (
                      <span
                        className={`ml-2 text-xs font-mono tabular-nums px-2 py-0.5 rounded-md ${
                          badgeTone === 'danger'
                            ? 'bg-cotton text-bordeaux font-semibold'
                            : isActive
                            ? 'bg-blush/40 text-sidebar-text'
                            : 'bg-white/10 text-sidebar-muted'
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ) : (
          <div className="px-3">
            <nav aria-label="Student Navigation" className="space-y-1">
              <div className="relative w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-semibold rounded-lg bg-berry/55 text-sidebar-text border border-blush/35 shadow-card">
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-cotton"
                />
                <span className="flex items-center gap-3">
                  <GraduationCap className="w-4 h-4 shrink-0 text-cotton" />
                  <span>Overview</span>
                </span>
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Secondary Settings & Identity Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-4 bg-sidebar-elevated/60">
        {currentUser.role === 'FACULTY' && (
          <div className="grid grid-cols-2 gap-2 pb-3.5 border-b border-sidebar-border">
            <button
              type="button"
              onClick={() => {
                setIsThresholdsModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium text-sidebar-text/90 hover:text-sidebar-text hover:bg-white/10 border border-white/12 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-cotton shrink-0" />
              <span className="truncate">Risk rules</span>
            </button>

            <button
              type="button"
              onClick={handleResetDemoData}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium text-sidebar-text/90 hover:text-sidebar-text hover:bg-white/10 border border-white/12 transition-colors"
              title="Restore cohort records to default baseline"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cotton shrink-0" />
              <span className="truncate">Reset data</span>
            </button>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-sidebar-text truncate">
                {currentUser.fullName}
              </div>
              <div className="text-xs text-sidebar-muted/85 truncate">
                {currentUser.email}
              </div>
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-berry/50 border border-blush/50 text-sidebar-text shrink-0">
              {currentUser.role === 'FACULTY' ? 'Faculty' : 'Student'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/18 text-sidebar-text border border-white/15 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-cotton" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-ghost text-carbon">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 sticky top-0 h-screen shadow-monolith z-20">
        {renderSidebarContent()}
      </aside>

      {/* Mobile & Tablet Top Header */}
      <header className="lg:hidden sticky top-0 z-30 bg-sidebar text-sidebar-text border-b border-sidebar-border px-4 py-3.5 flex items-center justify-between shadow-card">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 -ml-1 text-sidebar-muted hover:text-sidebar-text rounded-lg border border-white/15 bg-white/10"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-apricot text-bordeaux flex items-center justify-center">
              <BookOpenCheck className="w-3.5 h-3.5" />
            </div>
            <span className="font-display text-sm font-bold text-sidebar-text">
              Academic Insight
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle variant="sidebar" />
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-white/15 bg-white/10 text-sidebar-text hover:bg-white/20"
          >
            <LogOut className="w-3.5 h-3.5 text-cotton" />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-bordeaux/65 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 max-w-[82vw] h-full shadow-elevated z-10">
            {renderSidebarContent()}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 bg-sidebar text-sidebar-text px-4 py-3 rounded-lg shadow-elevated border border-blush/50 text-sm font-medium flex items-center gap-2.5 animate-view-enter"
        >
          <span className="w-2 h-2 rounded-full bg-cotton shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area (32-40px padding on desktop) */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 max-w-[1260px] w-full mx-auto px-5 sm:px-8 lg:px-10 py-8 lg:py-10">
          <div key={currentUser.role === 'STUDENT' ? 'STUDENT' : activeTab} className="animate-view-enter">
            {currentUser.role === 'STUDENT' ? (
              selectedEvaluation ? (
                <StudentSelfCheckView
                  evaluation={selectedEvaluation}
                  thresholds={thresholds}
                />
              ) : (
                <div className="card-surface p-6 text-xs text-ink-secondary flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-magenta" />
                  <span>No student academic profile is bound to this account.</span>
                </div>
              )
            ) : (
              <>
                {activeTab === 'OVERVIEW' && (
                  <OverviewDashboard
                    dataset={dataset}
                    evaluations={evaluations}
                    thresholds={thresholds}
                    onSelectStudent={handleOpenStudentProfile}
                    onNavigateDirectoryWithFilter={handleNavigateDirectoryWithFilter}
                    onNavigateInterventions={() => handleSelectNavTab('INTERVENTIONS')}
                    onNavigateRecords={() => handleSelectNavTab('RECORDS')}
                    onOpenThresholdsModal={() => setIsThresholdsModalOpen(true)}
                  />
                )}

                {activeTab === 'DIRECTORY' && (
                  <StudentDirectory
                    dataset={dataset}
                    evaluations={evaluations}
                    thresholds={thresholds}
                    initialRiskFilter={directoryRiskFilter}
                    onSelectStudent={handleOpenStudentProfile}
                  />
                )}

                {activeTab === 'PROFILE' && selectedEvaluation && (
                  <StudentProfileView
                    evaluation={selectedEvaluation}
                    allEvaluations={evaluations}
                    dataset={dataset}
                    thresholds={thresholds}
                    onBackToDirectory={() => handleSelectNavTab('DIRECTORY')}
                    onSelectStudent={(id) => handleOpenStudentProfile(id)}
                    onUpdateScore={handleUpdateScore}
                    onUpdateAttendance={handleUpdateAttendance}
                    onCreateIntervention={handleCreateIntervention}
                    onUpdateIntervention={handleUpdateIntervention}
                  />
                )}

                {activeTab === 'RECORDS' && (
                  <RecordsAndCsvView
                    dataset={dataset}
                    evaluations={evaluations}
                    onUpdateScore={handleUpdateScore}
                    onUpdateAttendance={handleUpdateAttendance}
                    onCommitCsvRows={handleCommitCsv}
                    onSelectStudent={handleOpenStudentProfile}
                  />
                )}

                {activeTab === 'INTERVENTIONS' && (
                  <InterventionsBoard
                    dataset={dataset}
                    evaluations={evaluations}
                    onSelectStudent={handleOpenStudentProfile}
                    onCreateIntervention={handleCreateIntervention}
                    onUpdateIntervention={handleUpdateIntervention}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Faculty-Only Configurable Risk Thresholds Modal */}
      {currentUser.role === 'FACULTY' && (
        <RiskThresholdsModal
          isOpen={isThresholdsModalOpen}
          thresholds={thresholds}
          onClose={() => setIsThresholdsModalOpen(false)}
          onSave={handleSaveThresholds}
        />
      )}
    </div>
  );
}

export default App;
