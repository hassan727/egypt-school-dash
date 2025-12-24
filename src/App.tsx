import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";

// Students
import StudentsList from "./pages/students/StudentsList";
import NewStudent from "./pages/students/NewStudent";
import CreateStudentPage from "./pages/students/CreateStudentPage";
// Student History Pages
import StudentHistory from "./pages/students/StudentHistory";
import PersonalDataHistory from "./pages/students/PersonalDataHistory";
import EnrollmentHistory from "./pages/students/EnrollmentHistory";
import GuardianHistory from "./pages/students/GuardianHistory";
import MotherHistory from "./pages/students/MotherHistory";
import EmergencyHistory from "./pages/students/EmergencyHistory";
import AcademicHistory from "./pages/students/AcademicHistory";
import BehavioralHistory from "./pages/students/BehavioralHistory";
import FinancialHistory from "./pages/students/FinancialHistory";

// New Page Structure - Dashboard and Specialized Pages
import StudentDashboard from "./pages/students/StudentDashboard";
import BasicDataPage from "./pages/students/BasicDataPage";
import FinancialManagementPage from "./pages/students/FinancialManagementPage";
import RefundRequestPage from "./pages/students/RefundRequestPage";
import RefundProcessingPage from "./pages/students/RefundProcessingPage";
import AcademicManagementPage from "./pages/students/AcademicManagementPage";
import AttendanceManagementPage from "./pages/students/AttendanceManagementPage";
import LogPage from "./pages/students/LogPage";
import StudentNotificationsPage from "./pages/students/StudentNotificationsPage";
import CompleteProfilePage from "./pages/students/CompleteProfilePage";
import ApplicationFormPrint from "./pages/students/ApplicationFormPrint";

// Advanced Features Pages
import BatchOperationsPage from "./pages/students/BatchOperationsPage";
import BatchOperationsLayout from "./components/batch/BatchOperationsLayout";
import BatchAcademicPage from "./pages/students/batch/BatchAcademicPage";
import BatchAttendancePage from "./pages/students/batch/BatchAttendancePage";
import BatchNotificationsPage from "./pages/students/batch/BatchNotificationsPage";
import BatchProfilesPage from "./pages/students/batch/BatchProfilesPage";
import BatchArchivePage from "./pages/students/batch/BatchArchivePage";
import DataPortabilityPage from "./pages/students/DataPortabilityPage";
import AdvancedSearchPage from "./pages/students/AdvancedSearchPage";
import SystemDashboard from "./pages/students/SystemDashboard";
import ReportsPage from "./pages/students/ReportsPage";

// Students - Old components that might still be needed
import StudentFinancial from "./pages/students/StudentFinancial";
import StudentAcademic from "./pages/students/StudentAcademic";
import StudentBehavioral from "./pages/students/StudentBehavioral";
import StudentAdministrative from "./pages/students/StudentAdministrative";
import StudentsAttendance from "./pages/students/StudentsAttendance";
import Certificates from "./pages/students/Certificates";

// Behavioral System - New Components
import BehavioralDashboard from "./pages/students/BehavioralDashboard";
import BehavioralReportPage from "./pages/students/BehavioralReportPage";

// Teachers
import TeachersList from "./pages/teachers/TeachersList";
import NewTeacher from "./pages/teachers/NewTeacher";
import TeachersAttendance from "./pages/teachers/TeachersAttendance";
import TeachersEvaluation from "./pages/teachers/TeachersEvaluation";

// Teacher Profile System
import TeacherProfileDashboard from "./pages/teachers/TeacherProfileDashboard";
import TeacherBasicDataPage from "./pages/teachers/TeacherBasicDataPage";
import TeacherFinancialPage from "./pages/teachers/TeacherFinancialPage";
import TeacherProfessionalPage from "./pages/teachers/TeacherProfessionalPage";
import TeacherEvaluationsPage from "./pages/teachers/TeacherEvaluationsPage";
import TeacherAttendancePage from "./pages/teachers/TeacherAttendancePage";
import TeacherNotificationsPage from "./pages/teachers/TeacherNotificationsPage";
import TeacherLogPage from "./pages/teachers/TeacherLogPage";


// Finance
import Revenue from "./pages/finance/Revenue";
import Expenses from "./pages/finance/Expenses";
import Salaries from "./pages/finance/Salaries";
import Receivables from "./pages/finance/Receivables";
import Profits from "./pages/finance/Profits";
import BaseSalaries from "./pages/finance/BaseSalaries";
import Bonuses from "./pages/finance/Bonuses";
import Deductions from "./pages/finance/Deductions";
import NetPayroll from "./pages/finance/NetPayroll";
import FinanceDashboard from "./pages/finance/FinanceDashboard";

