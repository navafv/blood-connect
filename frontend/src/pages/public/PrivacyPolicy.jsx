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
          <ul className="list-disc pl-5 space-y-2 text-slate-400">
            <li>
              <strong>Organization Data:</strong> When a hospital or NGO
              registers, we collect official contact details, physical
              addresses, and administrative credentials.
            </li>
            <li>
              <strong>Donor Data:</strong> Organizations input donor details
              into their secure tenant environment. This includes Full Name,
              Blood Group, Gender, Phone Number, Date of Birth, Location
              (City/District/Pincode), and historical donation dates.
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
            Protecting donor privacy is a core architectural principle of
            BloodConnect:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-400">
            <li>
              <strong>Contact Masking:</strong> Donor phone numbers are masked
              by default on the public directory. Full numbers are only revealed
              when a public user explicitly clicks to view them, which may be
              subject to rate-limiting to prevent automated scraping.
            </li>
            <li>
              <strong>Eligibility Abstraction:</strong> We do not publicly
              display a donor's medical deferral reason or exact past donation
              dates. We only output a generic "Available" or "Unavailable"
              status based on background eligibility calculations.
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
            multi-tenant architecture. This means that donor data is
            cryptographically isolated by organization. Staff from Hospital A
            cannot query, view, or modify the donor registry managed by NGO B.
            All data is encrypted at rest using industry-standard AES-256
            encryption.
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
            We do not sell, rent, or trade personal or medical information to
            third parties. Data is only disclosed under the following
            circumstances:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-400">
            <li>
              <strong>Public Directory:</strong> Basic, masked donor info (Name,
              Blood Group, Location) is displayed publicly for the sole purpose
              of facilitating emergency blood donations.
            </li>
            <li>
              <strong>Legal Requirements:</strong> If required by law, court
              order, or governmental authority within the jurisdiction of
              Kerala, India.
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
            Because BloodConnect acts as a data processor for our subscribing
            organizations, individual donors wishing to access, correct, or
            delete their records must contact the specific hospital or NGO that
            registered them. Organization Admins have full CRUD (Create, Read,
            Update, Delete) capabilities to immediately remove a donor from the
            system upon request.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 overflow-hidden pb-24">
      {/* --- Hero Section --- */}
      <section className="relative px-4 pt-20 pb-16 text-center border-b border-slate-800 bg-slate-900/30">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-75 bg-emerald-600/10 rounded-[100%] blur-[100px] pointer-events-none" />

        <div className="container mx-auto max-w-4xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-slate-900 border border-slate-800 mb-6 shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            We are committed to securing your personal and medical information.
            Read our policies below to understand how your data is collected,
            isolated, and protected.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-sm text-slate-300">
            <span>Last Updated:</span>
            <span className="font-semibold text-white">{lastUpdated}</span>
          </div>
        </div>
      </section>

      {/* --- Policy Content --- */}
      <div className="container mx-auto max-w-4xl px-4 pt-12 relative z-10 space-y-8">
        {/* Introduction */}
        <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed mb-12">
          <p>
            Welcome to BloodConnect. This Privacy Policy governs your use of our
            SaaS platform, public directory, and related services. By accessing
            our platform as an organization or searching our directory as a
            public user, you agree to the collection and use of information in
            relation to this policy.
          </p>
        </div>

        {/* Policy Sections (Cards) */}
        <div className="space-y-6">
          {policies.map((policy, index) => {
            const Icon = policy.icon;
            return (
              <Card
                key={index}
                className="border-slate-800 bg-slate-900/60 backdrop-blur-md"
              >
                <CardHeader className="border-b border-slate-800/50 pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl text-white">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                      <Icon className="h-5 w-5 text-emerald-400" />
                    </div>
                    {policy.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 text-slate-300 leading-relaxed text-sm sm:text-base">
                  {policy.content}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contact Info Box */}
        <div className="mt-12 p-6 rounded-2xl border border-slate-800 bg-slate-900/30 text-center">
          <h3 className="text-lg font-bold text-white mb-2">
            Questions about your privacy?
          </h3>
          <p className="text-slate-400 mb-4">
            If you have any questions or concerns regarding this Privacy Policy
            or our data practices, please contact our Data Protection Officer.
          </p>
          <a
            href="mailto:privacy@bloodconnect.example.com"
            className="inline-flex items-center font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            privacy@bloodconnect.example.com
          </a>
        </div>
      </div>
    </div>
  );
}
