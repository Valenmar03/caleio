export type Client = {
  id: string;
  businessId: string;
  fullName: string;
  phone: string;
  email: string | null;
  notes: string | null;
  createdAt: string;
};

export type Service = {
  id: string;
  businessId: string;
  name: string;
  durationMin: number;
  basePrice: string;
  active: boolean;
  createdAt: string;
};

export type AvailabilitySlot = {
  startAt: string;
  endAt: string;
  label: string;
};

export type AvailabilityResponse = {
  date: string;
  professionalId: string;
  serviceId: string;
  stepMin: number;
  slots: AvailabilitySlot[];
};

export type ProfessionalService = {
  professionalId: string;
  serviceId: string;
  businessId: string;
  createdAt: string;
  service: {
    id: string;
    businessId: string;
    name: string;
    durationMin: number;
    basePrice: string;
    active: boolean;
    createdAt: string;
  };
};

export type ProfessionalServicesResponse = {
  services: ProfessionalService[];
};