import { Helmet } from "react-helmet-async";
import {
  Scale,
  ShieldAlert,
  FileWarning,
  Users,
  Building2,
  Gavel,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";

export default function TermsOfService() {
  const lastUpdated = "May 17, 2026";

  const terms = [
    {
      icon: Scale,
      title: "1. Acceptance of Terms",
      content: (
        <div className="space-y-4">
          <p>
            By accessing the BlooDonate public directory or provisioning an
            Organization tenant on our Software-as-a-Service (SaaS) platform,
            you agree to be bound by these Terms of Service. If you disagree
            with any stipulation herein, you must immediately cease utilization
            of the infrastructure.
          </p>
        </div>
      ),
    },
    {
      icon: ShieldAlert,
      title: "2. Medical & Emergency Disclaimer",
      content: (
        <div className="space-y-5">
          <p className="text-rose-400 font-semibold text-lg">
            BlooDonate is exclusively a technology platform and data directory;
            it is NOT a healthcare provider, medical facility, or blood bank.
          </p>
          <ul className="list-disc pl-5 space-y-3 text-slate-300">
            <li>
              We do not collect, process, test, or store physical blood or
              plasma.
            </li>
            <li>
              We do not medically verify the hematological eligibility of the
              donors listed; this clinical responsibility lies strictly with the
              registered tenant hospitals and NGOs operating the platform.
            </li>
            <li>
              <strong className="text-rose-300">CRITICAL:</strong> In the event
              of a severe medical emergency, do not rely solely on this
              platform's directory. Contact local emergency medical services or
              proceed to the nearest hospital triage immediately.
            </li>
          </ul>
        </div>
      ),
    },
    {
      icon: Building2,
      title: "3. Tenant Organization Responsibilities",
      content: (
        <div className="space-y-4">
          <p>
            Hospitals, Blood Banks, and NGOs utilizing our SaaS backend operate
            as independent Data Controllers and agree to the following
            operational tenets:
          </p>
          <ul className="list-disc pl-5 space-y-3 text-slate-400">
            <li>
              <strong className="text-slate-200">Data Fidelity:</strong>{" "}
              Organizations must ensure that donor records, specifically
              historical donation timestamps and medical deferral statuses, are
              maintained with strict clinical accuracy.
            </li>
            <li>
              <strong className="text-slate-200">Medical Vetting:</strong>{" "}
              Organizations hold sole clinical responsibility for executing
              requisite hematological screenings and infectious disease panels
              before processing a donation from an individual surfaced via this
              directory.
            </li>
            <li>
              <strong className="text-slate-200">Access Control:</strong>{" "}
              Organizations must enforce robust RBAC (Role-Based Access Control)
              within their tenant workspace and immediately revoke access for
              terminated personnel.
            </li>
          </ul>
        </div>
      ),
    },
    {
      icon: Users,
      title: "4. Public User Code of Conduct",
      content: (
        <div className="space-y-4">
          <p>
            Unauthenticated individuals querying the public directory to locate
            donors must adhere to strict behavioral guidelines:
          </p>
          <ul className="list-disc pl-5 space-y-3 text-slate-400">
            <li>
              <strong className="text-slate-200">
                Zero Tolerance for Harassment:
              </strong>{" "}
              Users may only initiate contact with donors for legitimate,
              immediate blood donation requests. Harassment, spamming, or
              commercial solicitation will result in network-level IP bans and
              potential criminal prosecution.
            </li>
            <li>
              <strong className="text-slate-200">
                No Automated Extraction:
              </strong>{" "}
              Automated scraping, bot-net mining, or systematic extraction of
              donor PII (Personally Identifiable Information) from our directory
              is strictly prohibited and actively monitored.
            </li>
          </ul>
        </div>
      ),
    },
    {
      icon: FileWarning,
      title: "5. Limitation of Liability",
      content: (
        <div className="space-y-4">
          <p>
            To the maximum extent permitted by applicable jurisprudence,
            BlooDonate and its engineering entities shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages,
            whether incurred directly or indirectly, resulting from:
          </p>
          <ul className="list-disc pl-5 space-y-3 text-slate-400">
            <li>
              Service outages, degraded platform availability, or inability to
              access the directory.
            </li>
            <li>
              The clinical conduct, communication, or actions of any third party
              on the service, including both individual donors and registered
              organizations.
            </li>
            <li>
              Any medical complications, adverse reactions, or fatalities
              arising from blood transfusions facilitated through connections
              initiated on this digital platform.
            </li>
          </ul>
        </div>
      ),
    },
    {
      icon: Gavel,
      title: "6. Modifications & Jurisdiction",
      content: (
        <div className="space-y-4">
          <p>
            We reserve the right to architecturally or legally modify these
            Terms at any time. Material operational changes will be broadcast
            via platform notifications. These terms shall be governed and
            construed in accordance with the laws of Kerala, India, without
            regard to its conflict of law provisions.
          </p>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* SEO Configuration */}
      <Helmet>
        <title>Terms of Service | BlooDonate</title>
        <meta
          name="description"
          content="Review the BlooDonate Terms of Service, including our medical and emergency disclaimers, user code of conduct, and organizational responsibilities."
        />
        <meta
          name="keywords"
          content="terms of service, BlooDonate terms, medical disclaimer, SaaS terms, user agreement, blood directory rules"
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Terms of Service | BlooDonate" />
        <meta
          property="og:description"
          content="Review the BlooDonate Terms of Service, including our medical and emergency disclaimers."
        />
        <meta
          property="og:url"
          content="https://www.bloodonate.org/terms-of-service"
        />

        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Terms of Service | BlooDonate" />
        <meta
          name="twitter:description"
          content="Review the BlooDonate Terms of Service, including our medical and emergency disclaimers."
        />

        {/* Canonical Link */}
        <link
          rel="canonical"
          href="https://www.bloodonate.org/terms-of-service"
        />
      </Helmet>

      <div className="flex flex-col min-h-screen bg-slate-950 overflow-hidden pb-32">
        {/* --- Composition Header --- */}
        <section className="relative px-4 pt-24 pb-20 text-center border-b border-slate-800/80 bg-slate-900/20">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-175 h-87.5 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"
            aria-hidden="true"
          />

          <div className="container mx-auto max-w-4xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-slate-900 border border-slate-800 mb-8 shadow-2xl relative group">
              <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl" />
              <Scale
                className="h-10 w-10 text-blue-500 relative z-10"
                aria-hidden="true"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
              Terms of Service
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Please review these stipulations carefully. They govern your
              utilization of the public directory infrastructure and the
              organizational SaaS backend.
            </p>
            <div className="mt-10 inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-sm text-slate-400 shadow-inner">
              <span className="uppercase tracking-wider text-xs font-semibold">
                Effective Date:
              </span>
              <span className="font-medium text-slate-200">{lastUpdated}</span>
            </div>
          </div>
        </section>

        {/* --- Legal Document Body --- */}
        <div className="container mx-auto max-w-4xl px-4 pt-16 relative z-10 space-y-8">
          <div className="space-y-8">
            {terms.map((term, index) => {
              const Icon = term.icon;

              const isDisclaimer = index === 1;

              return (
                <Card
                  key={index}
                  className={`relative overflow-hidden backdrop-blur-md transition-all duration-300 ${
                    isDisclaimer
                      ? "bg-rose-950/20 border-rose-500/30 shadow-[0_0_30px_rgba(225,29,72,0.05)]"
                      : "bg-slate-900/40 border-slate-800/60 hover:bg-slate-900/60 hover:border-slate-700/80"
                  }`}
                >
                  {/* Danger state ambient glow */}
                  {isDisclaimer && (
                    <div
                      className="absolute top-0 right-0 p-32 bg-rose-500/5 rounded-full blur-3xl pointer-events-none"
                      aria-hidden="true"
                    />
                  )}

                  <CardHeader
                    className={`border-b pb-5 px-8 pt-8 ${isDisclaimer ? "border-rose-500/20" : "border-slate-800/50"}`}
                  >
                    <CardTitle className="flex items-center gap-4 text-xl text-white tracking-tight">
                      <div
                        className={`h-12 w-12 rounded-xl flex items-center justify-center border shrink-0 ${
                          isDisclaimer
                            ? "bg-rose-500/10 border-rose-500/30"
                            : "bg-blue-500/10 border-blue-500/20"
                        }`}
                      >
                        {isDisclaimer && (
                          <span className="absolute flex h-3 w-3 -top-1 -right-1">
                            <span
                              className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"
                              aria-hidden="true"
                            ></span>
                            <span
                              className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"
                              aria-hidden="true"
                            ></span>
                          </span>
                        )}
                        <Icon
                          className={`h-6 w-6 ${isDisclaimer ? "text-rose-500" : "text-blue-400"}`}
                          aria-hidden="true"
                        />
                      </div>
                      {term.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 text-slate-400 leading-relaxed text-base relative z-10">
                    {term.content}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Legal Contact Node */}
          <div className="mt-16 p-8 rounded-3xl border border-slate-800 bg-slate-900/30 text-center relative overflow-hidden">
            <div
              className="absolute inset-0 bg-linear-to-t from-blue-900/10 to-transparent"
              aria-hidden="true"
            />
            <h3 className="text-xl font-bold text-white mb-3 relative z-10">
              Legal Inquiries
            </h3>
            <p className="text-slate-400 mb-6 max-w-xl mx-auto relative z-10">
              For formal questions or clarifications regarding these Terms of
              Service, please address our legal compliance team directly.
            </p>
            <a
              href="mailto:legal@bloodonate.org"
              className="relative z-10 inline-flex items-center font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              legal@bloodonate.org
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
