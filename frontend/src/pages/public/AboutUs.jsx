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
      {/* --- Hero Section --- */}
      <section className="relative px-4 pt-24 pb-20 md:pt-32 md:pb-32 text-center">
        {/* Ambient Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-100 bg-rose-600/10 rounded-[100%] blur-[120px] pointer-events-none" />

        <div className="container mx-auto max-w-4xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-rose-500/10 border border-rose-500/20 mb-6">
            <Droplet className="h-8 w-8 text-rose-500" />
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6">
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

      {/* --- The Problem & Solution Section --- */}
      <section className="py-20 bg-slate-900/50 border-y border-slate-800">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white">
                The Challenge We Solve
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Traditionally, finding a blood donor relies on frantic social
                media posts, outdated spreadsheets, or calling dozens of
                hospitals. This process is slow, stressful, and often results in
                reaching out to people who are medically ineligible to donate.
              </p>
              <p className="text-slate-400 leading-relaxed">
                We built a multi-tenant Software-as-a-Service (SaaS) platform
                that centralizes this data securely. Hospitals and NGOs maintain
                their own secure registries, while our public directory
                algorithms ensure only available, eligible donors are displayed.
              </p>
              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center gap-4 text-white">
                  <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                    <Globe2 className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Built for Scale</h4>
                    <p className="text-sm text-slate-400">
                      Serving communities across the state.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Visual / Stats (Mock) */}
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-tr from-rose-600/20 to-blue-600/20 rounded-2xl blur-2xl" />
              <Card className="relative bg-slate-900/80 border-slate-700 backdrop-blur-md">
                <CardContent className="p-8 space-y-8">
                  <div>
                    <p className="text-sm font-medium text-slate-400 mb-1">
                      Organizations Onboarded
                    </p>
                    <p className="text-4xl font-bold text-white">120+</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400 mb-1">
                      Registered Donors
                    </p>
                    <p className="text-4xl font-bold text-white">45,000+</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400 mb-1">
                      Lives Impacted (Est.)
                    </p>
                    <p className="text-4xl font-bold text-rose-500">12,500+</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* --- Core Values Grid --- */}
      <section className="py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Our Core Values
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              The principles that guide our platform development and community
              engagement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card
                  key={index}
                  className="bg-slate-900/40 border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <CardContent className="p-8">
                    <div className="h-12 w-12 rounded-lg bg-rose-500/10 flex items-center justify-center mb-6">
                      <Icon className="h-6 w-6 text-rose-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">
                      {value.title}
                    </h3>
                    <p className="text-slate-400 leading-relaxed">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-rose-600/5" />
        <div className="container mx-auto max-w-4xl px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Join the Initiative
          </h2>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            Whether you are a citizen looking to register as a donor, or an
            organization looking to modernize your registry, there is a place
            for you here.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register-org">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto px-8 py-6 text-base gap-2 rounded-full hover:shadow-[0_0_30px_rgba(225,29,72,0.3)]"
              >
                Register Organization
              </Button>
            </Link>
            <Link to="/search">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto px-8 py-6 text-base gap-2 rounded-full bg-slate-900/50 backdrop-blur-sm"
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
