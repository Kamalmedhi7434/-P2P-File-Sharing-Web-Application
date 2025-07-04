import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Download, Wifi, Key, Shield, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true }}
    className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
  >
    <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </motion.div>
);

const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/90 to-primary/70 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Share Files Seamlessly
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-white/90">
              Fast, secure, and easy file sharing with automatic WiFi detection and PIN-based remote connections.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/share">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto">
                  <Upload className="mr-2 h-5 w-5" />
                  Share Files
                </Button>
              </Link>
              <Link to="/receive">
                <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 w-full sm:w-auto">
                  <Download className="mr-2 h-5 w-5" />
                  Receive Files
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full h-auto">
            <path
              fill="#ffffff"
              fillOpacity="1"
              d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
            ></path>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              ShareWave makes file sharing simple, secure, and fast with these powerful features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Wifi}
              title="Automatic WiFi Detection"
              description="Instantly discover nearby devices on the same WiFi network for quick local file transfers."
            />
            <FeatureCard
              icon={Key}
              title="PIN-Based Remote Sharing"
              description="Share files with anyone, anywhere using a secure 6-digit PIN code connection."
            />
            <FeatureCard
              icon={Shield}
              title="End-to-End Encryption"
              description="Your files are encrypted during transfer for maximum security and privacy."
            />
            <FeatureCard
              icon={Zap}
              title="Lightning Fast Transfers"
              description="Direct peer-to-peer connections ensure the fastest possible file transfer speeds."
            />
            <FeatureCard
              icon={Upload}
              title="Multiple File Support"
              description="Share multiple files and folders of any size with no limitations."
            />
            <FeatureCard
              icon={Download}
              title="Integrity Verification"
              description="Automatic file integrity checks ensure your files arrive uncorrupted."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-12 md:p-12 text-center md:text-left md:flex md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Ready to start sharing?
                </h2>
                <p className="text-white/90 md:text-lg mb-6 md:mb-0">
                  No account needed. No file size limits. Just fast, secure sharing.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/share">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto">
                    <Upload className="mr-2 h-5 w-5" />
                    Share Files
                  </Button>
                </Link>
                <Link to="/receive">
                  <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 w-full sm:w-auto">
                    <Download className="mr-2 h-5 w-5" />
                    Receive Files
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

