import { SERVICE_ICONS } from "./serviceIcons";

type Props = {
  value: string;
  onChange: (name: string) => void;
};

export default function ServiceIconPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SERVICE_ICONS.map(({ id, Icon, label }) => {
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            title={label}
            onClick={() => onChange(id)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              selected
                ? "bg-teal-600 text-white ring-2 ring-teal-600 ring-offset-1"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}
