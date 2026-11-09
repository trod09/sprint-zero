import {
  Box,
  FileText,
  FlaskConical,
  Inbox,
  Lightbulb,
  ListTodo,
  Map,
  MessageCircleQuestion,
  MessagesSquare,
  ScanSearch,
  TrendingDown,
  Zap,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  backlog: ListTodo,
  "metric-drop": TrendingDown,
  "product-case": Lightbulb,
  "ab-test": FlaskConical,
  "feedback-triage": Inbox,
  "prd-writer": FileText,
  "ux-critique": ScanSearch,
  "user-interview": MessageCircleQuestion,
  "stakeholder-arena": MessagesSquare,
  "roadmap-okrs": Map,
  "quick-cases": Zap,
};

/** Resolves a module's `icon` key. Unknown keys get a neutral default. */
export function ModuleIcon({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  const Icon = icons[icon] ?? Box;
  return <Icon className={className} aria-hidden="true" />;
}
