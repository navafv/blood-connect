import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
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
  RefreshCcw,
  UserCheck,
} from "lucide-react";

import { Button } from "../../components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import { AdBanner } from "../../components/ads/AdBanner";

// --- [NEW] Interactive Quiz Component ---
function EligibilityQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState(null); // 'pass' or 'fail'

  const questions = [
    {
      id: 1,
      question:
        "Are you between the ages of 18 and 65, and weigh at least 50 kg (110 lbs)?",
      passAnswer: "Yes",
    },
    {
      id: 2,
      question: "Have you had a tattoo or body piercing in the last 6 months?",
      passAnswer: "No",
    },
    {
      id: 3,
      question:
        "Are you currently feeling unwell, taking antibiotics, or recovering from a fever/infection?",
      passAnswer: "No",
    },
    {
      id: 4,
      question: "Have you been pregnant or given birth in the past 6 months?",
      passAnswer: "No",
    },
    {
      id: 5,
      question:
        "Have you donated whole blood in the last 90 days (if male) or 120 days (if female)?",
      passAnswer: "No",
    },
  ];

  const handleAnswer = (answer) => {
    const currentQ = questions[currentStep];
    if (answer !== currentQ.passAnswer) {
      setResult("fail");
    } else if (currentStep === questions.length - 1) {
      setResult("pass");
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setResult(null);
  };

  return (
    <Card className="backdrop-blur-md shadow-xl transition-colors duration-300 bg-white border-blue-200 dark:bg-slate-900/40 dark:border-blue-500/20 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
      <CardHeader className="border-b pb-6 transition-colors duration-300 bg-blue-50 border-blue-100 dark:bg-blue-500/5 dark:border-slate-800">
        <CardTitle className="flex items-center gap-3 text-2xl transition-colors duration-300 text-blue-700 dark:text-blue-400">
          <UserCheck className="h-7 w-7" aria-hidden="true" />
          Interactive Eligibility Checker
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-8">
        {result === null ? (
          <div className="animate-in fade-in duration-500 text-center max-w-lg mx-auto py-4">
            <div className="flex justify-center gap-2 mb-8">
              {questions.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    idx <= currentStep
                      ? "bg-blue-600 dark:bg-blue-500"
                      : "bg-slate-200 dark:bg-slate-800"
                  }`}
                />
              ))}
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-8 min-h-[80px] flex items-center justify-center">
              {questions[currentStep].question}
            </h3>
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleAnswer("Yes")}
                className="w-32 py-6 text-lg font-bold border-2 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
              >
                Yes
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleAnswer("No")}
                className="w-32 py-6 text-lg font-bold border-2 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
              >
                No
              </Button>
            </div>
          </div>
        ) : result === "pass" ? (
          <div className="animate-in zoom-in-95 duration-500 text-center py-8">
            <div className="mx-auto h-20 w-20 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center mb-6 dark:bg-emerald-500/20">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              You are likely eligible!
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
              Based on your answers, you meet the primary criteria to safely
              donate blood. A final assessment will be done by the medical staff
              at your local facility.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="ghost" onClick={resetQuiz}>
                Start Over
              </Button>
              <Link to="/register-org">
                <Button
                  variant="primary"
                  className="shadow-lg hover:shadow-xl dark:shadow-emerald-500/20"
                >
                  Contact a Hospital Today
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="animate-in zoom-in-95 duration-500 text-center py-8">
            <div className="mx-auto h-20 w-20 rounded-full bg-amber-100 border-2 border-amber-500 flex items-center justify-center mb-6 dark:bg-amber-500/20">
              <AlertTriangle className="h-10 w-10 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Temporary Deferral
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
              For your safety or the safety of the recipient, you currently do
              not meet the criteria to donate blood. Please review the detailed
              guidelines below to see when you might be eligible again.
            </p>
            <Button variant="outline" onClick={resetQuiz} className="gap-2">
              <RefreshCcw className="h-4 w-4" /> Retake Quiz
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
      value:
        "Whole Blood: 90 days (Male) / 120 days (Female/Other). Platelets (Apheresis): 14 days. Plasma: 28 days.",
    },
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
    <>
      <Helmet>
        <title>Donor Eligibility & Guidelines | Bloodonate</title>
        <meta
          name="description"
          content="Review essential medical guidelines, age, weight, and health requirements to determine if you are eligible to safely donate blood with Bloodonate."
        />
        <meta
          name="keywords"
          content="blood donor eligibility, who can donate blood, blood donation requirements, blood donation guidelines, temporary deferrals, permanent deferrals"
        />

        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Donor Eligibility & Guidelines | Bloodonate"
        />
        <meta
          property="og:description"
          content="Review essential medical guidelines to determine if you are eligible to donate blood safely."
        />
        <meta
          property="og:url"
          content="https://www.bloodonate.org/guidelines"
        />

        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Donor Eligibility & Guidelines | Bloodonate"
        />
        <meta
          name="twitter:description"
          content="Review essential medical guidelines to determine if you are eligible to donate blood safely."
        />

        <link rel="canonical" href="https://www.bloodonate.org/guidelines" />
      </Helmet>

      <div className="flex flex-col min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-950 pb-24">
        {/* --- Hero Section --- */}
        <section className="relative px-4 pt-24 pb-20 text-center overflow-hidden">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[100px] pointer-events-none transition-colors duration-300 bg-rose-500/10 dark:bg-rose-600/10"
            aria-hidden="true"
          />

          <div className="container mx-auto max-w-4xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl mb-8 shadow-md transition-colors duration-300 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:shadow-2xl">
              <HeartPulse
                className="h-10 w-10 transition-colors duration-300 text-rose-600 dark:text-rose-500"
                aria-hidden="true"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 transition-colors duration-300 text-slate-900 dark:text-white">
              Donor Eligibility & Guidelines
            </h1>
            <p className="text-xl max-w-2xl mx-auto leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
              Your safety and the safety of the patient are our highest
              priorities. Please review these essential medical guidelines
              carefully.
            </p>
          </div>
        </section>

        <div className="container mx-auto max-w-5xl px-4 space-y-12 relative z-10">
          {/* --- [NEW] Interactive Quiz Segment --- */}
          <EligibilityQuiz />

          {/* --- Eligibility Grid --- */}
          <Card className="backdrop-blur-md shadow-xl transition-colors duration-300 bg-white border border-emerald-200 dark:bg-slate-900/40 dark:border-emerald-500/20 dark:shadow-2xl">
            <CardHeader className="border-b pb-6 transition-colors duration-300 border-emerald-100 dark:border-slate-800">
              <CardTitle className="flex items-center gap-3 text-2xl transition-colors duration-300 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
                Basic Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {basicRequirements.map((req, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 group md:last:col-span-2"
                  >
                    <div className="mt-1.5 shrink-0">
                      <div
                        className="h-3 w-3 rounded-full group-hover:scale-125 transition-transform bg-emerald-500"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold transition-colors duration-300 text-slate-900 dark:text-slate-100">
                        {req.label}
                      </h4>
                      <p className="mt-1 leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
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
                  className="flex items-center gap-5 p-6 rounded-2xl transition-colors duration-300 shadow-sm border bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-900/40 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <div className="h-14 w-14 rounded-xl flex items-center justify-center border shrink-0 transition-colors duration-300 bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800">
                    <Icon
                      className="h-6 w-6 transition-colors duration-300 text-blue-600 dark:text-blue-400"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="font-medium transition-colors duration-300 text-slate-700 dark:text-slate-200">
                    {tip.text}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="py-4">
            <AdBanner format="banner" />
          </div>

          {/* --- Deferral Comparison --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="backdrop-blur-md transition-colors duration-300 bg-white border-amber-200 shadow-lg dark:bg-slate-900/40 dark:border-amber-500/20">
              <CardHeader className="border-b pb-4 transition-colors duration-300 bg-amber-50 border-amber-100 dark:bg-amber-500/5 dark:border-slate-800">
                <CardTitle className="flex items-center gap-3 transition-colors duration-300 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-6 w-6" aria-hidden="true" />
                  Temporary Deferrals (Wait)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm mb-4 transition-colors duration-300 text-slate-600 dark:text-slate-400">
                  Postponement required for specific health events:
                </p>
                {[
                  {
                    title: "Tattoos/Piercings",
                    desc: "6-12 months post-procedure.",
                  },
                  {
                    title: "Minor Illness",
                    desc: "Until 7 days post-recovery.",
                  },
                  { title: "Pregnancy", desc: "6 months post-delivery." },
                  { title: "Surgery", desc: "6-12 months post-recovery." },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex gap-3 text-sm transition-colors duration-300 text-slate-700 dark:text-slate-300"
                  >
                    <span
                      className="font-bold transition-colors duration-300 text-amber-600 dark:text-amber-500"
                      aria-hidden="true"
                    >
                      •
                    </span>
                    <span>
                      <strong>{item.title}:</strong> {item.desc}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="backdrop-blur-md transition-colors duration-300 bg-white border-rose-200 shadow-lg dark:bg-slate-900/40 dark:border-rose-500/20">
              <CardHeader className="border-b pb-4 transition-colors duration-300 bg-rose-50 border-rose-100 dark:bg-rose-500/5 dark:border-slate-800">
                <CardTitle className="flex items-center gap-3 transition-colors duration-300 text-rose-700 dark:text-rose-500">
                  <XCircle className="h-6 w-6" aria-hidden="true" />
                  Permanent Deferrals
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm mb-4 transition-colors duration-300 text-slate-600 dark:text-slate-400">
                  Ineligibility based on long-term medical history:
                </p>
                {[
                  "HIV/AIDS infection or high-risk history.",
                  "Hepatitis B or C diagnosis.",
                  "Chronic heart or severe kidney conditions.",
                  "History of malignant cancers.",
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex gap-3 text-sm transition-colors duration-300 text-slate-700 dark:text-slate-300"
                  >
                    <span
                      className="font-bold transition-colors duration-300 text-rose-600 dark:text-rose-500"
                      aria-hidden="true"
                    >
                      •
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* --- Call to Action --- */}
          <div className="flex flex-col items-center pt-12 border-t text-center transition-colors duration-300 border-slate-200 dark:border-slate-800">
            <Info
              className="h-10 w-10 mb-4 transition-colors duration-300 text-slate-400 dark:text-slate-600"
              aria-hidden="true"
            />
            <p className="max-w-xl mb-8 transition-colors duration-300 text-slate-600 dark:text-slate-400">
              Note: This is a general guide. The medical officer at your chosen
              healthcare facility will perform the final assessment for donation
              eligibility.
            </p>
            <Link to="/search">
              <Button
                size="lg"
                variant="primary"
                className="rounded-full px-8 gap-2 hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-lg dark:shadow-rose-glow dark:hover:shadow-rose-glow-lg"
              >
                Find Patients in Need{" "}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
