import { useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LanguagePicker from '../ui/LanguagePicker';
import { useTranslateAll } from '../../hooks/useTranslateAll';
import { useSuggest } from '../../hooks/useSuggest';
import TranslationCard from './TranslationCard';
import type { Language } from '../../types';

export default function TranslateAllPanel() {
  const [text, setText] = useState('');
  const [fromLang, setFromLang] = useState<Language>('en');
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading, refetch } = useTranslateAll({
    text,
    fromLang,
    enabled: false,
  });

  const { data: suggestions } = useSuggest({
    q: text,
    lang: fromLang,
    enabled: text.length >= 1,
  });

  const handleTranslate = () => {
    if (!text.trim()) {
      toast.error('Please enter a word to translate');
      return;
    }
    setSubmitted(true);
    void refetch();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTranslate();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-purple-100 bg-white p-6 shadow-md">
        <div className="space-y-5">
          <LanguagePicker value={fromLang} onChange={setFromLang} label="Translate from" />

          <div className="relative">
            <Input
              placeholder="Type a word to see all translations..."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setSubmitted(false);
              }}
              onKeyDown={handleKeyDown}
              className="pr-10 text-base"
            />
            {suggestions && suggestions.suggestions.length > 0 && !submitted && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-purple-100 bg-white shadow-lg">
                {suggestions.suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setText(s);
                      setSubmitted(true);
                      setTimeout(() => {
                        void refetch();
                      }, 0);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-purple-50 transition-colors"
                  >
                    <Search className="h-3.5 w-3.5 text-purple-400" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="accent"
            size="lg"
            loading={isLoading}
            onClick={handleTranslate}
            className="w-full"
          >
            <ArrowRight className="h-5 w-5" />
            Translate to All Languages
          </Button>
        </div>
      </div>

      {submitted && data && <TranslationCard data={data} />}
    </div>
  );
}