// Classes
import ClassesList from "./pages/classes/ClassesList";

// Test Pages
import AcademicTestPage from "./test/academic-test/AcademicTestPage";

// Academic Search Page
import AcademicSearchPage from "./pages/students/AcademicSearchPage";

// Settings
import StagesClasses from "./pages/settings/StagesClasses";
import SchoolsManagementPage from "./pages/settings/SchoolsManagementPage";
import UsersManagementPage from "./pages/settings/UsersManagementPage";

// Student Settings & Auth
import StudentAccountsPage from "./pages/students/settings/StudentAccountsPage";
import StudentDataManagementPage from "./pages/students/settings/StudentDataManagementPage";
import StudentImportPage from "./pages/students/settings/StudentImportPage";
import StudentLoginPage from "./pages/auth/StudentLoginPage";
import StudentPortalDashboard from "./pages/student/StudentPortalDashboard";
import AdminLoginPage from "./pages/auth/AdminLoginPage";

// Auth Context & Components
import { AuthProvider } from "@/context/AuthContext";
import { DemoModeBanner } from "@/components/auth/DemoModeBanner";

// HR - Human Resources System
import HREmployeesList from "./pages/hr/employees/HREmployeesList";
import HREmployeeProfile from "./pages/hr/employees/HREmployeeProfile";
import EmployeeDocumentsPage from "./pages/hr/employees/EmployeeDocumentsPage";
import EmployeeFinancialPage from "./pages/hr/employees/EmployeeFinancialPage";
import EmployeeJobPage from "./pages/hr/employees/EmployeeJobPage";
import EmployeeHistoryPage from "./pages/hr/employees/EmployeeHistoryPage";
import HRTerminatedEmployees from "./pages/hr/employees/HRTerminatedEmployees";
import HRDailyAttendance from "./pages/hr/attendance/HRDailyAttendance";
import HRShifts from "./pages/hr/attendance/HRShifts";
import HRAttendanceReports from "./pages/hr/attendance/HRAttendanceReports";
import MobileCheckIn from "./pages/hr/attendance/MobileCheckIn";
import HRQRCodeManagement from "./pages/hr/attendance/HRQRCodeManagement";
import AttendanceSettings from "./pages/hr/attendance/AttendanceSettings";
import HRCalendarPage from "./pages/hr/HRCalendarPage";
import HRLeaves from "./pages/hr/leaves/HRLeaves";
import HRLeaveApprovals from "./pages/hr/leaves/HRLeaveApprovals";
import HRSchedules from "./pages/hr/schedules/HRSchedules";
import HRSubstitution from "./pages/hr/schedules/HRSubstitution";
import HRPayroll from "./pages/hr/payroll/HRPayroll";
import HRPayrollExport from "./pages/hr/payroll/HRPayrollExport";
import HRContracts from "./pages/hr/contracts/HRContracts";
import HRPerformance from "./pages/hr/performance/HRPerformance";
import HRTraining from "./pages/hr/training/HRTraining";
import HRViolations from "./pages/hr/violations/HRViolations";
import HROffboarding from "./pages/hr/offboarding/HROffboarding";
import HRReports from "./pages/hr/reports/HRReports";
import HRSettings from "./pages/hr/settings/HRSettings";

// HR Page Refactor: New Employee Registration
import HRNewEmployee from "./pages/hr/employees/HRNewEmployee";

// Admin Monitoring & Intelligence
import ErrorMonitoringDashboard from "./pages/admin/ErrorMonitoringDashboard";

const queryClient = new QueryClient();

const StudentRedirect = () => {
  const { studentId } = useParams();
  return <Navigate to={`/student/${studentId}/dashboard`} replace />;
};

