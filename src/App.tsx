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
import { OverviewDashboard } from './components/OverviewDashboard';
import { StudentDirectory } from './components/StudentDirectory';
import { StudentProfileView } from './components/StudentProfileView';
import { RecordsAndCsvView } from './components/RecordsAndCsvView';
import { InterventionsBoard } from './components/InterventionsBoard';
import { StudentSelfCheckView } from './components/StudentSelfCheckView';
import { RiskThresholdsModal } from './components/RiskThresholdsModal';

type FacultyTab = 'OVERVIEW' | 'DIRECTORY' | 'PROFILE' | 'RECORDS' | 'INTERVENTIONS';

function parsePathToFacultyTab(pathname: string): {
  tab: FacultyTab;
  studentIdFromUrl?: string;
} {
  const clean = pathname.replace(/\/+$/, '') || '/';
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
    if (window.location.pathname !== nextPath) {
      if (replace) {
        window.history.replaceState({}, '', nextPath);
      } else {
        window.history.pushState({}, '', nextPath);
      }
    }
  }, []);

  const synchronizeRouteWithRole = useCallback(
    (user: AuthenticatedUserProfile, rawPathname: string, rawSearch: string) => {
      const cleanPath = rawPathname.replace(/\/+$/, '') || '/';
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
        cleanPath.startsWith('/student')
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
      const session = await verifyCurrentSession();
      if (!mounted) return;

      if (!session.authenticated || !session.user) {
        setCurrentUser(null);
        setDataset(null);
        if (window.location.pathname !== '/login') {
          navigatePath('/login', true);
        }
        setAuthLoading(false);
        return;
      }

      setCurrentUser(session.user);
      synchronizeRouteWithRole(
        session.user,
        window.location.pathname,
        window.location.search
      );
      await loadAuthorizedData(session.user);
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
      if (!currentUser) {
        navigatePath('/login', true);
        return;
      }
      synchronizeRouteWithRole(
        currentUser,
        window.location.pathname,
        window.location.search
      );
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser, navigatePath, synchronizeRouteWithRole]);

  const handleLoginSuccess = async (user: AuthenticatedUserProfile) => {
    setAuthErrorBanner(null);
    setCurrentUser(user);
    synchronizeRouteWithRole(user, window.location.pathname, window.location.search);
    await loadAuthorizedData(user);
  };

  const handleLogout = async () => {
    await signOutCurrentSession();
    setCurrentUser(null);
    setDataset(null);
    setMobileMenuOpen(false);
    navigatePath('/login', true);
  };

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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
        <div className="flex items-center gap-2.5 text-xs font-medium text-ink-secondary">
          <Loader2 className="w-4 h-4 text-imperial animate-spin" />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        accessErrorMessage={authErrorBanner}
      />
    );
  }

  if (dataLoading || !dataset) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
        <div className="flex items-center gap-2.5 text-xs font-medium text-ink-secondary">
          <Loader2 className="w-4 h-4 text-imperial animate-spin" />
          <span>Loading authorized academic records...</span>
        </div>
      </div>
    );
  }

  const activeInterventionsCount = dataset.interventions.filter(
    (i) => i.status === 'PLANNED' || i.status === 'IN_PROGRESS'
  ).length;

  const facultyNavItems: {
    id: FacultyTab;
    label: string;
    Icon: React.FC<{ className?: string }>;
    badge?: string;
  }[] = [
    {
      id: 'OVERVIEW',
      label: 'Overview',
      Icon: LayoutDashboard,
    },
    {
      id: 'DIRECTORY',
      label: 'Students',
      Icon: Users,
      badge: `${evaluations.length}`,
    },
    {
      id: 'PROFILE',
      label: 'Student Profile',
      Icon: UserCheck,
    },
    {
      id: 'RECORDS',
      label: 'Records & CSV',
      Icon: FileSpreadsheet,
    },
    {
      id: 'INTERVENTIONS',
      label: 'Interventions',
      Icon: ClipboardCheck,
      badge: activeInterventionsCount > 0 ? `${activeInterventionsCount}` : undefined,
    },
  ];

  const renderSidebarContent = () => (
    <div className="flex flex-col justify-between h-full">
      <div className="space-y-5">
        {/* Brand Header */}
        <div className="px-5 pt-5 pb-4 border-b border-stone-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-imperial flex items-center justify-center text-ghost shrink-0 shadow-card">
              <BookOpenCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-imperial">
                Academic Insight
              </div>
              <div className="text-[11px] text-ink-muted">
                {currentUser.role === 'FACULTY' ? 'Faculty Workspace' : 'Student Portal'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1 text-ink-muted hover:text-ink-primary rounded"
            aria-label="Close navigation menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links (Role-Enforced) */}
        {currentUser.role === 'FACULTY' ? (
          <div className="px-3">
            <nav aria-label="Faculty Navigation" className="space-y-1">
              {facultyNavItems.map(({ id, label, Icon, badge }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelectNavTab(id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-imperial text-ghost font-semibold shadow-card'
                        : 'text-ink-secondary hover:text-imperial hover:bg-bluebell-light/70'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-bluebell-border' : 'text-ink-muted'
                        }`}
                      />
                      <span className="truncate">{label}</span>
                    </span>
                    {badge && (
                      <span
                        className={`ml-2 text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded ${
                          isActive
                            ? 'bg-white/15 text-ghost font-semibold'
                            : 'text-imperial bg-bluebell-light border border-bluebell-border/60'
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
              <div className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md bg-imperial text-ghost shadow-card">
                <GraduationCap className="w-4 h-4 shrink-0 text-bluebell-border" />
                <span>My Academic Standing</span>
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Sidebar Footer: Authenticated Account & Role-Gated Controls */}
      <div className="p-4 border-t border-stone-border space-y-3 bg-surface">
        {currentUser.role === 'FACULTY' && (
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-border">
            <button
              type="button"
              onClick={() => {
                setIsThresholdsModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-secondary hover:text-imperial transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-bluebell" />
              <span>Risk Rules</span>
            </button>

            <button
              type="button"
              onClick={handleResetDemoData}
              className="inline-flex items-center gap-1 text-xs font-medium text-ink-secondary hover:text-imperial transition-colors"
              title="Reset cohort records to initial baseline (Faculty only)"
            >
              <RotateCcw className="w-3 h-3 text-bluebell" />
              <span>Reset Demo</span>
            </button>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-ink-primary truncate">
                {currentUser.fullName}
              </div>
              <div className="text-[11px] text-ink-muted truncate">
                {currentUser.email}
              </div>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-bluebell-light border border-bluebell-border text-imperial shrink-0">
              {currentUser.role}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full btn-secondary py-1.5 text-xs justify-center"
          >
            <LogOut className="w-3.5 h-3.5 text-bluebell" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-canvas text-ink-primary">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:block w-56 shrink-0 bg-surface border-r border-stone-border sticky top-0 h-screen">
        {renderSidebarContent()}
      </aside>

      {/* Mobile & Tablet Top Header */}
      <header className="lg:hidden sticky top-0 z-30 bg-surface border-b border-stone-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 -ml-1 text-ink-secondary hover:text-imperial rounded-md border border-stone-border bg-canvas"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-imperial flex items-center justify-center text-ghost">
              <BookOpenCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-semibold text-imperial">
              Academic Insight
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-stone-border bg-canvas text-ink-secondary hover:text-imperial"
        >
          <LogOut className="w-3.5 h-3.5 text-bluebell" />
          <span>Sign out</span>
        </button>
      </header>

      {/* Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-carbon/35"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-60 max-w-[80vw] bg-surface h-full shadow-elevated z-10">
            {renderSidebarContent()}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-imperial text-ghost px-4 py-2.5 rounded-md shadow-elevated text-xs font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-bluebell" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
