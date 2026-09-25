import Header from '../components/layout/Header';
import BatchTranslatePanel from '../components/translate/BatchTranslatePanel';

export default function BatchPage() {
  return (
    <div>
      <Header
        title="Batch page Translate"
        subtitle="Translate multiple words at once"
      />
      <BatchTranslatePanel />
    </div>
  );
}
