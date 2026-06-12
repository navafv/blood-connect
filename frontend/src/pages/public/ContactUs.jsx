import { useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "../../components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import api from "../../lib/axios";

export default function ContactUs() {
  const [status, setStatus] = useState("idle"); // 'idle' | 'loading' | 'success'
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      await api.post("/public/contact/", formData);

      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      toast.success("Message dispatched successfully.");

      // Automatic state restoration
      setTimeout(() => {
        setStatus("idle");
      }, 6000);
    } catch (err) {
      console.error("Transmission Failure:", err);
      toast.error(
        "Failed to route message. Please verify network connectivity.",
      );
      setStatus("idle");
    }
  };

  return (
    <>
      {/* SEO Configuration */}
      <Helmet>
        <title>Contact Us | Bloodonate - Get in Touch</title>
        <meta
          name="description"
          content="Have questions about Bloodonate, registering your organization, or need technical support? Contact our administrative team via email, phone, or our online form."
        />
        <meta
          name="keywords"
          content="contact Bloodonate, blood donation support, technical support, Bloodonate email, Bloodonate phone number, NGO partnership, blood bank directory help"
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Contact Us | Bloodonate" />
        <meta
          property="og:description"
          content="Reach out to the Bloodonate team for support, organization registration, or partnership inquiries."
        />
        {/* Replace with your actual deployed URL */}
        <meta property="og:url" content="https://www.bloodonate.org/contact" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact Us | Bloodonate" />
        <meta
          name="twitter:description"
          content="Reach out to the Bloodonate team for support, organization registration, or partnership inquiries."
        />

        {/* Canonical Link */}
        <link rel="canonical" href="https://www.bloodonate.org/contact" />
      </Helmet>

      <div className="flex flex-col min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-950 overflow-hidden pb-24">
        {/* --- Composition Header --- */}
        <section className="relative px-4 pt-20 pb-16 text-center">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-75 rounded-full blur-[120px] pointer-events-none animate-pulse duration-3000 transition-colors bg-blue-500/10 dark:bg-blue-600/15"
            aria-hidden="true"
          />

          <div className="container mx-auto max-w-4xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl mb-8 shadow-md relative group transition-colors duration-300 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:shadow-2xl">
              <div className="absolute inset-0 rounded-2xl blur-xl transition-colors duration-500 bg-blue-100 group-hover:bg-blue-200 dark:bg-blue-500/20 dark:group-hover:bg-blue-500/30" />
              <MessageSquare
                className="h-10 w-10 relative z-10 transition-colors duration-300 text-blue-600 drop-shadow-[0_0_10px_rgba(37,99,235,0.3)] dark:text-blue-500 dark:drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                aria-hidden="true"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 transition-colors duration-300 text-slate-900 dark:text-white">
              Get in Touch
            </h1>
            <p className="text-lg max-w-2xl mx-auto leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
              Have questions about registering your organization, or need help
              navigating the directory? Our administrative team is here to
              assist.
            </p>
          </div>
        </section>

        {/* --- Main Content Grid --- */}
        <div className="container mx-auto max-w-6xl px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-start">
            {/* Informational Subgraph */}
            <div className="lg:col-span-2 space-y-10 animate-in fade-in slide-in-from-left-8 duration-700 delay-100">
              <div>
                <h2 className="text-2xl font-bold mb-8 tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                  Contact Information
                </h2>
                <div className="space-y-8">
                  {/* Email Node */}
                  <div className="group flex items-start gap-5">
                    <div className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm border bg-white border-slate-200 group-hover:border-rose-300 group-hover:bg-rose-50 dark:bg-slate-900 dark:border-slate-800 dark:group-hover:border-rose-500/30 dark:group-hover:bg-rose-500/5 dark:shadow-lg">
                      <Mail
                        className="h-6 w-6 transition-transform duration-300 group-hover:scale-110 text-rose-600 dark:text-rose-500"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1 transition-colors duration-300 text-slate-900 dark:text-white">
                        Email Us
                      </h3>
                      <p className="text-sm mb-2 transition-colors duration-300 text-slate-600 dark:text-slate-400">
                        For general inquiries and support:
                      </p>
                      <a
                        href="mailto:support@bloodonate.org"
                        className="font-medium transition-colors text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                      >
                        support@bloodonate.org
                      </a>
                    </div>
                  </div>

                  {/* Telephony Node */}
                  <div className="group flex items-start gap-5">
                    <div className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm border bg-white border-slate-200 group-hover:border-blue-300 group-hover:bg-blue-50 dark:bg-slate-900 dark:border-slate-800 dark:group-hover:border-blue-500/30 dark:group-hover:bg-blue-500/5 dark:shadow-lg">
                      <Phone
                        className="h-6 w-6 transition-transform duration-300 group-hover:scale-110 text-blue-600 dark:text-blue-500"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1 transition-colors duration-300 text-slate-900 dark:text-white">
                        Call Us
                      </h3>
                      <p className="text-sm mb-2 transition-colors duration-300 text-slate-600 dark:text-slate-400">
                        Mon-Fri from 9am to 6pm IST.
                      </p>
                      <a
                        href="tel:+918606240600"
                        className="font-medium transition-colors text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        +91 86062 40600
                      </a>
                    </div>
                  </div>

                  {/* Spatial Node */}
                  <div className="group flex items-start gap-5">
                    <div className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm border bg-white border-slate-200 group-hover:border-emerald-300 group-hover:bg-emerald-50 dark:bg-slate-900 dark:border-slate-800 dark:group-hover:border-emerald-500/30 dark:group-hover:bg-emerald-500/5 dark:shadow-lg">
                      <MapPin
                        className="h-6 w-6 transition-transform duration-300 group-hover:scale-110 text-emerald-600 dark:text-emerald-500"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1 transition-colors duration-300 text-slate-900 dark:text-white">
                        Headquarters
                      </h3>
                      <p className="text-sm leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
                        Bloodonate SaaS Technologies
                        <br />
                        Airport Road, Varam, Kannur
                        <br />
                        Kerala, India 670594
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Disclaimer Boundary */}
              <div className="p-6 rounded-2xl border shadow-inner transition-colors duration-300 bg-amber-50 border-amber-200 dark:border-amber-500/20 dark:bg-amber-500/5">
                <h3 className="font-semibold mb-2 flex items-center gap-2 transition-colors duration-300 text-amber-600 dark:text-amber-500">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                  Medical Emergency?
                </h3>
                <p className="text-sm leading-relaxed transition-colors duration-300 text-amber-800 dark:text-amber-200/70">
                  Bloodonate is a directory and software provider, not a medical
                  facility. We do not stock blood. In case of a severe medical
                  emergency, please dial emergency services immediately or head
                  to your nearest hospital.
                </p>
              </div>
            </div>

            {/* Interactive Form Subgraph */}
            <div className="lg:col-span-3 animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
              <Card className="backdrop-blur-xl shadow-xl relative overflow-hidden rounded-3xl transition-colors duration-300 bg-white/60 border-slate-200 dark:border-slate-800 dark:bg-slate-900/40 dark:shadow-2xl">
                {/* Form Ambient Highlight */}
                <div
                  className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-[100px] pointer-events-none transition-colors duration-300 bg-rose-500/5 dark:bg-rose-500/10"
                  aria-hidden="true"
                />

                {status === "success" ? (
                  <CardContent className="p-16 flex flex-col items-center justify-center text-center h-full min-h-125 animate-in fade-in zoom-in-95 duration-500">
                    <div className="h-24 w-24 rounded-full flex items-center justify-center border mb-8 relative transition-colors duration-300 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                      <div className="absolute inset-0 rounded-full blur-md animate-pulse transition-colors duration-300 bg-emerald-200/50 dark:bg-emerald-500/20" />
                      <CheckCircle2
                        className="h-12 w-12 relative z-10 transition-colors duration-300 text-emerald-600 dark:text-emerald-500"
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="text-3xl font-extrabold mb-4 tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                      Message Dispatched
                    </h3>
                    <p className="max-w-md mx-auto text-lg leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      Thank you for reaching out. A member of our support
                      engineering team will contact you at{" "}
                      <strong className="transition-colors duration-300 text-slate-900 dark:text-slate-200">
                        {formData.email}
                      </strong>{" "}
                      within 24 hours.
                    </p>
                  </CardContent>
                ) : (
                  <>
                    <CardHeader className="border-b pb-8 px-10 pt-10 relative z-10 transition-colors duration-300 border-slate-200 dark:border-slate-800/50">
                      <CardTitle className="text-3xl tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                        Send a Message
                      </CardTitle>
                      <p className="mt-2 text-base transition-colors duration-300 text-slate-600 dark:text-slate-400">
                        Provide the details below and we will route your inquiry
                        to the appropriate department.
                      </p>
                    </CardHeader>

                    <CardContent className="p-10 relative z-10">
                      <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="text-sm font-semibold uppercase tracking-wider transition-colors duration-300 text-slate-700 dark:text-slate-300">
                              Your Name <span className="text-rose-500">*</span>
                            </label>
                            <Input
                              name="name"
                              placeholder="John Doe"
                              value={formData.name}
                              onChange={handleChange}
                              required
                            />
                          </div>

                          <div className="space-y-3">
                            <label className="text-sm font-semibold uppercase tracking-wider transition-colors duration-300 text-slate-700 dark:text-slate-300">
                              Email Address{" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <Input
                              type="email"
                              name="email"
                              placeholder="john@example.com"
                              value={formData.email}
                              onChange={handleChange}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-semibold uppercase tracking-wider transition-colors duration-300 text-slate-700 dark:text-slate-300">
                            Subject <span className="text-rose-500">*</span>
                          </label>
                          <Select
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            required
                          >
                            <option value="" disabled>
                              Select inquiry classification
                            </option>
                            <option value="organization_registration">
                              Organization Registration Help
                            </option>
                            <option value="technical_support">
                              Technical Support (Platform Bug)
                            </option>
                            <option value="billing">
                              Billing & Subscription
                            </option>
                            <option value="partnership">
                              Partnership / NGO Inquiry
                            </option>
                            <option value="other">
                              Other / General Question
                            </option>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-semibold uppercase tracking-wider transition-colors duration-300 text-slate-700 dark:text-slate-300">
                            Message Body{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <textarea
                            name="message"
                            placeholder="Please provide specifics regarding your request..."
                            rows={5}
                            className="flex w-full rounded-xl border px-4 py-3 text-base shadow-sm transition-all resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 dark:bg-slate-950/50 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-600"
                            value={formData.message}
                            onChange={handleChange}
                            required
                          />
                        </div>

                        <div className="pt-4">
                          <Button
                            type="submit"
                            variant="primary"
                            className="w-full sm:w-auto px-10 py-6 text-base font-semibold gap-3 rounded-full shadow-md hover:shadow-lg transition-all duration-300 dark:hover:shadow-[0_0_20px_rgba(225,29,72,0.3)]"
                            disabled={status === "loading"}
                          >
                            {status === "loading" ? (
                              <>
                                <Loader2
                                  className="h-5 w-5 animate-spin"
                                  aria-hidden="true"
                                />
                                Transmitting...
                              </>
                            ) : (
                              <>
                                <Send className="h-5 w-5" aria-hidden="true" />
                                Submit Inquiry
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
