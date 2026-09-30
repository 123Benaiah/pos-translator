import { useState } from 'react';
import { Layers, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LanguagePicker from '../ui/LanguagePicker';
import Card, { CardBody } from '../ui/Card';
import { useBatchTranslate } from '../../hooks/useBatchTranslate';
import type { Language, BatchItemResult } from '../../types';

export default function BatchTranslatePanel() {
  const [inputText, setInputText] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const [fromLang, setFromLang] = useState<Language>('en');
  const [toLang, setToLang] = useState<Language>('bem');
  const [results, setResults] = useState<BatchItemResult[] | null>(null);

  const batchMutation = useBatchTranslate();

  const addItem = () => {
    const word = inputText.trim();
    if (!word) return;
    if (items.includes(word.toLowerCase())) {
      toast.error('Word already in list');
      return;
    }
    setItems([...items, word.toLowerCase()]);
    setInputText('');
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleBatch = () => {
    if (items.length === 0) {
      toast.error('Add at least one word');
      return;
    }
    batchMutation.mutate(
      { items, from_lang: fromLang, to_lang: toLang },
      {
        onSuccess: (data) => {
          setResults(data.results);
          toast.success(`Translated ${data.found_count}/${data.total} words`);
        },
        onError: () => toast.error('Batch translation failed'),
      },
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <LanguagePicker value={fromLang} onChange={setFromLang} label="From" />
            <LanguagePicker value={toLang} onChange={setToLang} label="To" />
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Add a word..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addItem();
                }
              }}
            />
            <Button variant="secondary" onClick={addItem}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          {items.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {items.map((item, idx) => (
                <span
                  key={`${item}-${idx}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700"
                >
                  {item}
                  <button
                    onClick={() => removeItem(idx)}
                    className="rounded-full p-0.5 hover:bg-purple-200 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <Button
            variant="accent"
            size="lg"
            loading={batchMutation.isPending}
            onClick={handleBatch}
            disabled={items.length === 0}
            className="w-full"
          >
            <Layers className="h-5 w-5" />
            Translate {items.length} {items.length === 1 ? 'Word' : 'Words'}
          </Button>
        </div>
      </Card>

      {results && (
        <Card>
          <CardBody>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-purple-900">Results</h3>
              <span className="text-xs text-slate-500">
                {results.filter((r) => r.found).length}/{results.length} found
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {results.map((r, i) => (
                <div
                  key={`${r.input}-${i}`}
                  className={`flex items-center justify-between border-l-4 px-4 py-2.5 ${
                    r.found ? 'border-l-emerald-400 bg-emerald-50/30' : 'border-l-orange-400 bg-orange-50/30'
                  }`}
                >
                  <span className="text-sm font-medium text-slate-800">{r.input}</span>
                  <span className={`text-sm ${r.found ? 'font-semibold text-slate-900' : 'text-slate-400'}`}>
                    {r.output ?? 'Not found'}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
