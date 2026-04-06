import {
  Scissors, Sparkles, Droplets, Heart, Star, Zap, Sun, Flame, Leaf, Wind,
  Hand, Smile, Eye, Gem, Feather, Music, Coffee, Activity, Dumbbell, Palette,
  Waves, Timer, Baby, Paintbrush,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const SERVICE_ICONS: { id: string; Icon: LucideIcon; label: string }[] = [
  { id: "Scissors",   Icon: Scissors,   label: "Tijeras" },
  { id: "Sparkles",   Icon: Sparkles,   label: "Brillo" },
  { id: "Droplets",   Icon: Droplets,   label: "Gotas" },
  { id: "Heart",      Icon: Heart,      label: "Corazón" },
  { id: "Star",       Icon: Star,       label: "Estrella" },
  { id: "Zap",        Icon: Zap,        label: "Rayo" },
  { id: "Sun",        Icon: Sun,        label: "Sol" },
  { id: "Flame",      Icon: Flame,      label: "Llama" },
  { id: "Leaf",       Icon: Leaf,       label: "Hoja" },
  { id: "Wind",       Icon: Wind,       label: "Viento" },
  { id: "Hand",       Icon: Hand,       label: "Mano" },
  { id: "Smile",      Icon: Smile,      label: "Sonrisa" },
  { id: "Eye",        Icon: Eye,        label: "Ojo" },
  { id: "Gem",        Icon: Gem,        label: "Joya" },
  { id: "Feather",    Icon: Feather,    label: "Pluma" },
  { id: "Music",      Icon: Music,      label: "Música" },
  { id: "Coffee",     Icon: Coffee,     label: "Café" },
  { id: "Activity",   Icon: Activity,   label: "Actividad" },
  { id: "Dumbbell",   Icon: Dumbbell,   label: "Pesa" },
  { id: "Palette",    Icon: Palette,    label: "Paleta" },
  { id: "Waves",      Icon: Waves,      label: "Ondas" },
  { id: "Timer",      Icon: Timer,      label: "Temporizador" },
  { id: "Baby",       Icon: Baby,       label: "Bebé" },
  { id: "Paintbrush", Icon: Paintbrush, label: "Pincel" },
];

export const SERVICE_ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  SERVICE_ICONS.map(({ id, Icon }) => [id, Icon])
);

export function getServiceIcon(name: string | null | undefined): LucideIcon {
  return SERVICE_ICON_MAP[name ?? ""] ?? Scissors;
}
