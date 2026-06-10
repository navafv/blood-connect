import { Helmet } from "react-helmet-async";
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Server,
  FileText,
  Scale,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";

export default function PrivacyPolicy() {
  const lastUpdated = "May 17, 2026";

  const policies = [
    {
      icon: FileText,
      title: "1. Information We Collect",
      content: (
        <div className="space-y-4">
          <p>We collect information primarily in two categories:</p>
          <ul className="list-disc pl-5 space-y-3 text-slate-400">
            <li>
              <strong className="text-slate-200">Organization Data:</strong>{" "}
              When a hospital or NGO registers, we collect official contact
              details, physical addresses, and administrative credentials
              required for tenant provisioning.
            </li>
            <li>
              <strong className="text-slate-200">Donor Data:</strong>{" "}
              Organizations input donor details into their secure tenant
              environment. This includes Full Name, Blood Group, Gender, Phone
              Number, Date of Birth, Location (City/District), and historical
              donation timelines.
            </li>
          </ul>
        </div>
      ),
    },
    {
      icon: EyeOff,
      title: "2. How We Protect & Mask Data",
      content: (
        <div className="space-y-4">
          <p>
            Protecting donor privacy is a core architectural principle of the
            BlooDonate system:
          </p>
          <ul className="list-disc pl-5 space-y-3 text-slate-400">
            <li>
              <strong className="text-slate-200">Contact Masking:</strong> Donor
              phone numbers are masked by default on the public directory. Full
              identifiers are only revealed via explicit user action, subject to
              systemic rate-limiting to prevent automated scraping and data
              harvesting.
            </li>
            <li>
              <strong className="text-slate-200">
                Eligibility Abstraction:
              </strong>{" "}
              We do not publicly display a donor's medical deferral etiology or
              exact historical donation timestamps. The system outputs a
              strictly binary "Available" or "Unavailable" status based on
              dynamic background eligibility calculations.
            </li>
          </ul>
        </div>
      ),
    },
    {
      icon: Server,
      title: "3. Data Storage & Multi-Tenancy",
      content: (
        <div className="space-y-4">
          <p>
            Our Software-as-a-Service (SaaS) platform operates on a strict
            multi-tenant architecture. Donor data is cryptographically and
            logically isolated by organization. Personnel from Hospital A cannot
            query, view, or modify the donor registry managed by NGO B. All
            persistent data is encrypted at rest using industry-standard AES-256
            protocols.
          </p>
        </div>
      ),
    },
    {
      icon: Lock,
      title: "4. Information Sharing & Disclosure",
      content: (
        <div className="space-y-4">
          <p>
            We strictly prohibit the monetization, rental, or unauthorized trade
            of personal or medical information. Data disclosure is limited to
            the following vectors:
          </p>
          <ul className="list-disc pl-5 space-y-3 text-slate-400">
            <li>
              <strong className="text-slate-200">Public Directory:</strong>{" "}
              Basic, masked donor attributes (Name, Blood Group, Region) are
              surfaced publicly for the sole operational purpose of facilitating
              emergency blood donations.
            </li>
            <li>
              <strong className="text-slate-200">Legal Requirements:</strong>{" "}
              Compelled disclosure if mandated by binding court order, law
              enforcement subpoena, or governmental authority within the
              applicable jurisdiction.
            </li>
          </ul>
        </div>
      ),
    },
    {
      icon: Scale,
      title: "5. User & Donor Rights",
      content: (
        <div className="space-y-4">
          <p>
            As BlooDonate operates as a Data Processor for our subscribing
            healthcare organizations (the Data Controllers), individual donors
            seeking to exercise their rights to access, correct, or delete their
            records must submit requests directly to the specific hospital or
            NGO that registered them. Organization Administrators possess full
            CRUD (Create, Read, Update, Delete) privileges to permanently
            expunge a donor record from the database upon request.
          </p>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* SEO Configuration */}
      <Helmet>
        <title>Privacy Policy | BlooDonate</title>
        <meta
          name="description"
          content="Review the BlooDonate Privacy Policy to understand our data collection, tenant isolation, and cryptographic standards for protecting organization and donor data."
        />
        <meta
          name="keywords"
          content="privacy policy, data protection, blood donation privacy, SaaS security, multi-tenant security, BlooDonate privacy"
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Privacy Policy | BlooDonate" />
        <meta
          property="og:description"
          content="Understand how BlooDonate protects and manages organizational and donor data."
        />
        <meta
          property="og:url"
          content="https://www.bloodonate.org/privacy-policy"
        />

        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Privacy Policy | BlooDonate" />
        <meta
          name="twitter:description"
          content="Understand how BlooDonate protects and manages organizational and donor data."
        />

        {/* Canonical Link */}
        <link
          rel="canonical"
          href="https://www.bloodonate.org/privacy-policy"
        />
      </Helmet>

      <div className="flex flex-col min-h-screen bg-slate-950 overflow-hidden pb-32">
        {/* --- Composition Header --- */}
        <section className="relative px-4 pt-24 pb-20 text-center border-b border-slate-800/80 bg-slate-900/20">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-175 h-87.5 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"
            aria-hidden="true"
          />

          <div className="container mx-auto max-w-4xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-slate-900 border border-slate-800 mb-8 shadow-2xl relative group">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl" />
              <ShieldCheck
                className="h-10 w-10 text-emerald-500 relative z-10"
                aria-hidden="true"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
              Privacy Policy
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              We are committed to securing your personal and medical
              information. Review our policies below to understand our data
              collection, tenant isolation, and cryptographic standards.
            </p>
            <div className="mt-10 inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-sm text-slate-400 shadow-inner">
              <span className="uppercase tracking-wider text-xs font-semibold">
                Last Updated:
              </span>
              <span className="font-medium text-slate-200">{lastUpdated}</span>
            </div>
          </div>
        </section>

        {/* --- Policy Document Body --- */}
        <div className="container mx-auto max-w-4xl px-4 pt-16 relative z-10 space-y-12">
          {/* Preamble */}
          <div className="prose prose-invert max-w-none text-slate-400 leading-relaxed text-lg">
            <p>
              Welcome to BlooDonate. This Privacy Policy governs your
              utilization of our SaaS infrastructure, public directory APIs, and
              affiliated services. By accessing our platform as an
              organizational tenant or querying our directory as a public user,
              you explicitly consent to the data processing practices detailed
              in this operational agreement.
            </p>
          </div>

          {/* Policy Nodes */}
          <div className="space-y-8">
            {policies.map((policy, index) => {
              const Icon = policy.icon;
              return (
                <Card
                  key={index}
                  className="border-slate-800/60 bg-slate-900/40 backdrop-blur-md hover:bg-slate-900/60 hover:border-slate-700/80 transition-all duration-300"
                >
                  <CardHeader className="border-b border-slate-800/50 pb-5 px-8 pt-8">
                    <CardTitle className="flex items-center gap-4 text-xl text-white tracking-tight">
                      <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                        <Icon
                          className="h-6 w-6 text-emerald-400"
                          aria-hidden="true"
                        />
                      </div>
                      {policy.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 text-slate-400 leading-relaxed text-base">
                    {policy.content}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* DPO Contact Node */}
          <div className="mt-16 p-8 rounded-3xl border border-slate-800 bg-slate-900/30 text-center relative overflow-hidden">
            <div
              className="absolute inset-0 bg-linear-to-t from-emerald-900/10 to-transparent"
              aria-hidden="true"
            />
            <h3 className="text-xl font-bold text-white mb-3 relative z-10">
              Questions regarding our cryptographic practices?
            </h3>
            <p className="text-slate-400 mb-6 max-w-xl mx-auto relative z-10">
              If you require technical clarification regarding this Privacy
              Policy or our infrastructure compliance, please escalate to our
              Data Protection Officer.
            </p>
            <a
              href="mailto:privacy@bloodonate.org"
              className="relative z-10 inline-flex items-center font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              privacy@bloodonate.org
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
