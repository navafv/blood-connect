import { Link } from "react-router-dom";
import {
  Search,
  Shield,
  Clock,
  HeartHandshake,
  ArrowRight,
  Activity,
  Building2,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { AdBanner } from "../../components/ads/AdBanner";

/**
 * Public Landing Page
 * Serves as the primary entry point for unauthenticated traffic.
 * Optimized for fast First Contentful Paint (FCP) using mostly static markup
 * and CSS-driven micro-interactions.
 */
export default function Home() {
  // Value Proposition Configuration
  const features = [
    {
      icon: Clock,
      title: "Real-Time Availability",
      description:
        "Our system automatically calculates donor eligibility, ensuring you only see people who can safely donate today.",
    },
    {
      icon: Shield,
      title: "Privacy Protected",
      description:
        "Donor contact details are protected and only revealed when necessary, keeping personal information secure.",
    },
    {
      icon: Activity,
      title: "Hyper-Local Search",
      description:
        "Filter by state, district, and pincode to find eligible donors in your immediate vicinity in seconds.",
    },
    {
      icon: Building2,
      title: "Trusted Organizations",
      description:
        "Data is maintained directly by verified hospitals, blood banks, and NGOs on our secure multi-tenant platform.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 overflow-hidden">
      {/* --- Hero Composition --- */}
      <section className="relative px-4 pt-20 pb-32 md:pt-32 md:pb-40 lg:pt-40 lg:pb-48">
        {/* Ambient Gradient Mesh */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-100 bg-rose-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse duration-3000"
          aria-hidden="true"
        />

        <div className="container mx-auto max-w-5xl text-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium mb-8 shadow-[0_0_15px_rgba(225,29,72,0.1)]">
            <HeartHandshake className="h-4 w-4" />
            <span>Connecting Donors with Those in Need</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight">
            Find a Blood Donor. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-rose-400 to-rose-600">
              Save a Life Today.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            A centralized, real-time registry maintained by trusted hospitals
            and NGOs. Find eligible blood donors in your area instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/search" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full text-base gap-2 px-8 py-6 rounded-full shadow-[0_0_30px_rgba(225,29,72,0.2)] hover:shadow-[0_0_40px_rgba(225,29,72,0.4)] transition-all duration-300"
              >
                <Search className="h-5 w-5" />
                Find Donors Now
              </Button>
            </Link>
            <Link to="/register-org" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full text-base gap-2 px-8 py-6 rounded-full bg-slate-900/50 backdrop-blur-md border-slate-700 hover:bg-slate-800 hover:text-white transition-all duration-300"
              >
                Register Your Organization
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* --- Process Diagram Section --- */}
      <section className="py-24 bg-slate-900/40 border-y border-slate-800/50 relative">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Three simple steps to connect with a lifesaver in your time of
              need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Visual connector line for large viewports */}
            <div
              className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-linear-to-r from-slate-800 via-rose-500/20 to-slate-800 -translate-y-1/2 z-0"
              aria-hidden="true"
            />

            {[
              {
                num: 1,
                title: "Search Locality",
                desc: "Enter your district and required blood group into our public directory.",
              },
              {
                num: 2,
                title: "Find Eligible Matches",
                desc: "Review a filtered list of donors who are verified and medically eligible to donate today.",
              },
              {
                num: 3,
                title: "Contact Directly",
                desc: "Reveal the donor's contact information and reach out immediately to arrange the donation.",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="group relative z-10 flex flex-col items-center text-center p-8 bg-slate-950 rounded-3xl border border-slate-800/80 shadow-xl hover:border-rose-500/30 hover:shadow-[0_0_30px_rgba(225,29,72,0.05)] hover:-translate-y-2 transition-all duration-500"
              >
                <div className="w-20 h-20 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800 group-hover:border-rose-500/40 text-rose-500 text-3xl font-black mb-8 shadow-inner group-hover:shadow-[inset_0_0_20px_rgba(225,29,72,0.2)] transition-all duration-500">
                  {step.num}
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-wide">
                  {step.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Ad Boundary --- */}
      <section className="py-16 border-b border-slate-800/50 bg-slate-950">
        <div className="container mx-auto max-w-5xl px-4">
          <AdBanner />
        </div>
      </section>

      {/* --- Value Proposition Grid --- */}
      <section className="py-24 bg-linear-to-b from-slate-950 to-slate-900/20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-16 md:flex md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold text-white mb-4">
                Why Use BloodConnect?
              </h2>
              <p className="text-slate-400 text-lg">
                Our platform is designed to be the fastest, most reliable bridge
                between willing donors and patients in critical need.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="group bg-slate-900/40 border-slate-800/60 hover:border-slate-700 hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm"
                >
                  <CardContent className="p-8">
                    <div className="h-14 w-14 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-6 group-hover:bg-rose-500/10 group-hover:border-rose-500/20 transition-all duration-300">
                      <Icon className="h-7 w-7 text-slate-400 group-hover:text-rose-400 transition-colors duration-300" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- Conversion Footer --- */}
      <section className="py-32 relative overflow-hidden border-t border-slate-800/50">
        <div className="absolute inset-0 bg-linear-to-b from-transparent to-rose-950/20" />
        <div className="container mx-auto max-w-4xl px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
            Ready to find a donor?
          </h2>
          <p className="text-slate-400 mb-10 max-w-2xl mx-auto text-lg">
            Our directory is entirely free to use for the public. Search the
            database right now without creating an account.
          </p>
          <Link to="/search">
            <Button
              variant="primary"
              size="lg"
              className="px-10 py-7 rounded-full text-lg font-semibold gap-3 shadow-xl hover:shadow-[0_0_40px_rgba(225,29,72,0.3)] hover:-translate-y-1 transition-all duration-300"
            >
              <Search className="h-6 w-6" />
              Search the Directory
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
