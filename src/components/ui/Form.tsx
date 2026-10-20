interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function Input({ label, hint, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-obsidian-100">{label}</label>}
      <input className={`input-base ${className}`} {...props} />
      {hint && <p className="text-xs text-obsidian-300">{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, hint, options, className = '', ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-obsidian-100">{label}</label>}
      <select className={`input-base ${className}`} {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-obsidian-700 text-obsidian-100">
            {opt.label}
          </option>
        ))}
      </select>
      {hint && <p className="text-xs text-obsidian-300">{hint}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export function Textarea({ label, hint, className = '', ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-obsidian-100">{label}</label>}
      <textarea className={`input-base resize-none ${className}`} {...props} />
      {hint && <p className="text-xs text-obsidian-300">{hint}</p>}
    </div>
  );
}

export function FormActions({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-3 justify-end pt-2">{children}</div>;
}
