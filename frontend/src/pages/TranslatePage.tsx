import { useState } from 'react';
import Header from '../components/layout/Header';
import TranslatePanel from '../components/translate/TranslatePanel';
import TranslateAllPanel from '../components/translate/TranslateAllPanel';
import { cn } from '../lib/utils';

const tabs = [
  { key: 'single', label: 'Single Word' },
  { key: 'all', label: 'All Languages' },
] as const;

type Tab = (typeof tabs)[number]['key'];

export default function TranslatePage() {
  const [activeTab, setActiveTab] = useState<Tab>('single');

  return (
    <div>
      <Header
        title="Translate"
        subtitle="Translate words between English, Lozi, and Bemba"
      />

      <div className="mb-6 inline-flex rounded-lg bg-white p-1 border border-purple-100 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'rounded-md px-5 py-2 text-sm font-medium transition-all duration-200',
              activeTab === tab.key
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md'
                : 'text-purple-700 hover:bg-purple-50',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'single' ? <TranslatePanel /> : <TranslateAllPanel />}
    </div>
  );
}
