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
    {
      label: "Donation Interval",
      value: "Male: 90 days (3 months) | Female: 120 days (4 months).",
    },
  ];

  const prepTips = [
    {
      icon: Coffee,
      text: "Drink plenty of fluids (water or juice) before donating.",
    },
    {
      icon: Activity,
      text: "Eat a healthy, low-fat meal within 3 hours prior to donation.",
    },
    {
      icon: HeartPulse,
      text: "Avoid alcohol consumption for at least 24 hours before donating.",
    },
    {
      icon: CalendarClock,
      text: "Ensure you have had a good night's sleep (at least 6-8 hours).",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 overflow-hidden pb-24">
      {/* --- Hero Section --- */}
      <section className="relative px-4 pt-20 pb-16 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-75 bg-rose-600/10 rounded-[100%] blur-[100px] pointer-events-none" />

        <div className="container mx-auto max-w-4xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-slate-900 border border-slate-800 mb-6 shadow-lg shadow-rose-500/10">
            <HeartPulse className="h-8 w-8 text-rose-500" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Donor Eligibility & Guidelines
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Your safety and the safety of the patient are our highest
            priorities. Please review these essential medical guidelines before
            offering to donate blood.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-5xl px-4 space-y-8 relative z-10">
        {/* --- Basic Requirements --- */}
        <Card className="border-emerald-500/20 bg-slate-900/60 backdrop-blur-md">
          <CardHeader className="border-b border-slate-800 pb-4">
            <CardTitle className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              Basic Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {basicRequirements.map((req, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="mt-1 shrink-0">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-200">{req.label}</h4>
                    <p className="text-sm text-slate-400 mt-1">{req.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* --- Before You Donate (Preparation) --- */}
        <Card className="border-slate-800 bg-slate-900/40">
          <CardHeader className="border-b border-slate-800 pb-4">
            <CardTitle className="flex items-center gap-2 text-blue-400">
              <Activity className="h-5 w-5" />
              Before You Donate
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prepTips.map((tip, idx) => {
                const Icon = tip.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800"
                  >
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-blue-400" />
                    </div>
                    <p className="text-sm text-slate-300">{tip.text}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* --- Temporary Deferrals --- */}
          <Card className="border-amber-500/20 bg-slate-900/60 backdrop-blur-md">
            <CardHeader className="border-b border-slate-800 pb-4 bg-amber-500/5">
              <CardTitle className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
                Temporary Deferrals (Wait)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-400 mb-6">
                You must wait for a specific period before donating if you have
                experienced any of the following:
              </p>
              <ul className="space-y-4">
                <li className="flex gap-3 text-sm text-slate-300">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>
                    <strong>Tattoos or Piercings:</strong> Wait 6 to 12 months
                    (varies by local clinical guidelines).
                  </span>
                </li>
                <li className="flex gap-3 text-sm text-slate-300">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>
                    <strong>Minor Illness:</strong> Wait until fully recovered
                    from colds, flu, or sore throat (usually 7 days
                    post-recovery).
                  </span>
                </li>
                <li className="flex gap-3 text-sm text-slate-300">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>
                    <strong>Pregnancy:</strong> Wait 6 months after delivery. Do
                    not donate while breastfeeding.
                  </span>
                </li>
                <li className="flex gap-3 text-sm text-slate-300">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>
                    <strong>Major Surgery:</strong> Wait 6 to 12 months
                    depending on the procedure and healing.
                  </span>
                </li>
                <li className="flex gap-3 text-sm text-slate-300">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>
                    <strong>Vaccinations:</strong> Wait 2 to 4 weeks depending
                    on the type of vaccine (e.g., live vs. inactivated).
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* --- Permanent Deferrals --- */}
          <Card className="border-rose-500/20 bg-slate-900/60 backdrop-blur-md">
            <CardHeader className="border-b border-slate-800 pb-4 bg-rose-500/5">
              <CardTitle className="flex items-center gap-2 text-rose-500">
                <XCircle className="h-5 w-5" />
                Permanent Deferrals
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-400 mb-6">
                For the safety of the blood supply, you cannot donate blood if
                you have a history of:
              </p>
              <ul className="space-y-4">
                <li className="flex gap-3 text-sm text-slate-300">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>
                    HIV infection or risk factors associated with HIV.
                  </span>
                </li>
                <li className="flex gap-3 text-sm text-slate-300">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Hepatitis B or Hepatitis C infection at any time.</span>
                </li>
                <li className="flex gap-3 text-sm text-slate-300">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>
                    Severe heart conditions, recurring strokes, or chronic
                    kidney disease.
                  </span>
                </li>
                <li className="flex gap-3 text-sm text-slate-300">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>
                    Cancer (leukemia, lymphoma, or active treatment for other
                    cancers).
                  </span>
                </li>
                <li className="flex gap-3 text-sm text-slate-300">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Intravenous (IV) drug abuse.</span>
                </li>
              </ul>
              <div className="mt-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 leading-relaxed">
                <strong>Note:</strong> This is not an exhaustive list. The
                medical officer at the donation center will make the final
                decision regarding eligibility.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- Bottom Call to Action --- */}
        <div className="mt-12 text-center py-12 border-t border-slate-800">
          <h3 className="text-2xl font-bold text-white mb-4">
            Meet the requirements?
          </h3>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            If you are healthy and eligible, your local community needs you. Use
            our public directory to find organizations currently seeking donors
            in your area.
          </p>
          <Link to="/search">
            <Button
              variant="primary"
              size="lg"
              className="rounded-full px-8 gap-2 shadow-[0_0_20px_rgba(225,29,72,0.3)]"
            >
              Search for Patients in Need
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
