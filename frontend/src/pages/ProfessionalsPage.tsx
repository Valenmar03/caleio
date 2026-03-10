import { useProfessionals } from "../hooks/useProfessionals";

export default function ProfessionalsPage() {
 const { data, isLoading } = useProfessionals();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>

      <h2 className="text-2xl font-semibold mb-6">
        Agenda
      </h2>

      <div className="bg-white p-4 rounded shadow">

        <h3 className="font-semibold mb-4">
          Professionals
        </h3>

        <ul className="space-y-2">
          {data?.professionals.map((p: any) => (
            <li key={p.id} className="p-2 border rounded">
              {p.name}
            </li>
          ))}
        </ul>

      </div>

    </div>
  );
}
