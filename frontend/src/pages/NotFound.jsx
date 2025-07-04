import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { FileQuestion } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <FileQuestion className="h-24 w-24 text-gray-300 mb-6" />
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-lg text-gray-600 mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/">
        <Button size="lg">
          Return to Home
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;

