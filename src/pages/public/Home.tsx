import Header from '../../components/home/Header';
import HeroSection from '../../components/home/HeroSection';
import TemplateGrid from '../../components/home/TemplateGrid';
import HowItWorks from '../../components/home/HowItWorks';
import Benefits from '../../components/home/Benefits';
import PricingSection from '../../components/home/PricingSection';
import AboutDeveloper from '../../components/home/AboutDeveloper';
import FinalCTA from '../../components/home/FinalCTA';
import Footer from '../../components/home/Footer';

const Home = () => {
  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      <Header />
      <main>
        <HeroSection />
        <TemplateGrid />
        <HowItWorks />
        <Benefits />
        <PricingSection />
        <AboutDeveloper />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
