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
            By accessing the BloodConnect public directory or registering as an
            Organization on our Software-as-a-Service (SaaS) platform, you agree
            to be bound by these Terms of Service. If you disagree with any part
            of the terms, you may not access the service.
          </p>
        </div>
      ),
    },
    {
      icon: ShieldAlert,
      title: "2. Medical & Emergency Disclaimer",
      content: (
        <div className="space-y-4">
          <p className="text-rose-400 font-medium">
            BloodConnect is a technology platform and data directory, NOT a
            healthcare provider or medical facility.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-400">
            <li>We do not collect, process, or store physical blood.</li>
            <li>
              We do not medically verify the eligibility of the donors listed;
              this is the strict responsibility of the registered hospitals and
              NGOs.
            </li>
            <li>
              In the event of a severe medical emergency, do not rely solely on
              this platform. Contact local emergency services or proceed to the
              nearest hospital immediately.
            </li>
          </ul>
        </div>
      ),
    },
    {
      icon: Building2,
      title: "3. Organization Responsibilities (Tenants)",
      content: (
        <div className="space-y-4">
          <p>
            Hospitals, Blood Banks, and NGOs utilizing our SaaS backend agree to
            the following:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-400">
            <li>
              <strong>Accuracy of Data:</strong> Organizations must ensure that
              donor records, especially last donation dates and deferral
              statuses, are kept accurate and up-to-date.
            </li>
            <li>
              <strong>Medical Vetting:</strong> Organizations are solely
              responsible for conducting necessary medical screenings and blood
              tests before accepting a donation from an individual found via
              this platform.
            </li>
            <li>
              <strong>Account Security:</strong> Organizations are responsible
              for safeguarding their login credentials and managing staff access
              levels appropriately.
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
            Individuals utilizing the public directory to find donors must
            adhere to the following:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-400">
            <li>
              <strong>No Harassment:</strong> Users may only contact donors for
              legitimate, immediate blood donation requests. Harassment,
              spamming, or soliciting donors for other purposes will result in
              IP bans and potential legal action.
            </li>
            <li>
              <strong>No Data Scraping:</strong> Automated scraping, mining, or
              extraction of donor contact information from our directory is
              strictly prohibited.
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
            To the maximum extent permitted by applicable law, BloodConnect and
            its developers shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages, or any loss of profits
            or revenues, whether incurred directly or indirectly, or any loss of
            data, use, goodwill, or other intangible losses, resulting from:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-400">
            <li>
              Your access to or use of or inability to access or use the
              service.
            </li>
            <li>
              Any conduct or content of any third party on the service,
              including the actions of donors or organizations.
            </li>
            <li>
              Any medical complications arising from blood transfusions
              facilitated through connections made on this platform.
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
            We reserve the right to modify or replace these Terms at any time.
            Material changes will be communicated via the platform. These terms
            shall be governed and construed in accordance with the laws of
            Kerala, India, without regard to its conflict of law provisions.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 overflow-hidden pb-24">
      {/* --- Hero Section --- */}
      <section className="relative px-4 pt-20 pb-16 text-center border-b border-slate-800 bg-slate-900/30">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-75 bg-blue-600/10 rounded-[100%] blur-[100px] pointer-events-none" />

        <div className="container mx-auto max-w-4xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-slate-900 border border-slate-800 mb-6 shadow-lg shadow-blue-500/10">
            <Scale className="h-8 w-8 text-blue-500" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Please read these terms carefully before using the BloodConnect
            platform. They govern your use of the directory and the SaaS
            backend.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-sm text-slate-300">
            <span>Effective Date:</span>
            <span className="font-semibold text-white">{lastUpdated}</span>
          </div>
        </div>
      </section>

      {/* --- Terms Content --- */}
      <div className="container mx-auto max-w-4xl px-4 pt-12 relative z-10 space-y-8">
        <div className="space-y-6">
          {terms.map((term, index) => {
            const Icon = term.icon;
            // Highlight the medical disclaimer card slightly
            const isDisclaimer = index === 1;

            return (
              <Card
                key={index}
                className={`bg-slate-900/60 backdrop-blur-md ${isDisclaimer ? "border-rose-500/30" : "border-slate-800"}`}
              >
                <CardHeader className="border-b border-slate-800/50 pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl text-white">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center border shrink-0 ${isDisclaimer ? "bg-rose-500/10 border-rose-500/20" : "bg-blue-500/10 border-blue-500/20"}`}
                    >
                      <Icon
                        className={`h-5 w-5 ${isDisclaimer ? "text-rose-400" : "text-blue-400"}`}
                      />
                    </div>
                    {term.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 text-slate-300 leading-relaxed text-sm sm:text-base">
                  {term.content}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contact Info Box */}
        <div className="mt-12 p-6 rounded-2xl border border-slate-800 bg-slate-900/30 text-center">
          <h3 className="text-lg font-bold text-white mb-2">Legal Inquiries</h3>
          <p className="text-slate-400 mb-4">
            If you have any questions about these Terms of Service, please
            contact our legal team.
          </p>
          <a
            href="mailto:legal@bloodconnect.example.com"
            className="inline-flex items-center font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            legal@bloodconnect.example.com
          </a>
        </div>
      </div>
    </div>
  );
}
