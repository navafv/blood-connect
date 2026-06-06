import { Link } from "react-router-dom";
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
      title: "Data Privacy",
      description:
        "We prioritize the security of medical and personal data. Contact details are strictly protected and never sold or shared with third parties.",
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
        "We empower local hospitals, NGOs, and blood banks by giving them the digital infrastructure to manage their invaluable donor registries.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 overflow-hidden">
      {/* --- Hero Composition --- */}
      <section className="relative px-4 pt-24 pb-20 md:pt-32 md:pb-32 text-center">
        {/* Ambient Gradient Mesh */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-125 bg-rose-600/10 rounded-full blur-[120px] pointer-events-none"
          aria-hidden="true"
        />

        <div className="container mx-auto max-w-4xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl mb-8 relative group">
            <div className="absolute inset-0 bg-rose-500/20 rounded-2xl blur-xl group-hover:bg-rose-500/30 transition-colors duration-500" />
            <Droplet className="h-10 w-10 text-rose-500 relative z-10 drop-shadow-[0_0_10px_rgba(225,29,72,0.5)]" />
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight">
            Bridging the gap between <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-rose-400 to-rose-600">
              compassion and urgency.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            BloodConnect was founded on a simple premise: no one should ever
            lose a loved one simply because they couldn't find a matching blood
            donor in time.
          </p>
        </div>
      </section>

      {/* --- Architectural Rationale & Market Positioning --- */}
      <section className="py-24 bg-slate-900/40 border-y border-slate-800/50 relative">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Proposition Narrative */}
            <div className="space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                The Challenge We Solve
              </h2>
              <div className="space-y-6 text-lg text-slate-400 leading-relaxed">
                <p>
                  Traditionally, finding a blood donor relies on frantic social
                  media posts, outdated spreadsheets, or calling dozens of
                  hospitals. This process is slow, stressful, and often results
                  in reaching out to people who are medically ineligible to
                  donate.
                </p>
                <p>
                  We built a multi-tenant Software-as-a-Service (SaaS) platform
                  that centralizes this data securely. Hospitals and NGOs
                  maintain their own secure registries, while our public
                  directory algorithms ensure only available, eligible donors
                  are displayed.
                </p>
              </div>

              <div className="pt-8 border-t border-slate-800/80">
                <div className="flex items-start gap-5">
                  <div className="h-14 w-14 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800 shrink-0">
                    <Globe2 className="h-7 w-7 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-1">
                      Built for Scale
                    </h4>
                    <p className="text-slate-400">
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
                className="absolute inset-0 bg-linear-to-tr from-rose-600/20 via-transparent to-blue-600/20 rounded-[3rem] blur-3xl"
                aria-hidden="true"
              />

              <Card className="relative bg-slate-900/60 border-slate-700/50 backdrop-blur-xl shadow-2xl overflow-hidden rounded-3xl">
                <div className="absolute top-0 right-0 p-32 bg-rose-500/5 rounded-full blur-3xl" />
                <CardContent className="p-10 space-y-10 relative z-10">
                  <div className="group">
                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Organizations Onboarded
                    </p>
                    <p className="text-5xl font-black text-white tracking-tight group-hover:text-rose-100 transition-colors">
                      120+
                    </p>
                  </div>
                  <div className="w-full h-px bg-linear-to-r from-slate-800 to-transparent" />

                  <div className="group">
                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Registered Donors
                    </p>
                    <p className="text-5xl font-black text-white tracking-tight group-hover:text-rose-100 transition-colors">
                      45,000+
                    </p>
                  </div>
                  <div className="w-full h-px bg-linear-to-r from-slate-800 to-transparent" />

                  <div className="group">
                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Lives Impacted (Est.)
                    </p>
                    <p className="text-5xl font-black text-transparent bg-clip-text bg-linear-to-r from-rose-400 to-rose-600 tracking-tight">
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
      <section className="py-32 bg-slate-950">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">
              Our Core Values
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
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
                  className="group bg-slate-900/40 border-slate-800/60 hover:bg-slate-900/80 hover:border-slate-700 transition-all duration-500 backdrop-blur-sm hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-900/10"
                >
                  <CardContent className="p-10">
                    <div className="h-14 w-14 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-8 group-hover:bg-rose-500/10 group-hover:border-rose-500/20 transition-all duration-300">
                      <Icon className="h-7 w-7 text-slate-400 group-hover:text-rose-400 transition-colors duration-300" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">
                      {value.title}
                    </h3>
                    <p className="text-slate-400 leading-relaxed text-lg">
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
      <section className="py-32 relative overflow-hidden border-t border-slate-800/50">
        <div className="absolute inset-0 bg-linear-to-t from-rose-950/20 to-transparent" />
        <div className="container mx-auto max-w-4xl px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
            Join the Initiative
          </h2>
          <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Whether you are a citizen looking to register as a donor, or a
            healthcare organization looking to modernize your registry, there is
            a place for you here.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/register-org" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full px-10 py-7 text-lg font-semibold rounded-full shadow-xl hover:shadow-[0_0_40px_rgba(225,29,72,0.3)] hover:-translate-y-1 transition-all duration-300"
              >
                Register Organization
              </Button>
            </Link>
            <Link to="/search" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full px-10 py-7 text-lg font-semibold gap-3 rounded-full bg-slate-900/50 backdrop-blur-md border-slate-700 hover:bg-slate-800 hover:text-white transition-all duration-300"
              >
                Search Directory
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
