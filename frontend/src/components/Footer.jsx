import { Github, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} ShareWave. All rights reserved.
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <a
              href="#"
              className="text-gray-400 hover:text-gray-500 transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <div className="flex items-center text-sm text-gray-500">
              <span>Made with</span>
              <Heart className="h-4 w-4 mx-1 text-red-500" />
              <span>by ShareWave Team</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

