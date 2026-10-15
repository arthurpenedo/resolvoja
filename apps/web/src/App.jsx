import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Analytics from './components/Analytics';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionAuthProvider } from './contexts/SubscriptionAuthContext.jsx';
import { Toaster } from './components/ui/toaster';
import HomePage from './pages/HomePage';
import AreaPage from './pages/AreaPage';
import PlansPage from './pages/PlansPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import ConsultoriaObrigadoPage from './pages/ConsultoriaObrigadoPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import TermosPage from './pages/TermosPage';
import PrivacidadePage from './pages/PrivacidadePage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
    return (
        <Router>
            <AuthProvider>
                <SubscriptionAuthProvider>
                    <ScrollToTop />
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/area/:areaId" element={<AreaPage />} />
                        <Route path="/plans" element={<PlansPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/cadastro" element={<SignupPage />} />
                        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
                        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
                        <Route path="/verificar-email" element={<VerifyEmailPage />} />
                        <Route path="/termos" element={<TermosPage />} />
                        <Route path="/privacidade" element={<PrivacidadePage />} />
                        <Route path="/subscriptions" element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />
                        <Route path="/consultoria/obrigado" element={<ProtectedRoute><ConsultoriaObrigadoPage /></ProtectedRoute>} />
                        <Route path="/painel" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                    <Analytics />
                    <Toaster />
                </SubscriptionAuthProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
