import { Suspense, useEffect, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CircularProgress, Box } from '@mui/material';

import ComingSoonPage from './pages/ComingSoonPage';
import ChildSafetyPage from './pages/ChildSafetyPage';

// ── Set to false to disable the Coming Soon banner and restore normal routes ──
const COMING_SOON = false;
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import CreateWardPage from './pages/CreateWardPage';
import UploadBoothPdfsPage from './pages/UploadBoothPdfsPage';
import VoterCountPage from './pages/VoterCountPage';
import ReportsListPage from './pages/admin/ReportsListPage';
import ReportDetailsPage from './pages/admin/ReportDetailsPage';
import AdminUsersListPage from './pages/admin/AdminUsersListPage';
import AdminUserDetailsPage from './pages/admin/AdminUserDetailsPage';
import AdminCreateUserPage from './pages/admin/AdminCreateUserPage';
import AdminEditUserPage from './pages/admin/AdminEditUserPage';
import AdminMeetingsPage from './pages/admin/AdminMeetingsPage';
import AdminCreateMeetingPage from './pages/admin/AdminCreateMeetingPage';
import AdminEditMeetingPage from './pages/admin/AdminEditMeetingPage';
import AdminVotingWindowPage from './pages/admin/AdminVotingWindowPage';
import AdminTelegramLinksPage from './pages/admin/AdminTelegramLinksPage';
import AdminElectionsPage from './pages/admin/AdminElectionsPage';
import AdminParliamentaryPage from './pages/admin/AdminParliamentaryPage';
import AdminAssemblyPage from './pages/admin/AdminAssemblyPage';
import AdminMunicipalityPage from './pages/admin/AdminMunicipalityPage';
import AdminGramaPanchayatPage from './pages/admin/AdminGramaPanchayatPage';
import AdminUploadSopPage from './pages/admin/AdminUploadSopPage';
import UserLoginPage from './pages/UserLoginPage';
import UserRegisterPage from './pages/UserRegisterPage';

import UserPledgePage from './pages/UserPledgePage';
import ProfileCompletionPage from './pages/ProfileCompletionPage';
import UserDashboardPage from './pages/UserDashboardPage';
import CivicIssuesPage from './pages/CivicIssuesPage';
import ReportIssuePage from './pages/ReportIssuePage';
import CivicIssueDetailPage from './pages/CivicIssueDetailPage';
import AspirantRegistrationPage from './pages/AspirantRegistrationPage';
import SopPage from './pages/SopPage';
import SignedSopPage from './pages/SignedSopPage';
import AspirantApprovalPage from './pages/AspirantApprovalPage';
import WardCandidateListPage from './pages/WardCandidateListPage';
import WardVotersPage from './pages/WardVotersPage';
import RegisteredAspirantsPage from './pages/RegisteredAspirantsPage';
import AspirantViewDetailsPage from './pages/AspirantViewDetailsPage';
import DemoAspirantViewPage from './pages/DemoAspirantViewPage';
import CandidateDetailsPage from './pages/CandidateDetailsPage';
import AspirantOtpVerificationPage from './pages/AspirantOtpVerificationPage';
import VotingPage from './pages/VotingPage';
import VotingResultPage from './pages/VotingResultPage';
import WardDiscussionPage from './pages/WardDiscussionPage';
import ErrorPage from './pages/ErrorPage';
import LoadingPage from './pages/LoadingPage';
import ContactUsPage from './pages/ContactUsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';
import CommunityGuidelinesPage from './pages/CommunityGuidelinesPage';
import HomePage from './pages/HomePage';
import OathPage from './pages/OathPage';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import AuthLayout from './layouts/AuthLayout';
import PublicLayout from './layouts/PublicLayout';
import useAuthStore from './store/useAuthStore';
import Preloader, { dismissPreloader } from './components/Preloader';
import OfflineBanner from './components/OfflineBanner';

// Aspirant mobile route pages
import AspirantProfilePage from './pages/aspirant/AspirantProfilePage';
import AspirantMeetingLinksPage from './pages/aspirant/AspirantMeetingLinksPage';
import AspirantChatPage from './pages/aspirant/AspirantChatPage';
import AspirantDiscussionPage from './pages/AspirantDiscussionPage';
import AspirantPostsPage from './pages/aspirant/AspirantPostsPage';
import AspirantRequestsPage from './pages/aspirant/AspirantRequestsPage';

