import type { Language } from '../../types';
import { cn } from '../../lib/utils';

interface LanguagePickerProps {
  value: Language;
  onChange: (lang: Language) => void;
  label?: string;
}

const langColors: Record<Language, { ring: string; active: string }> = {
  en: { ring: 'ring-purple-500', active: 'bg-purple-600 text-white' },
  loz: { ring: 'ring-orange-500', active: 'bg-orange-500 text-white' },
  bem: { ring: 'ring-gold-500', active: 'bg-gold-500 text-white' },
};

const langLabels: Record<Language, string> = {
  en: 'English',
  loz: 'Lozi',
  bem: 'Bemba',
};

export default function LanguagePicker({ value, onChange, label }: LanguagePickerProps) {
  return (
    <div>
      {label && <p className="mb-1.5 text-sm font-medium text-slate-700">{label}</p>}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {(Object.keys(langColors) as Language[]).map((lang) => {
          const isActive = value === lang;
          return (
            <button
              key={lang}
              onClick={() => onChange(lang)}
              className={cn(
                'flex-1 sm:flex-none rounded-lg px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 border-2 whitespace-nowrap',
                isActive
                  ? cn(langColors[lang].active, 'border-transparent shadow-md')
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
                !isActive && `focus:ring-2 ${langColors[lang].ring} focus:ring-offset-1`,
              )}
            >
              {langLabels[lang]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
