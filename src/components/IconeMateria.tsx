import {
  Baby,
  Bone,
  BookOpen,
  FlaskConical,
  HeartPulse,
  Microscope,
  Pill,
  Scissors,
  Stethoscope,
  UsersRound,
  Venus,
  type LucideIcon,
} from 'lucide-react'

// Nome usado no campo "icone" do JSON da matéria -> ícone desenhado
const icones: Record<string, LucideIcon> = {
  osso: Bone,
  coracao: HeartPulse,
  frasco: FlaskConical,
  pilula: Pill,
  microscopio: Microscope,
  estetoscopio: Stethoscope,
  bisturi: Scissors,
  bebe: Baby,
  gestante: Venus,
  comunidade: UsersRound,
}

export function IconeMateria({ nome, className = '' }: { nome: string; className?: string }) {
  const Icone = icones[nome] ?? BookOpen
  return <Icone className={className} strokeWidth={2.4} aria-hidden />
}