// Guest route pages
import GuestLayout from './layouts/GuestLayout';
import GuestDashboardPage from './pages/guest/GuestDashboardPage';
import GuestVotersPage from './pages/guest/GuestVotersPage';
import GuestAspirantsPage from './pages/guest/GuestAspirantsPage';
import GuestRegisteredAspirantsPage from './pages/guest/GuestRegisteredAspirantsPage';
import GuestCivicIssuesPage from './pages/guest/GuestCivicIssuesPage';
import GuestSopPage from './pages/guest/GuestSopPage';

const UserChatPage = lazy(() => import('./pages/UserChatPage'));

const RedirectIfAuth = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated, isAdmin } = useAuthStore();
  if (isAuthenticated) {
    if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/user/voters" replace />;
  }
  return children;
};

const App = () => {
  const { t } = useTranslation();
  const { isAdmin, isAuthenticated, token, fetchProfile } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // On page reload / first mount, if we have a persisted token, fetch fresh user data
    if (token) {
      void fetchProfile();
    }
  }, [token, fetchProfile]);

  useEffect(() => {
    // Dismiss the preloader after the animation completes (~5 s)
    // Only if on the root path where the preloader is shown.
    if (location.pathname === '/' || location.pathname === '/index.html' || location.pathname === '/loading') {
      const t = setTimeout(dismissPreloader, 5000);
      return () => clearTimeout(t);
    } else {
      // If direct link to another page, dismiss immediately
      dismissPreloader();
    }
  }, [location.pathname]);

  if (COMING_SOON) {
    return (
      <Routes>
        <Route path="/privacy-policy-disclaimer" element={<PrivacyPolicyPage />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
        <Route path="/community-guidelines" element={<CommunityGuidelinesPage />} />
        <Route path="/child-safety" element={<ChildSafetyPage />} />
        <Route path="*" element={<ComingSoonPage />} />
      </Routes>
    );
  }

  return (
    <>
      {(location.pathname === '/' || location.pathname === '/index.html' || location.pathname === '/loading') && <Preloader />}
      <OfflineBanner />
      <Suspense
        fallback={
          <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
            <CircularProgress />
          </Box>
        }
      >
          <Routes>
            <Route path="/" element={<RedirectIfAuth><HomePage /></RedirectIfAuth>} />
            <Route path="/oath" element={<RedirectIfAuth><OathPage /></RedirectIfAuth>} />
            <Route element={<AuthLayout title={t('adminLogin.title')} />}>
              <Route path="/admin/login" element={<RedirectIfAuth><AdminLoginPage /></RedirectIfAuth>} />
            </Route>
            <Route element={<AuthLayout title={t('userLogin.title')} />}>
              <Route path="/login" element={<RedirectIfAuth><UserLoginPage /></RedirectIfAuth>} />
            </Route>
            <Route element={<AuthLayout title={t('userRegister.title')} />}>
              <Route path="/signup" element={<RedirectIfAuth><UserPledgePage /></RedirectIfAuth>} />
              <Route path="/register" element={<RedirectIfAuth><UserRegisterPage /></RedirectIfAuth>} />
            </Route>

            {/* Public routes accessible from landing page */}
            <Route element={<PublicLayout />}>
              {/* <Route path="/aspirantslist" element={<WardCandidateListPage />} /> */}
              <Route path="/contact-us" element={<ContactUsPage />} />
              <Route path="/elections" element={<VotingResultPage />} />
              <Route path="/aspirants" element={<AspirantApprovalPage />} />
            </Route>

            {/* Signed SOP should use the same header as UserLayout */}
            <Route element={<UserLayout />}>
              <Route path="/aspirants/:id/signed-sop" element={<SignedSopPage />} />
            </Route>

            {/* Candidate details should use the UserLayout header (same as dashboard) */}
            <Route element={<UserLayout />}>
              <Route path="/aspirants/:id" element={<CandidateDetailsPage />} />
            </Route>

            {/* Admin routes - auth required but API calls bypassed */}
            <Route
              path="/admin"
              element={isAuthenticated && isAdmin ? <AdminLayout /> : <Navigate to="/admin/login" />}
            >
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="wards/create" element={<CreateWardPage />} />
              <Route path="upload-pdfs" element={<UploadBoothPdfsPage />} />
              <Route path="voter-count" element={<VoterCountPage />} />
              <Route path="aspirants/approval" element={<AspirantApprovalPage />} />
              <Route path="voting-results" element={<VotingResultPage />} />
              <Route path="reports" element={<ReportsListPage />} />
              <Route path="reports/:id" element={<ReportDetailsPage />} />
              <Route path="users" element={<AdminUsersListPage />} />
              <Route path="users/create" element={<AdminCreateUserPage />} />
              <Route path="users/:id/edit" element={<AdminEditUserPage />} />
              <Route path="meetings" element={<AdminMeetingsPage />} />
              <Route path="meetings/create" element={<AdminCreateMeetingPage />} />
              <Route path="meetings/:id/edit" element={<AdminEditMeetingPage />} />
              <Route path="voting-window" element={<AdminVotingWindowPage />} />
              <Route path="telegram-links" element={<AdminTelegramLinksPage />} />
              <Route path="elections" element={<AdminElectionsPage />} />
              <Route path="parliamentary" element={<AdminParliamentaryPage />} />
              <Route path="assembly" element={<AdminAssemblyPage />} />
              <Route path="municipalities" element={<AdminMunicipalityPage />} />
              <Route path="grama-panchayat" element={<AdminGramaPanchayatPage />} />
              <Route path="upload-sop" element={<AdminUploadSopPage />} />
              <Route path="/admin/users/:id" element={<AdminUserDetailsPage />} />
            </Route>

            {/* User routes - auth required but API calls bypassed */}
            <Route
              path="/user"
                element={isAuthenticated ? <UserLayout /> : <Navigate to="/register" />}
            >
              <Route path="dashboard" element={<UserDashboardPage />} />
              <Route path="complete-profile" element={<ProfileCompletionPage />} />
              <Route path="civic-issues" element={<CivicIssuesPage />} />
              <Route path="civic-issues/report" element={<ReportIssuePage />} />
              <Route path="civic-issues/:id" element={<CivicIssueDetailPage />} />
              <Route path="dashboard/profile" element={<AspirantProfilePage />} />
              <Route path="dashboard/meetings" element={<AspirantMeetingLinksPage />} />
              <Route path="dashboard/chat" element={<AspirantChatPage />} />
              <Route path="dashboard/aspirant-discussion" element={<AspirantDiscussionPage />} />
              <Route path="dashboard/posts" element={<AspirantPostsPage />} />
              <Route path="dashboard/requests" element={<AspirantRequestsPage />} />
              <Route path="aspirants/register" element={<AspirantRegistrationPage />} />
              <Route path="aspirants/verify-otp" element={<AspirantOtpVerificationPage />} />
              <Route path="aspirantslist" element={<WardCandidateListPage />} />
              <Route path="voters" element={<WardVotersPage />} />
              <Route path="registered-aspirants" element={<RegisteredAspirantsPage />} />
              <Route path="aspirants/:id/view" element={<AspirantViewDetailsPage />} />
              <Route path="aspirants/demo/view" element={<DemoAspirantViewPage />} />
              <Route path="wards" element={<WardVotersPage />} />
              <Route path="wards/:wardNumber/voters" element={<WardVotersPage />} />
              <Route path="chat/:aspirantId" element={<UserChatPage />} />
              <Route path="vote" element={<VotingPage />} />
              <Route path="discussions" element={<WardDiscussionPage />} />
              <Route path="sop" element={<SopPage />} />
            </Route>

            {/* Guest routes — no auth required */}
            {/* test comment */}
            <Route path="/guest" element={<GuestLayout />}>
              <Route path="dashboard" element={<GuestDashboardPage />} />
              <Route path="voters" element={<GuestVotersPage />} />
              <Route path="aspirants" element={<GuestAspirantsPage />} />
              <Route path="civic-issues" element={<GuestCivicIssuesPage />} />
              <Route path="sop" element={<GuestSopPage />} />
              <Route path="registered-aspirants" element={<GuestRegisteredAspirantsPage />} />
              <Route path="aspirants/:id/view" element={<AspirantViewDetailsPage />} />
              <Route path="aspirants/demo/view" element={<DemoAspirantViewPage />} />
            </Route>

            <Route path="/loading" element={<LoadingPage />} />
            <Route path="/privacy-policy-disclaimer" element={<PrivacyPolicyPage />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
            <Route path="/child-safety" element={<ChildSafetyPage />} />
            <Route path="/community-guidelines" element={<CommunityGuidelinesPage />} />
            <Route path="*" element={<ErrorPage />} />
          </Routes>
      </Suspense>
    </>
  );
};

export default App;
