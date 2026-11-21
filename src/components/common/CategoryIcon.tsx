import {
  BookOpen,
  Briefcase,
  Code2,
  Dumbbell,
  FolderKanban,
  Globe,
  HeartPulse,
  Home,
  Layers,
  Music,
  ShoppingBag,
  Sparkles,
  Target,
  User,
  Wallet,
} from 'lucide-react';

const ICON_MAP = {
  Briefcase,
  User,
  HeartPulse,
  BookOpen,
  ShoppingBag,
  Wallet,
  Layers,
  FolderKanban,
  Target,
  Code2,
  Home,
  Dumbbell,
  Music,
  Globe,
  Sparkles,
} as const;

export const AVAILABLE_ICON_NAMES = Object.keys(ICON_MAP) as (keyof typeof ICON_MAP)[];

export function CategoryIcon({
  name,
  className = 'w-4 h-4',
}: {
  name: string;
  className?: string;
}) {
  const IconComp = ICON_MAP[name as keyof typeof ICON_MAP] ?? Layers;
  return <IconComp className={className} aria-hidden="true" />;
}
