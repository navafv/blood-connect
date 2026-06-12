import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Droplet,
  Heart,
  ShieldCheck,
  Zap,
  Users,
  ArrowRight,
  Globe2,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";

export default function AboutUs() {
  const values = [
    {
      icon: Heart,
      title: "Human-Centric",
      description:
        "Every line of code we write is dedicated to saving lives and reducing the anxiety of finding a donor during medical emergencies.",
    },
    {
      icon: ShieldCheck,
      title: "Total Anonymity",
      description:
        "Donor phone numbers are never exposed to the public directory. We utilize a proxy-routing architecture where all contact goes directly through the verified managing organization.",
    },
    {
      icon: Zap,
      title: "Real-Time Reliability",
      description:
        "Medical emergencies require instant answers. Our platform is built for speed, ensuring donor availability is calculated accurately in real-time.",
    },
    {
      icon: Users,
      title: "Community Driven",
      description:
        "We empower local hospitals, blood banks, private clinics, and NGOs by giving them the digital infrastructure to manage their invaluable donor registries.",
    },
  ];

  return (
    <>
      {/* SEO Configuration */}
      <Helmet>
        <title>About Us | Bloodonate - Our Mission to Save Lives</title>
        <meta
          name="description"
          content="Learn about Bloodonate's mission to bridge the gap between compassion and urgency. We provide a real-time, highly secure platform connecting blood donors with those in need."
        />
        <meta
          name="keywords"
          content="about Bloodonate, blood donation platform, blood registry mission, healthcare SaaS, blood bank software, NGO blood donation, save lives"
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="About Us | Bloodonate" />
        <meta
          property="og:description"
          content="Discover how Bloodonate is centralizing blood donor data to ensure no one loses a loved one due to blood shortage."
        />
        <meta property="og:url" content="https://www.bloodonate.org/about" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About Us | Bloodonate" />
        <meta
          name="twitter:description"
          content="Discover how Bloodonate is centralizing blood donor data to ensure no one loses a loved one due to blood shortage."
        />

        <link rel="canonical" href="https://www.bloodonate.org/about" />
      </Helmet>

      <div className="flex flex-col min-h-screen bg-slate-50 transition-colors duration-300 dark:bg-slate-950 overflow-hidden">
        {/* --- Hero Composition --- */}
        <section className="relative px-4 pt-24 pb-20 md:pt-32 md:pb-32 text-center">
          {/* Ambient Gradient Mesh */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-125 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none transition-colors duration-300 dark:bg-rose-600/10"
            aria-hidden="true"
          />

          <div className="container mx-auto max-w-4xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-white border border-slate-200 shadow-md mb-8 relative group transition-colors duration-300 dark:bg-slate-900 dark:border-slate-800 dark:shadow-xl">
              <div className="absolute inset-0 bg-rose-100 rounded-2xl blur-xl group-hover:bg-rose-200 transition-colors duration-500 dark:bg-rose-500/20 dark:group-hover:bg-rose-500/30" />
              <Droplet
                className="h-10 w-10 text-rose-600 relative z-10 drop-shadow-[0_0_10px_rgba(225,29,72,0.3)] transition-colors duration-300 dark:text-rose-500 dark:drop-shadow-[0_0_10px_rgba(225,29,72,0.5)]"
                aria-hidden="true"
              />
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-tight transition-colors duration-300 text-slate-900 dark:text-white">
              Bridging the gap between <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-linear-to-r transition-colors duration-300 from-rose-500 to-rose-700 dark:from-rose-400 dark:to-rose-600">
                compassion and urgency.
              </span>
            </h1>

            <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
              Bloodonate was founded on a simple premise: no one should ever
              lose a loved one simply because they couldn't find a matching
              blood donor in time.
            </p>
          </div>
        </section>

        {/* --- Architectural Rationale & Market Positioning --- */}
        <section className="py-24 border-y relative transition-colors duration-300 bg-slate-100/50 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/50">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              {/* Proposition Narrative */}
              <div className="space-y-8">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                  The Challenge We Solve
                </h2>
                <div className="space-y-6 text-lg leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
                  <p>
                    Traditionally, finding a blood donor relies on frantic
                    social media posts, outdated spreadsheets, or calling dozens
                    of hospitals. This process is slow, stressful, and often
                    results in reaching out to people who are medically
                    ineligible to donate.
                  </p>
                  <p>
                    We built a multi-tenant Software-as-a-Service (SaaS)
                    platform that centralizes this data securely. Hospitals and
                    NGOs maintain their own secure registries, while our public
                    directory algorithms ensure only available, eligible donors
                    are displayed.
                  </p>
                </div>

                <div className="pt-8 border-t transition-colors duration-300 border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-start gap-5">
                    <div className="h-14 w-14 rounded-xl flex items-center justify-center border shrink-0 transition-colors duration-300 bg-white border-slate-200 dark:bg-slate-950 dark:border-slate-800">
                      <Globe2
                        className="h-7 w-7 text-emerald-600 transition-colors duration-300 dark:text-emerald-500"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-1 transition-colors duration-300 text-slate-900 dark:text-white">
                        Built for Scale
                      </h4>
                      <p className="transition-colors duration-300 text-slate-600 dark:text-slate-400">
                        Engineered to support thousands of concurrent queries
                        across regional healthcare networks.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Impact Visualization Widget */}
              <div className="relative lg:pl-10">
                <div
                  className="absolute inset-0 rounded-[3rem] blur-3xl transition-colors duration-300 bg-linear-to-tr from-rose-500/10 via-transparent to-blue-500/10 dark:from-rose-600/20 dark:to-blue-600/20"
                  aria-hidden="true"
                />

                <Card className="relative backdrop-blur-xl shadow-xl overflow-hidden rounded-3xl transition-colors duration-300 bg-white/60 border-slate-200 dark:bg-slate-900/60 dark:border-slate-700/50 dark:shadow-2xl">
                  <div className="absolute top-0 right-0 p-32 rounded-full blur-3xl transition-colors duration-300 bg-rose-500/10 dark:bg-rose-500/5" />
                  <CardContent className="p-10 space-y-10 relative z-10">
                    <div className="group">
                      <p className="text-sm font-semibold uppercase tracking-wider mb-2 transition-colors duration-300 text-slate-500 dark:text-slate-400">
                        Organizations Onboarded
                      </p>
                      <p className="text-5xl font-black tracking-tight transition-colors duration-300 text-slate-900 group-hover:text-rose-600 dark:text-white dark:group-hover:text-rose-100">
                        120+
                      </p>
                    </div>
                    <div className="w-full h-px transition-colors duration-300 bg-linear-to-r from-slate-200 to-transparent dark:from-slate-800" />

                    <div className="group">
                      <p className="text-sm font-semibold uppercase tracking-wider mb-2 transition-colors duration-300 text-slate-500 dark:text-slate-400">
                        Registered Donors
                      </p>
                      <p className="text-5xl font-black tracking-tight transition-colors duration-300 text-slate-900 group-hover:text-rose-600 dark:text-white dark:group-hover:text-rose-100">
                        45,000+
                      </p>
                    </div>
                    <div className="w-full h-px transition-colors duration-300 bg-linear-to-r from-slate-200 to-transparent dark:from-slate-800" />

                    <div className="group">
                      <p className="text-sm font-semibold uppercase tracking-wider mb-2 transition-colors duration-300 text-slate-500 dark:text-slate-400">
                        Lives Impacted (Est.)
                      </p>
                      <p className="text-5xl font-black text-transparent bg-clip-text bg-linear-to-r tracking-tight transition-colors duration-300 from-rose-500 to-rose-700 dark:from-rose-400 dark:to-rose-600">
                        12,500+
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* --- Core Values Grid --- */}
        <section className="py-32 transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                Our Core Values
              </h2>
              <p className="text-lg max-w-2xl mx-auto leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
                The principles that dictate our platform architecture, feature
                roadmap, and community engagement strategies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <Card
                    key={index}
                    className="group transition-all duration-500 backdrop-blur-sm hover:-translate-y-1 hover:shadow-xl bg-white/60 border-slate-200 hover:border-rose-300 hover:shadow-rose-100 dark:bg-slate-900/40 dark:border-slate-800/60 dark:hover:bg-slate-900/80 dark:hover:border-slate-700 dark:hover:shadow-2xl dark:hover:shadow-rose-900/10"
                  >
                    <CardContent className="p-10">
                      <div className="h-14 w-14 rounded-xl flex items-center justify-center mb-8 transition-all duration-300 border bg-slate-50 border-slate-200 group-hover:bg-rose-50 group-hover:border-rose-200 dark:bg-slate-950 dark:border-slate-800 dark:group-hover:bg-rose-500/10 dark:group-hover:border-rose-500/20">
                        <Icon
                          className="h-7 w-7 transition-colors duration-300 text-slate-500 group-hover:text-rose-600 dark:text-slate-400 dark:group-hover:text-rose-400"
                          aria-hidden="true"
                        />
                      </div>
                      <h3 className="text-2xl font-bold mb-4 tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                        {value.title}
                      </h3>
                      <p className="leading-relaxed text-lg transition-colors duration-300 text-slate-600 dark:text-slate-400">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* --- Conversion Boundary --- */}
        <section className="py-32 relative overflow-hidden border-t transition-colors duration-300 border-slate-200 dark:border-slate-800/50">
          <div className="absolute inset-0 bg-linear-to-t transition-colors duration-300 from-rose-50 to-transparent dark:from-rose-950/20" />
          <div className="container mx-auto max-w-4xl px-4 relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
              Join the Initiative
            </h2>
            <p className="text-lg mb-12 max-w-2xl mx-auto leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
              Whether you are a citizen looking to register as a donor, or a
              healthcare organization looking to modernize your registry, there
              is a place for you here.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/register-org" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full px-10 py-7 text-lg font-semibold rounded-full shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 dark:shadow-xl dark:hover:shadow-[0_0_40px_rgba(225,29,72,0.3)]"
                >
                  Register Organization
                </Button>
              </Link>
              <Link to="/search" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full px-10 py-7 text-lg font-semibold gap-3 rounded-full backdrop-blur-md transition-all duration-300 bg-white/50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-900/50 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
                >
                  Search Directory
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
