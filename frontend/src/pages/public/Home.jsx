import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
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
import { Badge } from '../../components/ui/Badge'

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
      title: "100% Proxy Routing",
      description:
        "Donor phone numbers are never exposed. All communication is securely routed through the verified medical organization.",
    },
    {
      icon: Activity,
      title: "Hyper-Local Search",
      description:
        "Filter by country, state, and district to find eligible donors in your immediate vicinity in seconds.",
    },
    {
      icon: Building2,
      title: "Trusted Organizations",
      description:
        "Data is maintained directly by verified hospitals, blood banks, and NGOs on our secure multi-tenant platform.",
    },
  ];

  return (
    <>
      {/* SEO Configuration */}
      <Helmet>
        <title>Bloodonate | Find Blood Donors Instantly & Save Lives</title>
        <meta
          name="description"
          content="A centralized, real-time registry to find eligible blood donors in your area instantly. Maintained by trusted hospitals and NGOs. No account required to search."
        />
        <meta
          name="keywords"
          content="blood donation, find blood donor, blood registry, local blood donors, emergency blood search, donate blood, verified blood donors"
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Bloodonate | Find Blood Donors Instantly"
        />
        <meta
          property="og:description"
          content="Find eligible blood donors in your area instantly. Maintained by trusted hospitals and NGOs."
        />
        <meta property="og:url" content="https://www.bloodonate.org/" />
        <meta
          property="og:image"
          content="https://www.bloodonate.org/og-image.jpg"
        />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Bloodonate | Find Blood Donors Instantly"
        />
        <meta
          name="twitter:description"
          content="Find eligible blood donors in your area instantly. Maintained by trusted hospitals and NGOs."
        />
        <meta
          name="twitter:image"
          content="https://www.bloodonate.org/twitter-image.jpg"
        />

        {/* Canonical Link */}
        <link rel="canonical" href="https://www.bloodonate.org/" />
      </Helmet>

      <div className="flex flex-col min-h-screen bg-slate-50 transition-colors duration-300 dark:bg-slate-950 overflow-hidden">
        {/* --- Hero Composition (Split Layout with Portrait Ad) --- */}
        <section className="relative px-4 pt-24 pb-20 md:pt-32 md:pb-24 lg:pt-32 lg:pb-32 overflow-hidden border-b border-transparent dark:border-slate-800/50">
          <div
            className="absolute top-0 left-1/4 w-[800px] h-[500px] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-3000 transition-colors dark:bg-rose-600/15"
            aria-hidden="true"
          />

          <div className="container mx-auto max-w-7xl relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              {/* Left Column: Copy & Actions */}
              <div className="text-center lg:text-left animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium mb-8 shadow-sm transition-colors duration-300 bg-white border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400 dark:shadow-[0_0_15px_rgba(225,29,72,0.1)]">
                  <HeartHandshake className="h-4 w-4" />
                  <span>Connecting Donors with Those in Need</span>
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-tight transition-colors duration-300 text-slate-900 dark:text-white">
                  Find a Blood Donor. <br className="hidden lg:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r transition-colors duration-300 from-rose-500 to-rose-700 dark:from-rose-400 dark:to-rose-600">
                    Save a Life Today.
                  </span>
                </h1>

                <p className="text-lg md:text-xl max-w-2xl mx-auto lg:mx-0 mb-12 leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
                  A centralized, real-time registry maintained by trusted
                  hospitals, blood banks, clinics, and NGOs. Find eligible blood
                  donors in your area instantly.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link to="/search" className="w-full sm:w-auto">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full text-base gap-2 px-8 py-6 rounded-full shadow-md hover:shadow-lg transition-all duration-300 dark:shadow-rose-glow dark:hover:shadow-rose-glow-lg"
                    >
                      <Search className="h-5 w-5" aria-hidden="true" />
                      Find Donors Now
                    </Button>
                  </Link>
                  <Link to="/register-org" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full text-base gap-2 px-8 py-6 rounded-full backdrop-blur-md transition-all duration-300 bg-white/50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-900/50 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
                    >
                      Register Your Organization
                      <ArrowRight className="h-5 w-5" aria-hidden="true" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Column: Visual Bento Box & Portrait Ad */}
              <div className="relative flex justify-center lg:justify-end items-center gap-4 sm:gap-6 animate-in fade-in slide-in-from-right-8 duration-1000 delay-200 mt-8 lg:mt-0">
                {/* Visual Column 1: Client Images */}
                <div className="flex flex-col gap-4 sm:gap-6 w-1/2 max-w-[280px]">
                  <img
                    src="/Donor_holding_a_blood_drop.jpg"
                    alt="Donor holding a blood drop"
                    className="rounded-3xl object-cover h-48 sm:h-64 w-full shadow-2xl border-4 border-white/60 dark:border-slate-800/60 transition-transform duration-500 hover:scale-[1.02]"
                  />
                  <img
                    src="/Blood_Donation_Process.jpg"
                    alt="Blood Donation Process"
                    className="rounded-3xl object-cover h-56 sm:h-[320px] w-full shadow-2xl border-4 border-white/60 dark:border-slate-800/60 transition-transform duration-500 hover:scale-[1.02]"
                  />
                </div>

                {/* Visual Column 2: Sponsor Portrait Ad */}
                <div className="flex flex-col gap-4 sm:gap-6 w-1/2 max-w-[280px] pt-24 sm:pt-45">
                  <div className="rounded-3xl shadow-2xl overflow-hidden border-4 border-white/60 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-900 relative h-[220px] sm:h-[420px] transition-transform duration-500 hover:-translate-y-2">
                    <AdBanner
                      format="portrait"
                      className="!h-full !w-full !rounded-none !border-0 !shadow-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- Process Diagram Section (With Illustration) --- */}
        <section className="py-24 border-b relative transition-colors duration-300 bg-slate-100/50 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/50">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 transition-colors duration-300 text-slate-900 dark:text-white">
                How It Works
              </h2>
              <p className="max-w-2xl mx-auto text-lg transition-colors duration-300 text-slate-600 dark:text-slate-400">
                Three simple steps to connect with a lifesaver in your time of
                need.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Text Steps */}
              <div className="space-y-6 relative z-10">
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
                    title: "Contact Organization",
                    desc: "Connect instantly with the verified hospital, blood bank, or NGO managing the donor to arrange the donation.",
                  },
                ].map((step) => (
                  <div
                    key={step.num}
                    className="group relative flex items-start gap-6 p-6 sm:p-8 rounded-3xl border shadow-sm hover:-translate-y-1 transition-all duration-500 bg-white border-slate-200 hover:border-rose-300 hover:shadow-xl dark:bg-slate-950 dark:border-slate-800/80 dark:hover:border-rose-500/30 dark:hover:shadow-[0_0_30px_rgba(225,29,72,0.05)]"
                  >
                    <div className="w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center border text-2xl font-black shadow-inner transition-all duration-500 bg-slate-50 border-slate-200 text-rose-600 group-hover:border-rose-300 group-hover:bg-rose-50 dark:bg-slate-900 dark:border-slate-800 dark:text-rose-500 dark:group-hover:border-rose-500/40 dark:group-hover:shadow-[inset_0_0_20px_rgba(225,29,72,0.2)]">
                      {step.num}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2 tracking-wide transition-colors duration-300 text-slate-900 dark:text-white">
                        {step.title}
                      </h3>
                      <p className="leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Visual Graphic */}
              <div className="relative flex justify-center items-center">
                <div
                  className="absolute inset-0 bg-blue-500/10 blur-[80px] rounded-full dark:bg-blue-500/20"
                  aria-hidden="true"
                />
                <img
                  src="/Blood_Donation_Infographic.png"
                  alt="Blood Donation Infographic"
                  className="relative z-10 w-full max-w-lg h-auto object-contain drop-shadow-2xl rounded-3xl transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>
          </div>
        </section>

        {/* --- Value Proposition Grid (With Integrated Image) --- */}
        <section className="py-24 bg-gradient-to-b transition-colors duration-300 from-slate-50 to-slate-100/50 dark:from-slate-950 dark:to-slate-900/20">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mb-16 text-center md:text-left md:flex md:items-end md:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 transition-colors duration-300 text-slate-900 dark:text-white">
                  Why Use Bloodonate?
                </h2>
                <p className="text-lg transition-colors duration-300 text-slate-600 dark:text-slate-400">
                  Our platform is designed to be the fastest, most reliable
                  bridge between willing donors and patients in critical need.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Featured Image Card */}
              <div className="lg:col-span-5 relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 min-h-[300px] sm:min-h-[400px] group">
                <img
                  src="/Importance_of_Blood_Donation.jpg"
                  alt="Importance of blood donation"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex items-end p-8">
                  <div>
                    <Badge className="bg-rose-500 text-white border-0 mb-3 uppercase tracking-widest text-[10px]">
                      Impact
                    </Badge>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                      Every Drop Counts
                    </h3>
                    <p className="text-slate-300 mt-2 text-sm font-medium">
                      Join thousands of verified donors saving lives across the
                      country.
                    </p>
                  </div>
                </div>
              </div>

              {/* Features Grid */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <Card
                      key={index}
                      className="group hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm bg-white/60 border-slate-200 hover:border-slate-300 dark:bg-slate-900/40 dark:border-slate-800/60 dark:hover:border-slate-700 shadow-sm hover:shadow-lg"
                    >
                      <CardContent className="p-8">
                        <div className="h-14 w-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 border bg-slate-50 border-slate-200 group-hover:bg-rose-50 group-hover:border-rose-200 dark:bg-slate-950 dark:border-slate-800 dark:group-hover:bg-rose-500/10 dark:group-hover:border-rose-500/20">
                          <Icon
                            className="h-7 w-7 transition-colors duration-300 text-slate-500 group-hover:text-rose-600 dark:text-slate-400 dark:group-hover:text-rose-400"
                            aria-hidden="true"
                          />
                        </div>
                        <h3 className="text-lg font-bold mb-3 transition-colors duration-300 text-slate-900 dark:text-white">
                          {feature.title}
                        </h3>
                        <p className="text-sm leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* --- Pre-Footer Landscape Ad Boundary --- */}
        <section className="py-16 transition-colors duration-300 bg-transparent">
          <div className="container mx-auto max-w-5xl px-4">
            <AdBanner format="banner" />
          </div>
        </section>

        {/* --- Conversion Footer --- */}
        <section className="py-32 relative overflow-hidden border-t transition-colors duration-300 border-slate-200 dark:border-slate-800/50">
          <div className="absolute inset-0 bg-gradient-to-b transition-colors duration-300 from-transparent to-rose-50 dark:to-rose-950/20" />
          <div className="container mx-auto max-w-4xl px-4 relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
              Ready to find a donor?
            </h2>
            <p className="mb-10 max-w-2xl mx-auto text-lg transition-colors duration-300 text-slate-600 dark:text-slate-400">
              Our directory is entirely free to use for the public. Search the
              database right now without creating an account.
            </p>
            <Link to="/search">
              <Button
                variant="primary"
                size="lg"
                className="px-10 py-7 rounded-full text-lg font-semibold gap-3 hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-lg dark:shadow-rose-glow dark:hover:shadow-rose-glow-lg"
              >
                <Search className="h-6 w-6" aria-hidden="true" />
                Search the Directory
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
