import { Link } from 'react-router-dom';
import { FileText, Menu, X, LogIn } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-blue-600 rounded-lg group-hover:bg-blue-700 transition-colors">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              CareerCraft
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/templates" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
              Templates
            </Link>
            <Link to="/about-developer" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
              About
            </Link>
            <div className="h-6 w-px bg-gray-200"></div>
            <Link to="/login" className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
            <Link 
              to="/register" 
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95"
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-600">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 animate-in slide-in-from-top duration-300">
          <div className="px-4 pt-2 pb-6 space-y-2">
            <Link to="/templates" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Templates</Link>
            <Link to="/about-developer" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg">About</Link>
            <Link to="/login" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Sign In</Link>
            <Link to="/register" className="block w-full text-center px-3 py-3 bg-blue-600 text-white font-semibold rounded-lg">Get Started Free</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
