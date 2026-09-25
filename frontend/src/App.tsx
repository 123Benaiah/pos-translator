import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import TranslatePage from './pages/TranslatePage';
import BatchPage from './pages/BatchPage';
import SearchPage from './pages/SearchPage';
import EntriesPage from './pages/EntriesPage';
import StatsPage from './pages/StatsPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<TranslatePage />} />
        <Route path="batch" element={<BatchPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="entries" element={<EntriesPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
