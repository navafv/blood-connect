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
  const lastUpdated = "June 11, 2026";

  const policies = [
    {
      icon: FileText,
      title: "1. Information We Collect",
      content: (
        <div className="space-y-4">
          <p>We collect information primarily in two categories:</p>
          <ul className="list-disc pl-5 space-y-3 transition-colors duration-300 text-slate-600 dark:text-slate-400">
            <li>
              <strong className="transition-colors duration-300 text-slate-900 dark:text-slate-200">
                Organization Data:
              </strong>{" "}
              When a healthcare organization (hospital, blood bank, clinic, or
              NGO) registers, we collect official contact details, physical
              addresses, and administrative credentials required for tenant
              provisioning.
            </li>
            <li>
              <strong className="transition-colors duration-300 text-slate-900 dark:text-slate-200">
                Donor Data:
              </strong>{" "}
              Organizations input donor details into their secure tenant
              environment. This includes Blood Group, Gender, Date of Birth,
              Location (City/District), historical donation timelines, and
              medical deferral status.
              <br />
              <br />
              <span className="font-medium transition-colors duration-300 text-emerald-600 dark:text-emerald-400">
                Important Note:
              </span>{" "}
              We do not collect or expose donor phone numbers to the public
              directory. All public-facing contact data utilizes the managing
              Organization's contact details.
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
            Bloodonate system:
          </p>
          <ul className="list-disc pl-5 space-y-3 transition-colors duration-300 text-slate-600 dark:text-slate-400">
            <li>
              <strong className="transition-colors duration-300 text-slate-900 dark:text-slate-200">
                Organizational Proxy Routing:
              </strong>{" "}
              Donor personal phone numbers and full identifying names are
              strictly isolated from the public directory. If a patient requires
              a donor, the system routes the connection strictly to the verified
              healthcare organization managing that donor.
            </li>
            <li>
              <strong className="transition-colors duration-300 text-slate-900 dark:text-slate-200">
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
            query, view, or modify the donor registry managed by Blood Bank B.
            All persistent data is encrypted at rest using industry-standard
            AES-256 protocols.
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
          <ul className="list-disc pl-5 space-y-3 transition-colors duration-300 text-slate-600 dark:text-slate-400">
            <li>
              <strong className="transition-colors duration-300 text-slate-900 dark:text-slate-200">
                Public Directory:
              </strong>{" "}
              Basic, masked donor attributes (Anonymized Name, Blood Group,
              Region) are surfaced publicly for the sole operational purpose of
              facilitating emergency blood donations via the managing
              organization.
            </li>
            <li>
              <strong className="transition-colors duration-300 text-slate-900 dark:text-slate-200">
                Legal Requirements:
              </strong>{" "}
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
            As Bloodonate operates as a Data Processor for our subscribing
            healthcare organizations (the Data Controllers), individual donors
            seeking to exercise their rights to access, correct, or remove their
            records must submit requests directly to the specific organization
            that registered them. Organization Administrators possess the
            privileges to securely deactivate and remove a donor record from the
            active directory upon request.
          </p>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* SEO Configuration */}
      <Helmet>
        <title>Privacy Policy | Bloodonate</title>
        <meta
          name="description"
          content="Review the Bloodonate Privacy Policy to understand our data collection, proxy routing architecture, and cryptographic standards for protecting donor data."
        />
        <meta
          name="keywords"
          content="privacy policy, data protection, blood donation privacy, SaaS security, multi-tenant security, proxy routing"
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Privacy Policy | Bloodonate" />
        <meta
          property="og:description"
          content="Understand how Bloodonate protects and manages organizational and donor data via secure proxy routing."
        />
        <meta
          property="og:url"
          content="https://www.bloodonate.org/privacy-policy"
        />

        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Privacy Policy | Bloodonate" />
        <meta
          name="twitter:description"
          content="Understand how Bloodonate protects and manages organizational and donor data via secure proxy routing."
        />

        {/* Canonical Link */}
        <link
          rel="canonical"
          href="https://www.bloodonate.org/privacy-policy"
        />
      </Helmet>

      <div className="flex flex-col min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-950 overflow-hidden pb-32">
        {/* --- Composition Header --- */}
        <section className="relative px-4 pt-24 pb-20 text-center border-b transition-colors duration-300 bg-white border-slate-200 dark:bg-slate-900/20 dark:border-slate-800/80">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full blur-[120px] pointer-events-none transition-colors duration-300 bg-emerald-500/10 dark:bg-emerald-600/10"
            aria-hidden="true"
          />

          <div className="container mx-auto max-w-4xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl mb-8 shadow-md relative group transition-colors duration-300 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:shadow-2xl">
              <div className="absolute inset-0 rounded-2xl blur-xl transition-colors duration-300 bg-emerald-100 dark:bg-emerald-500/20" />
              <ShieldCheck
                className="h-10 w-10 relative z-10 transition-colors duration-300 text-emerald-600 dark:text-emerald-500"
                aria-hidden="true"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 transition-colors duration-300 text-slate-900 dark:text-white">
              Privacy Policy
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
              We are committed to securing your personal and medical
              information. Review our policies below to understand our data
              collection, tenant isolation, and cryptographic standards.
            </p>
            <div className="mt-10 inline-flex items-center gap-3 px-5 py-2.5 rounded-full border text-sm shadow-inner transition-colors duration-300 bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-900/80 dark:border-slate-700/80 dark:text-slate-400">
              <span className="uppercase tracking-wider text-xs font-semibold">
                Last Updated:
              </span>
              <span className="font-medium transition-colors duration-300 text-slate-900 dark:text-slate-200">
                {lastUpdated}
              </span>
            </div>
          </div>
        </section>

        {/* --- Policy Document Body --- */}
        <div className="container mx-auto max-w-4xl px-4 pt-16 relative z-10 space-y-12">
          {/* Preamble */}
          <div className="prose prose-invert max-w-none leading-relaxed text-lg transition-colors duration-300 text-slate-600 dark:text-slate-400">
            <p>
              Welcome to Bloodonate. This Privacy Policy governs your
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
                  className="relative overflow-hidden backdrop-blur-md transition-all duration-300 shadow-sm dark:shadow-none bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-900/40 dark:border-slate-800/60 dark:hover:bg-slate-900/60 dark:hover:border-slate-700/80"
                >
                  <CardHeader className="border-b pb-5 px-8 pt-8 transition-colors duration-300 border-slate-200 dark:border-slate-800/50">
                    <CardTitle className="flex items-center gap-4 text-xl tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center border shrink-0 transition-colors duration-300 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                        <Icon
                          className="h-6 w-6 transition-colors duration-300 text-emerald-600 dark:text-emerald-400"
                          aria-hidden="true"
                        />
                      </div>
                      {policy.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 leading-relaxed text-base transition-colors duration-300 text-slate-600 dark:text-slate-400">
                    {policy.content}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* DPO Contact Node */}
          <div className="mt-16 p-8 rounded-3xl border text-center relative overflow-hidden transition-colors duration-300 bg-slate-50 border-slate-200 dark:border-slate-800 dark:bg-slate-900/30">
            <div
              className="absolute inset-0 bg-linear-to-t transition-colors duration-300 from-emerald-100 to-transparent dark:from-emerald-900/10"
              aria-hidden="true"
            />
            <h3 className="text-xl font-bold mb-3 relative z-10 transition-colors duration-300 text-slate-900 dark:text-white">
              Questions regarding our cryptographic practices?
            </h3>
            <p className="mb-6 max-w-xl mx-auto relative z-10 transition-colors duration-300 text-slate-600 dark:text-slate-400">
              If you require technical clarification regarding this Privacy
              Policy or our infrastructure compliance, please escalate to our
              Data Protection Officer.
            </p>
            <a
              href="mailto:privacy@bloodonate.org"
              className="relative z-10 inline-flex items-center font-semibold transition-colors duration-300 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              privacy@bloodonate.org
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
