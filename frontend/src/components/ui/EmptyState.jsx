"use client";

export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-xl bg-surface flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-foreground-muted" />
        </div>
      )}
      <h3 className="text-foreground font-medium text-[15px] mb-1.5">{title}</h3>
      {description && (
        <p className="text-foreground-muted text-sm max-w-sm leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
