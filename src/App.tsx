import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";

// Test component for environment variables
import EnvTest from "./EnvTest";

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
import AcademicManagementPage from "./pages/students/AcademicManagementPage";
import AttendanceManagementPage from "./pages/students/AttendanceManagementPage";
import BehavioralAdministrativeManagementPage from "./pages/students/BehavioralAdministrativeManagementPage";
import LogPage from "./pages/students/LogPage";

// Advanced Features Pages
import BatchOperationsPage from "./pages/students/BatchOperationsPage";
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

// Teachers
import TeachersList from "./pages/teachers/TeachersList";
import NewTeacher from "./pages/teachers/NewTeacher";
import TeachersAttendance from "./pages/teachers/TeachersAttendance";
import TeachersEvaluation from "./pages/teachers/TeachersEvaluation";

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

// Classes
import ClassesList from "./pages/classes/ClassesList";

// Test Pages
import AcademicTestPage from "./test/academic-test/AcademicTestPage";

// Academic Search Page
import AcademicSearchPage from "./pages/students/AcademicSearchPage";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/env-test" element={<EnvTest />} />

            {/* Students Routes - Updated to align with correction document */}
            <Route path="/students" element={<SystemDashboard />} />
            <Route path="/students/list" element={<StudentsList />} />
            {/* DISABLED: /students/new - Replaced by multi-page system (BasicDataPage, FinancialManagementPage, etc.) */}
            {/* <Route path="/students/new" element={<NewStudent />} /> */}
            <Route path="/students/create" element={<CreateStudentPage />} />
            <Route path="/students/:studentId" element={<StudentDashboard />} />
            <Route path="/students/attendance" element={<StudentsAttendance />} />
            <Route path="/students/certificates" element={<Certificates />} />

            {/* New Dashboard and Specialized Pages */}
            <Route path="/student/:studentId/dashboard" element={<StudentDashboard />} />
            <Route path="/student/:studentId/basic-data" element={<BasicDataPage />} />
            <Route path="/student/:studentId/financial-management" element={<FinancialManagementPage />} />
            <Route path="/student/:studentId/academic-management" element={<AcademicManagementPage />} />
            <Route path="/student/:studentId/attendance-management" element={<AttendanceManagementPage />} />
            <Route path="/student/:studentId/behavioral-management" element={<BehavioralAdministrativeManagementPage />} />
            <Route path="/student/:studentId/log" element={<LogPage />} />

            {/* Advanced Features Routes */}
            <Route path="/students/batch-operations" element={<BatchOperationsPage />} />
            <Route path="/students/data-portability" element={<DataPortabilityPage />} />
            <Route path="/students/advanced-search" element={<AdvancedSearchPage />} />
            <Route path="/students/system-dashboard" element={<SystemDashboard />} />
            <Route path="/students/reports" element={<ReportsPage />} />

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

            {/* Finance Routes */}
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

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;