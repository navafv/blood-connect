import { Link } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Coffee,
  Activity,
  HeartPulse,
  CalendarClock,
  ArrowRight,
  Info,
} from "lucide-react";

import { Button } from "../../components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";

export default function DonorGuidelines() {
  const basicRequirements = [
    { label: "Age", value: "Between 18 and 65 years old." },
    { label: "Weight", value: "Minimum of 50 kg (110 lbs)." },
    {
      label: "General Health",
      value: "Must be feeling well and healthy on the day of donation.",
    },
    {
      label: "Hemoglobin",
      value: "Not less than 12.5 g/dL (checked at the donation site).",
    },
    { label: "Donation Interval", value: "Male: 90 days | Female: 120 days." },
  ];

  const prepTips = [
    {
      icon: Coffee,
      text: "Hydrate: Drink plenty of water or juice before donating.",
    },
    {
      icon: Activity,
      text: "Nutrition: Eat a balanced, low-fat meal within 3 hours prior.",
    },
    {
      icon: HeartPulse,
      text: "Sobriety: Avoid alcohol consumption for 24 hours prior.",
    },
    {
      icon: CalendarClock,
      text: "Rest: Aim for at least 6-8 hours of quality sleep.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 pb-24">
      {/* --- Hero Section --- */}
      <section className="relative px-4 pt-24 pb-20 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-75 bg-rose-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto max-w-4xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-slate-900 border border-slate-800 mb-8 shadow-2xl">
            <HeartPulse className="h-10 w-10 text-rose-500" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
            Donor Eligibility & Guidelines
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Your safety and the safety of the patient are our highest
            priorities. Please review these essential medical guidelines
            carefully.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-5xl px-4 space-y-12 relative z-10">
        {/* --- Eligibility Grid --- */}
        <Card className="border-emerald-500/20 bg-slate-900/40 backdrop-blur-md shadow-2xl">
          <CardHeader className="border-b border-slate-800 pb-6">
            <CardTitle className="flex items-center gap-3 text-emerald-400 text-2xl">
              <CheckCircle2 className="h-7 w-7" />
              Basic Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {basicRequirements.map((req, idx) => (
                <div key={idx} className="flex gap-4 group">
                  <div className="mt-1.5 shrink-0">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-100">
                      {req.label}
                    </h4>
                    <p className="text-slate-400 mt-1 leading-relaxed">
                      {req.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* --- Preparation Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prepTips.map((tip, idx) => {
            const Icon = tip.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-5 bg-slate-900/40 border border-slate-800 p-6 rounded-2xl hover:bg-slate-800/50 transition-colors"
              >
                <div className="h-14 w-14 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800 shrink-0">
                  <Icon className="h-6 w-6 text-blue-400" />
                </div>
                <p className="text-slate-200 font-medium">{tip.text}</p>
              </div>
            );
          })}
        </div>

        {/* --- Deferral Comparison --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-amber-500/20 bg-slate-900/40 backdrop-blur-md">
            <CardHeader className="border-b border-slate-800 pb-4 bg-amber-500/5">
              <CardTitle className="flex items-center gap-3 text-amber-400">
                <AlertTriangle className="h-6 w-6" />
                Temporary Deferrals (Wait)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-slate-400 text-sm mb-4">
                Postponement required for specific health events:
              </p>
              {[
                {
                  title: "Tattoos/Piercings",
                  desc: "6-12 months post-procedure.",
                },
                { title: "Minor Illness", desc: "Until 7 days post-recovery." },
                { title: "Pregnancy", desc: "6 months post-delivery." },
                { title: "Surgery", desc: "6-12 months post-recovery." },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 text-sm text-slate-300">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>
                    <strong>{item.title}:</strong> {item.desc}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-rose-500/20 bg-slate-900/40 backdrop-blur-md">
            <CardHeader className="border-b border-slate-800 pb-4 bg-rose-500/5">
              <CardTitle className="flex items-center gap-3 text-rose-500">
                <XCircle className="h-6 w-6" />
                Permanent Deferrals
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-slate-400 text-sm mb-4">
                Ineligibility based on long-term medical history:
              </p>
              {[
                "HIV/AIDS infection or high-risk history.",
                "Hepatitis B or C diagnosis.",
                "Chronic heart or severe kidney conditions.",
                "History of malignant cancers.",
              ].map((item, i) => (
                <div key={i} className="flex gap-3 text-sm text-slate-300">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* --- Call to Action --- */}
        <div className="flex flex-col items-center pt-12 border-t border-slate-800 text-center">
          <Info className="h-10 w-10 text-slate-600 mb-4" />
          <p className="text-slate-400 max-w-xl mb-8">
            Note: This is a general guide. The medical officer at your chosen
            healthcare facility will perform the final assessment for donation
            eligibility.
          </p>
          <Link to="/search">
            <Button
              size="lg"
              className="rounded-full px-8 gap-2 bg-rose-600 hover:bg-rose-700"
            >
              Find Patients in Need <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
