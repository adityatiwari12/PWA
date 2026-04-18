import { AlertCircle, AlertTriangle, Info, Ban } from 'lucide-react';

export type Severity = 'contraindicated' | 'major' | 'minor' | 'none';

interface InteractionFlagProps {
  severity: Severity;
  drugName?: string;
  description: string;
}

const severityConfig = {
  contraindicated: {
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: Ban,
    label: 'Contraindicated',
    iconColor: 'text-red-600',
  },
  major: {
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: AlertTriangle,
    label: 'Major Interaction',
    iconColor: 'text-amber-600',
  },
  minor: {
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Info,
    label: 'Minor Interaction',
    iconColor: 'text-blue-600',
  },
  none: {
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    icon: AlertCircle,
    label: 'No Known Interaction',
    iconColor: 'text-gray-600',
  },
};

export default function InteractionFlag({ severity, drugName, description }: InteractionFlagProps) {
  const config = severityConfig[severity] || severityConfig.none;
  const Icon = config.icon;

  return (
    <div className={`flex flex-col p-4 rounded-xl border ${config.color} mb-3`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-full bg-white shadow-sm ${config.iconColor}`}>
          <Icon size={20} />
        </div>
        <div>
          <h4 className="font-bold text-sm leading-tight">{config.label}</h4>
          {drugName && <p className="text-xs opacity-75">with {drugName}</p>}
        </div>
      </div>
      <p className="text-sm leading-relaxed">{description}</p>
    </div>
  );
}
