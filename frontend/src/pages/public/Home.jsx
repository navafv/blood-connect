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

export default function Home() {
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
      {/* Hero Section */}
      <section className="relative px-4 pt-20 pb-32 md:pt-32 md:pb-40 lg:pt-40 lg:pb-48">
        {/* Ambient Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-100 bg-rose-600/20 rounded-[100%] blur-[120px] pointer-events-none" />

        <div className="container mx-auto max-w-5xl text-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium mb-6">
            <HeartHandshake className="h-4 w-4" />
            <span>Connecting Donors with Those in Need</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-8">
            Find a Blood Donor. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-rose-400 to-rose-600">
              Save a Life Today.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            A centralized, real-time registry maintained by trusted hospitals
            and NGOs. Find eligible blood donors in your area instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/search">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto text-base gap-2 px-8 py-6 rounded-full hover:shadow-[0_0_30px_rgba(225,29,72,0.3)]"
              >
                <Search className="h-5 w-5" />
                Find Donors Now
              </Button>
            </Link>
            <Link to="/register-org">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-base gap-2 px-8 py-6 rounded-full bg-slate-900/50 backdrop-blur-sm"
              >
                Register Your Organization
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-900/50 border-y border-slate-800">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Three simple steps to connect with a lifesaver in your time of
              need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-px bg-slate-800 -translate-y-1/2 z-0" />

            <div className="relative z-10 flex flex-col items-center text-center p-6 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-rose-500/30 text-rose-500 text-2xl font-bold mb-6 shadow-[0_0_15px_rgba(225,29,72,0.2)]">
                1
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Search Locality
              </h3>
              <p className="text-slate-400 text-sm">
                Enter your district, pincode, and required blood group into our
                public directory.
              </p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center p-6 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-rose-500/30 text-rose-500 text-2xl font-bold mb-6 shadow-[0_0_15px_rgba(225,29,72,0.2)]">
                2
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Find Eligible Matches
              </h3>
              <p className="text-slate-400 text-sm">
                Review a filtered list of donors who are verified and medically
                eligible to donate today.
              </p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center p-6 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-rose-500/30 text-rose-500 text-2xl font-bold mb-6 shadow-[0_0_15px_rgba(225,29,72,0.2)]">
                3
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Contact Directly
              </h3>
              <p className="text-slate-400 text-sm">
                Reveal the donor's contact information and reach out immediately
                to arrange the donation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-16 md:flex md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold text-white mb-4">
                Why Use BloodConnect?
              </h2>
              <p className="text-slate-400">
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
                  className="bg-slate-900/40 border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-lg bg-rose-500/10 flex items-center justify-center mb-6">
                      <Icon className="h-6 w-6 text-rose-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
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

      {/* Bottom CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-rose-600/5" />
        <div className="container mx-auto max-w-4xl px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to find a donor?
          </h2>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            Our directory is entirely free to use for the public. Search the
            database right now without creating an account.
          </p>
          <Link to="/search">
            <Button
              variant="primary"
              size="lg"
              className="px-8 py-6 rounded-full text-base gap-2"
            >
              <Search className="h-5 w-5" />
              Search the Directory
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
