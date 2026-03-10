import { createBrowserRouter } from "react-router-dom";
import { Layout } from "../components/layout/Layout.tsx";
import DashboardPage from "../pages/DashboardPage.tsx";
import AgendaPage from "../pages/AgendaPage.tsx";
import ProfessionalsPage from "../pages/ProfessionalsPage.tsx";
import ServicesPage from "../pages/ServicesPage.tsx";
import ClientsPage from "../pages/ClientsPage.tsx";

function AnalyticsPage() {
  return <div>Análisis</div>;
}

function BusinessSettingsPage() {
  return <div>Administración</div>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "agenda", element: <AgendaPage /> },
      { path: "professionals", element: <ProfessionalsPage /> },
      { path: "services", element: <ServicesPage /> },
      { path: "clients", element: <ClientsPage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "business-settings", element: <BusinessSettingsPage /> },
    ],
  },
]);