import { GlobalFilterProvider } from "@/context/GlobalFilterContext";

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <GlobalFilterProvider>
            <DemoModeBanner />
            <BrowserRouter future={{ v7_relativeSplatPath: true }}>
              <Routes>
                <Route path="/" element={<Index />} />

                {/* Students Routes - Updated to align with correction document */}
                <Route path="/students" element={<SystemDashboard />} />
                <Route path="/students/list" element={<StudentsList />} />
                {/* DISABLED: /students/new - Replaced by multi-page system (BasicDataPage, FinancialManagementPage, etc.) */}
                {/* <Route path="/students/new" element={<NewStudent />} /> */}
                <Route path="/students/create" element={<CreateStudentPage />} />
                {/* Advanced Features Routes - Moved up to prevent conflict with :studentId */}
                <Route path="/students/batch" element={<BatchOperationsLayout />}>
                  <Route path="operations" element={<BatchOperationsPage />} />
                  <Route path="academic" element={<BatchAcademicPage />} />
                  <Route path="attendance" element={<BatchAttendancePage />} />
                  <Route path="notifications" element={<BatchNotificationsPage />} />
                  <Route path="profiles" element={<BatchProfilesPage />} />
                  <Route path="archive" element={<BatchArchivePage />} />
                </Route>
                <Route path="/students/data-portability" element={<DataPortabilityPage />} />
                <Route path="/students/advanced-search" element={<AdvancedSearchPage />} />
                <Route path="/students/system-dashboard" element={<SystemDashboard />} />
                <Route path="/students/reports" element={<ReportsPage />} />

                <Route path="/students/attendance" element={<StudentsAttendance />} />
                <Route path="/students/certificates" element={<Certificates />} />

                {/* Redirect legacy /students/:id to new /student/:id/dashboard */}
                <Route path="/students/:studentId" element={<StudentRedirect />} />

                {/* New Dashboard and Specialized Pages */}
                <Route path="/student/:studentId/dashboard" element={<StudentDashboard />} />
                <Route path="/students/:studentId/complete-profile" element={<CompleteProfilePage />} />
                <Route path="/print/application-form/:studentId" element={<ApplicationFormPrint />} />
                <Route path="/student/:studentId/basic-data" element={<BasicDataPage />} />
                <Route path="/student/:studentId/financial-management" element={<FinancialManagementPage />} />
                <Route path="/student/:studentId/refund-request" element={<RefundRequestPage />} />
                <Route path="/student/:studentId/refund-processing" element={<RefundProcessingPage />} />
                <Route path="/student/:studentId/academic-management" element={<AcademicManagementPage />} />
                <Route path="/student/:studentId/attendance-management" element={<AttendanceManagementPage />} />
                <Route path="/student/:studentId/behavioral-dashboard" element={<BehavioralDashboard />} />
                <Route path="/student/:studentId/behavioral-report/:reportType" element={<BehavioralReportPage />} />
                <Route path="/student/:studentId/behavioral-report/:reportType/:reportId" element={<BehavioralReportPage />} />
                <Route path="/student/:studentId/log" element={<LogPage />} />
                <Route path="/student/:studentId/notifications" element={<StudentNotificationsPage />} />

                {/* Student History Routes */}
                <Route path="/students/:studentId/history" element={<StudentHistory />} />
                <Route path="/students/:studentId/history/personal-data" element={<PersonalDataHistory />} />
                <Route path="/students/:studentId/history/enrollment-data" element={<EnrollmentHistory />} />
                <Route path="/students/:studentId/history/guardian-data" element={<GuardianHistory />} />
                <Route path="/students/:studentId/history/mother-data" element={<MotherHistory />} />
                <Route path="/students/:studentId/history/emergency-contacts" element={<EmergencyHistory />} />
                <Route path="/students/:studentId/history/academic-records" element={<AcademicHistory />} />
                <Route path="/students/:studentId/history/behavioral-records" element={<BehavioralHistory />} />
                <Route path="/students/:studentId/history/financial-records" element={<FinancialHistory />} />

                {/* Teachers Routes */}
                <Route path="/teachers" element={<TeachersList />} />
                <Route path="/teachers/new" element={<NewTeacher />} />
                <Route path="/teachers/attendance" element={<TeachersAttendance />} />
                <Route path="/teachers/evaluation" element={<TeachersEvaluation />} />

                {/* Teacher Profile Routes */}
                <Route path="/teacher/:teacherId/dashboard" element={<TeacherProfileDashboard />} />
                <Route path="/teacher/:teacherId/basic-data" element={<TeacherBasicDataPage />} />
                <Route path="/teacher/:teacherId/financial" element={<TeacherFinancialPage />} />
                <Route path="/teacher/:teacherId/professional" element={<TeacherProfessionalPage />} />
                <Route path="/teacher/:teacherId/evaluations" element={<TeacherEvaluationsPage />} />
                <Route path="/teacher/:teacherId/attendance" element={<TeacherAttendancePage />} />
                <Route path="/teacher/:teacherId/notifications" element={<TeacherNotificationsPage />} />
                <Route path="/teacher/:teacherId/log" element={<TeacherLogPage />} />


                {/* Finance Routes */}
                <Route path="/finance" element={<FinanceDashboard />} />
                <Route path="/finance/dashboard" element={<FinanceDashboard />} />
                <Route path="/finance/revenue" element={<Revenue />} />
                <Route path="/finance/expenses" element={<Expenses />} />
                <Route path="/finance/salaries" element={<Salaries />} />
                <Route path="/finance/receivables" element={<Receivables />} />
                <Route path="/finance/profits" element={<Profits />} />
                <Route path="/finance/base-salaries" element={<BaseSalaries />} />
                <Route path="/finance/bonuses" element={<Bonuses />} />
                <Route path="/finance/deductions" element={<Deductions />} />
                <Route path="/finance/net-payroll" element={<NetPayroll />} />

                {/* Classes Routes */}
                <Route path="/classes" element={<ClassesList />} />

                {/* Academic Search Route */}
                <Route path="/academic/search" element={<AcademicSearchPage />} />

                {/* Test Routes */}
                <Route path="/test/academic-hierarchy" element={<AcademicTestPage />} />

                {/* HR - Human Resources Routes */}
                <Route path="/hr/employees" element={<HREmployeesList />} />
                <Route path="/hr/employees/new" element={<HRNewEmployee />} />
                <Route path="/hr/employees/terminated" element={<HRTerminatedEmployees />} />
                <Route path="/hr/employees/:employeeId" element={<HREmployeeProfile />} />
                <Route path="/hr/employees/:employeeId/documents" element={<EmployeeDocumentsPage />} />
                <Route path="/hr/employees/:employeeId/financial" element={<EmployeeFinancialPage />} />
                <Route path="/hr/employees/:employeeId/job" element={<EmployeeJobPage />} />
                <Route path="/hr/employees/:employeeId/history" element={<EmployeeHistoryPage />} />
                <Route path="/hr/attendance" element={<HRDailyAttendance />} />
                <Route path="/hr/attendance/shifts" element={<HRShifts />} />
                <Route path="/hr/attendance/reports" element={<HRAttendanceReports />} />
                <Route path="/hr/attendance/mobile" element={<MobileCheckIn />} />
                <Route path="/hr/attendance/qr" element={<HRQRCodeManagement />} />
                <Route path="/hr/attendance/settings" element={<AttendanceSettings />} />
                <Route path="/hr/calendar" element={<HRCalendarPage />} />
                <Route path="/hr/leaves" element={<HRLeaves />} />
                <Route path="/hr/leaves/approvals" element={<HRLeaveApprovals />} />
                <Route path="/hr/schedules" element={<HRSchedules />} />
                <Route path="/hr/schedules/substitution" element={<HRSubstitution />} />
                <Route path="/hr/payroll" element={<HRPayroll />} />
                <Route path="/hr/payroll/export" element={<HRPayrollExport />} />
                <Route path="/hr/contracts" element={<HRContracts />} />
                <Route path="/hr/performance" element={<HRPerformance />} />
                <Route path="/hr/training" element={<HRTraining />} />
                <Route path="/hr/violations" element={<HRViolations />} />
                <Route path="/hr/offboarding" element={<HROffboarding />} />
                <Route path="/hr/reports" element={<HRReports />} />
                <Route path="/hr/settings" element={<HRSettings />} />

                {/* Student Settings Routes */}
                <Route path="/students/settings/data" element={<StudentDataManagementPage />} />
                <Route path="/students/settings/accounts" element={<StudentAccountsPage />} />
                <Route path="/students/settings/import" element={<StudentImportPage />} />

                {/* Student Portal Routes (Public) */}
                <Route path="/student/login" element={<StudentLoginPage />} />
                <Route path="/student/dashboard" element={<StudentPortalDashboard />} />

                {/* Admin Login */}
                <Route path="/login" element={<AdminLoginPage />} />

                {/* Settings Routes */}
                <Route path="/settings/stages-classes" element={<StagesClasses />} />
                <Route path="/settings/schools" element={<SchoolsManagementPage />} />
                <Route path="/settings/users" element={<UsersManagementPage />} />

                {/* Admin Monitoring & Intelligence Routes */}
                <Route path="/admin/error-monitoring" element={<ErrorMonitoringDashboard />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </GlobalFilterProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;