import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import ProfessionalCard from "../components/professionals/ProfessionalCard";
import ProfessionalDetailModal from "../components/professionals/ProfessionalDetailModal";
import NewProfessionalFormModal from "../components/professionals/NewProfessionalFormModal";
import ProfessionalSkeleton from "../components/ui/Skeleton/ProfessionalSkeleton";
import { useProfessionals } from "../hooks/useProfessionals";
import Button from "../components/ui/Button";
import type { Professional } from "../types/entities";

export default function ProfessionalsPage() {
  const currentDate = new Date();

  const [search, setSearch] = useState("");
  const [selectedProfessional, setSelectedProfessional] =
    useState<Professional | null>(null);
  const [showProfessionalModal, setShowProfessionalModal] = useState(false);
  const [showNewProfessionalModal, setShowNewProfessionalModal] = useState(false);

  const { data: professionalsData, isLoading: professionalsLoading } =
    useProfessionals();

  const professionals = professionalsData?.professionals ?? [];

  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const filteredProfessionals = useMemo(() => {
    if (!search.trim()) return professionals;
    return professionals.filter((p) =>
      normalize(p.name).includes(normalize(search))
    );
  }, [professionals, search]);

  const handleNewProfessional = () => {
    setShowNewProfessionalModal(true);
  };

  const handleOpenProfessional = (professional: Professional) => {
    setSelectedProfessional(professional);
    setShowProfessionalModal(true);
  };

  const handleCloseProfessionalModal = () => {
    setSelectedProfessional(null);
    setShowProfessionalModal(false);
  };

  const handleCloseNewProfessionalModal = () => {
    setShowNewProfessionalModal(false);
  };

  return (
    <>
      <div className="max-w-full mx-auto space-y-4">
        {/* Header igual a agenda */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Profesionales
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {format(currentDate, "EEEE d 'de' MMMM, yyyy", {
                locale: es,
              })}
            </p>
          </div>

          <button
            onClick={handleNewProfessional}
            className="hidden md:inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo profesional
          </button>
        </div>

        {/* Barra de acciones igual a agenda */}
        <div className="hidden md:flex flex-col xl:flex-row gap-3 items-start xl:items-center xl:justify-between">
          <div className="flex items-center gap-1.5">
            <div className="h-9 px-3 inline-flex items-center rounded-lg border border-slate-200 bg-white text-xs text-slate-500">
              {filteredProfessionals.length} profesional
              {filteredProfessionals.length !== 1 ? "es" : ""}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                placeholder="Buscar profesional..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 w-full sm:w-64 text-sm rounded-lg border border-slate-200 bg-white px-3 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <Button
              variant="primary"
              onClick={handleNewProfessional}
              className="md:hidden inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo profesional
            </Button>
          </div>
        </div>

        {/* Mobile actions */}
        <div className="flex md:hidden flex-col gap-2">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              placeholder="Buscar profesional..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 w-full text-sm rounded-lg border border-slate-200 bg-white px-3 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            onClick={handleNewProfessional}
            className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo profesional
          </button>
        </div>

        {/* Content */}
        {professionalsLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {[...Array(6)].map((_, i) => (
              <ProfessionalSkeleton key={i} />
            ))}
          </div>
        ) : professionals.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-sm text-slate-500">
            No hay profesionales cargados.
          </div>
        ) : filteredProfessionals.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-sm text-slate-500">
            No se encontraron profesionales para esa búsqueda.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {filteredProfessionals.map((professional) => (
              <ProfessionalCard
                key={professional.id}
                professional={professional}
                onClick={() => handleOpenProfessional(professional)}
              />
            ))}
          </div>
        )}
      </div>

      <ProfessionalDetailModal
        open={showProfessionalModal}
        onClose={handleCloseProfessionalModal}
        professional={selectedProfessional}
      />

      <NewProfessionalFormModal
        open={showNewProfessionalModal}
        onClose={handleCloseNewProfessionalModal}
      />
    </>
  );
}