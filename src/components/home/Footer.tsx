import { Link } from 'react-router-dom';
import { ArrowUp, Code2, FileText, Mail, MessageCircle, Network } from 'lucide-react';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-blue-100 bg-white pt-12 pb-8 sm:pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 grid grid-cols-1 gap-8 sm:mb-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="mb-5 flex items-center gap-2">
              <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-2 shadow-lg shadow-blue-600/20">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-950">CareerCraft</span>
            </Link>
            <p className="mb-7 text-sm font-medium leading-relaxed text-gray-500">
              Professional CV builder for students and freshers. Create your dream career with recruiter-tested templates.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="rounded-xl border border-blue-100 bg-blue-50 p-2 text-blue-600 transition-all hover:-translate-y-0.5 hover:bg-blue-600 hover:text-white"><Code2 className="w-5 h-5" /></a>
              <a href="#" className="rounded-xl border border-blue-100 bg-blue-50 p-2 text-blue-600 transition-all hover:-translate-y-0.5 hover:bg-blue-600 hover:text-white"><MessageCircle className="w-5 h-5" /></a>
              <a href="#" className="rounded-xl border border-blue-100 bg-blue-50 p-2 text-blue-600 transition-all hover:-translate-y-0.5 hover:bg-blue-600 hover:text-white"><Network className="w-5 h-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="mb-5 font-bold text-gray-950">Quick Links</h4>
            <ul className="space-y-3">
              <li><Link to="/" className="text-sm font-semibold text-gray-500 transition-colors hover:text-blue-700">Home</Link></li>
              <li><Link to="/templates" className="text-sm font-semibold text-gray-500 transition-colors hover:text-blue-700">Templates</Link></li>
              <li><a href="#how-it-works" className="text-sm font-semibold text-gray-500 transition-colors hover:text-blue-700">How It Works</a></li>
              <li><a href="#about-developer" className="text-sm font-semibold text-gray-500 transition-colors hover:text-blue-700">About Developer</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 font-bold text-gray-950">Support</h4>
            <ul className="space-y-3">
              <li><Link to="/login" className="text-sm font-semibold text-gray-500 transition-colors hover:text-blue-700">Login</Link></li>
              <li><Link to="/register" className="text-sm font-semibold text-gray-500 transition-colors hover:text-blue-700">Register</Link></li>
              <li><a href="mailto:support@example.com" className="text-sm font-semibold text-gray-500 transition-colors hover:text-blue-700">Contact Us</a></li>
              <li><span className="text-sm font-semibold text-gray-500">Privacy Policy</span></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 font-bold text-gray-950">Get in Touch</h4>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm shadow-blue-900/5 sm:rounded-3xl sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Email Us</p>
                  <p className="text-sm font-bold text-gray-950">hello@careercraft.com</p>
                </div>
              </div>
              <p className="text-xs font-medium leading-relaxed text-gray-500">
                Got questions? We are here to help you 24/7.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-5 border-t border-blue-100 pt-8 md:flex-row">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            © 2026 Simple CV Builder. All rights reserved.
          </p>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 transition-all hover:-translate-y-0.5 hover:bg-blue-600 hover:text-white"
          >
            Back to Top <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
