// AppRoutes.tsx
import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import AppLayout from "@/layout/AppLayout";
import { AuthGuard } from "@damap/components/auth/AuthGuard";

interface AppRoutesProps {
    toggleMode: () => void;
}

export default function AppRoutes({ toggleMode }: AppRoutesProps) {
    return (
        <Routes>
            <Route element={<AppLayout toggleMode={toggleMode} />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<AuthGuard><DashboardPage /></AuthGuard>} />
                <Route path="/" element={<Navigate to="/login" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}