import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { Languages } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div>
      <Header title="Not Found" />
      <EmptyState
        icon={<Languages className="h-16 w-16" />}
        title="Page Not Found"
        description="The page you're looking for doesn't exist."
        action={
          <Link to="/">
            <Button variant="accent">Go to Translate</Button>
          </Link>
        }
      />
    </div>
  );
}
