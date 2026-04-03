export const appRoutes = {
  dashboard: "/",
  agenda: "/agenda",
  professionals: "/professionals",
  services: "/services",
  clients: "/clients",
  analytics: "/analytics",
  businessSettings: "/business-settings",
  businessProfile: "/profile",
} as const;

export const routeTitles: Record<string, string> = {
  [appRoutes.dashboard]: "Dashboard",
  [appRoutes.agenda]: "Agenda",
  [appRoutes.professionals]: "Profesionales",
  [appRoutes.services]: "Servicios",
  [appRoutes.clients]: "Clientes",
  [appRoutes.analytics]: "Análisis",
  [appRoutes.businessSettings]: "Administración",
  [appRoutes.businessProfile]: "Perfil del negocio",
};