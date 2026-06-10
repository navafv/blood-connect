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
        <title>Contact Us | BlooDonate - Get in Touch</title>
        <meta
          name="description"
          content="Have questions about BlooDonate, registering your organization, or need technical support? Contact our administrative team via email, phone, or our online form."
        />
        <meta
          name="keywords"
          content="contact BlooDonate, blood donation support, technical support, BlooDonate email, BlooDonate phone number, NGO partnership, blood bank directory help"
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Contact Us | BlooDonate" />
        <meta
          property="og:description"
          content="Reach out to the BlooDonate team for support, organization registration, or partnership inquiries."
        />
        {/* Replace with your actual deployed URL */}
        <meta property="og:url" content="https://www.bloodonate.org/contact" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact Us | BlooDonate" />
        <meta
          name="twitter:description"
          content="Reach out to the BlooDonate team for support, organization registration, or partnership inquiries."
        />

        {/* Canonical Link */}
        <link rel="canonical" href="https://www.bloodonate.org/contact" />
      </Helmet>

      <div className="flex flex-col min-h-screen bg-slate-950 overflow-hidden pb-24">
        {/* --- Composition Header --- */}
        <section className="relative px-4 pt-20 pb-16 text-center">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-75 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse duration-3000"
            aria-hidden="true"
          />

          <div className="container mx-auto max-w-4xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-slate-900 border border-slate-800 mb-8 shadow-2xl relative group">
              <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl group-hover:bg-blue-500/30 transition-colors duration-500" />
              <MessageSquare
                className="h-10 w-10 text-blue-500 relative z-10 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                aria-hidden="true"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
              Get in Touch
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
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
                <h2 className="text-2xl font-bold text-white mb-8 tracking-tight">
                  Contact Information
                </h2>
                <div className="space-y-8">
                  {/* Email Node */}
                  <div className="group flex items-start gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 group-hover:border-rose-500/30 group-hover:bg-rose-500/5 transition-all duration-300 shadow-lg">
                      <Mail
                        className="h-6 w-6 text-rose-500 group-hover:scale-110 transition-transform duration-300"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg mb-1">
                        Email Us
                      </h3>
                      <p className="text-sm text-slate-400 mb-2">
                        For general inquiries and support:
                      </p>
                      <a
                        href="mailto:support@bloodonate.org"
                        className="text-rose-400 hover:text-rose-300 font-medium transition-colors"
                      >
                        support@bloodonate.org
                      </a>
                    </div>
                  </div>

                  {/* Telephony Node */}
                  <div className="group flex items-start gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 group-hover:border-blue-500/30 group-hover:bg-blue-500/5 transition-all duration-300 shadow-lg">
                      <Phone
                        className="h-6 w-6 text-blue-500 group-hover:scale-110 transition-transform duration-300"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg mb-1">
                        Call Us
                      </h3>
                      <p className="text-sm text-slate-400 mb-2">
                        Mon-Fri from 9am to 6pm IST.
                      </p>
                      <a
                        href="tel:+919876543210"
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      >
                        +91 98765 43210
                      </a>
                    </div>
                  </div>

                  {/* Spatial Node */}
                  <div className="group flex items-start gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/5 transition-all duration-300 shadow-lg">
                      <MapPin
                        className="h-6 w-6 text-emerald-500 group-hover:scale-110 transition-transform duration-300"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg mb-1">
                        Headquarters
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        BlooDonate SaaS Technologies
                        <br />
                        Munderi, Kannur
                        <br />
                        Kerala, India 670591
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Disclaimer Boundary */}
              <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 shadow-inner">
                <h3 className="font-semibold text-amber-500 mb-2 flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                  Medical Emergency?
                </h3>
                <p className="text-sm text-amber-200/70 leading-relaxed">
                  BlooDonate is a directory and software provider, not a medical
                  facility. We do not stock blood. In case of a severe medical
                  emergency, please dial emergency services immediately or head
                  to your nearest hospital.
                </p>
              </div>
            </div>

            {/* Interactive Form Subgraph */}
            <div className="lg:col-span-3 animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
              <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-2xl relative overflow-hidden rounded-3xl">
                {/* Form Ambient Highlight */}
                <div
                  className="absolute -right-20 -top-20 w-80 h-80 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none"
                  aria-hidden="true"
                />

                {status === "success" ? (
                  <CardContent className="p-16 flex flex-col items-center justify-center text-center h-full min-h-125 animate-in fade-in zoom-in-95 duration-500">
                    <div className="h-24 w-24 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-8 relative">
                      <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-md animate-pulse" />
                      <CheckCircle2
                        className="h-12 w-12 text-emerald-500 relative z-10"
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="text-3xl font-extrabold text-white mb-4 tracking-tight">
                      Message Dispatched
                    </h3>
                    <p className="text-slate-400 max-w-md mx-auto text-lg leading-relaxed">
                      Thank you for reaching out. A member of our support
                      engineering team will contact you at{" "}
                      <strong className="text-slate-200">
                        {formData.email}
                      </strong>{" "}
                      within 24 hours.
                    </p>
                  </CardContent>
                ) : (
                  <>
                    <CardHeader className="border-b border-slate-800/50 pb-8 px-10 pt-10 relative z-10">
                      <CardTitle className="text-3xl text-white tracking-tight">
                        Send a Message
                      </CardTitle>
                      <p className="text-slate-400 mt-2 text-base">
                        Provide the details below and we will route your inquiry
                        to the appropriate department.
                      </p>
                    </CardHeader>

                    <CardContent className="p-10 relative z-10">
                      <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                              Your Name <span className="text-rose-500">*</span>
                            </label>
                            <Input
                              name="name"
                              placeholder="John Doe"
                              className="bg-slate-950/50 border-slate-700 focus:border-rose-500 focus:ring-rose-500/20 h-12 transition-all"
                              value={formData.name}
                              onChange={handleChange}
                              required
                            />
                          </div>

                          <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                              Email Address{" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <Input
                              type="email"
                              name="email"
                              placeholder="john@example.com"
                              className="bg-slate-950/50 border-slate-700 focus:border-rose-500 focus:ring-rose-500/20 h-12 transition-all"
                              value={formData.email}
                              onChange={handleChange}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                            Subject <span className="text-rose-500">*</span>
                          </label>
                          <Select
                            name="subject"
                            className="bg-slate-950/50 border-slate-700 focus:border-rose-500 focus:ring-rose-500/20 h-12 transition-all"
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
                          <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                            Message Body{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <textarea
                            name="message"
                            placeholder="Please provide specifics regarding your request..."
                            rows={5}
                            className="flex w-full rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-base text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all resize-none shadow-inner"
                            value={formData.message}
                            onChange={handleChange}
                            required
                          />
                        </div>

                        <div className="pt-4">
                          <Button
                            type="submit"
                            variant="primary"
                            className="w-full sm:w-auto px-10 py-6 text-base font-semibold gap-3 rounded-full hover:shadow-[0_0_20px_rgba(225,29,72,0.3)] transition-all duration-300"
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
