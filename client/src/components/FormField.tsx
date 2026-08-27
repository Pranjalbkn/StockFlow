type FormFieldProps = {
  id: string;
  label: string;
  type?: "text" | "email" | "password";
  value: string;
  autoComplete: string;
  placeholder: string;
  onChange: (value: string) => void;
};

function FormField({ id, label, type = "text", value, autoComplete, placeholder, onChange }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/40 px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 hover:border-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-3 focus:ring-emerald-600/10"
      />
    </div>
  );
}

export default FormField;
