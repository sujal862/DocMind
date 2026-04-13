"use client";

import { CheckCircle, AlertCircle, Loader2, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';

const STATUS_CONFIG = {
  saving: {
    label: 'Saving...',
    icon: Loader2,
    className: 'text-accent',
    spin: true,
  },
  queued: {
    label: 'Queued',
    icon: Clock,
    className: 'text-warning',
    spin: false,
  },
  processing: {
    label: 'Processing...',
    icon: Loader2,
    className: 'text-accent',
    spin: true,
  },
  completed: {
    label: 'Indexed',
    icon: CheckCircle,
    className: 'text-success',
    spin: false,
  },
  failed: {
    label: 'Failed',
    icon: AlertCircle,
    className: 'text-danger',
    spin: false,
  },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.processing;
  const Icon = config.icon;

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', config.className)}>
      <Icon className={cn('w-3.5 h-3.5', config.spin && 'animate-spin')} />
      {config.label}
    </span>
  );
}
