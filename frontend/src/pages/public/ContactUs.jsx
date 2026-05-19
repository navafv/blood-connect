import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
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
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      // Send the public message to the Django backend
      await api.post("/public/contact/", formData);

      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" }); // Reset form

      // Reset back to idle after 5 seconds
      setTimeout(() => {
        setStatus("idle");
      }, 5000);
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send your message. Please try again later.");
      setStatus("idle");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 overflow-hidden pb-24">
      {/* --- Hero Section --- */}
      <section className="relative px-4 pt-20 pb-12 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-75 bg-blue-600/10 rounded-[100%] blur-[100px] pointer-events-none" />

        <div className="container mx-auto max-w-4xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-slate-900 border border-slate-800 mb-6 shadow-lg shadow-blue-500/10">
            <MessageSquare className="h-8 w-8 text-blue-500" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Get in Touch
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Have questions about registering your organization, or need help
            navigating the directory? Our team is here to assist you.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          {/* --- Left Column: Contact Information --- */}
          <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-left-8 duration-700 delay-100">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                Contact Information
              </h2>
              <div className="space-y-6">
                {/* Email Info */}
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Email Us</h3>
                    <p className="text-sm text-slate-400 mb-1">
                      For general inquiries and support:
                    </p>
                    <a
                      href="mailto:support@bloodconnect.example.com"
                      className="text-rose-400 hover:text-rose-300 font-medium transition-colors"
                    >
                      support@bloodconnect.example.com
                    </a>
                  </div>
                </div>

                {/* Phone Info */}
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    <Phone className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Call Us</h3>
                    <p className="text-sm text-slate-400 mb-1">
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

                {/* Location Info */}
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">
                      Headquarters
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      BloodConnect SaaS Technologies
                      <br />
                      Munderi, Kannur
                      <br />
                      Kerala, India 670591
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Notice */}
            <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/5 mt-8">
              <div className="flex items-center gap-3 text-amber-500 mb-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <h3 className="font-semibold">Medical Emergency?</h3>
              </div>
              <p className="text-sm text-amber-200/70 leading-relaxed">
                BloodConnect is a directory and software provider, not a medical
                facility. We do not stock blood. In case of a severe medical
                emergency, please dial emergency services immediately or head to
                your nearest hospital.
              </p>
            </div>
          </div>

          {/* --- Right Column: Contact Form --- */}
          <div className="lg:col-span-3 animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
            <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-2xl relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none" />

              {status === "success" ? (
                /* Success State */
                <CardContent className="p-12 flex flex-col items-center justify-center text-center h-full min-h-100 animate-in fade-in zoom-in-95">
                  <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-6">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    Message Sent!
                  </h3>
                  <p className="text-slate-400 max-w-sm mx-auto">
                    Thank you for reaching out. A member of our support team
                    will get back to you at <strong>{formData.email}</strong>{" "}
                    within 24 hours.
                  </p>
                </CardContent>
              ) : (
                /* Form State */
                <>
                  <CardHeader className="border-b border-slate-800/50 pb-6 px-8 pt-8">
                    <CardTitle className="text-2xl text-white">
                      Send a Message
                    </CardTitle>
                    <p className="text-sm text-slate-400 mt-2">
                      Fill out the form below and we'll respond as soon as
                      possible.
                    </p>
                  </CardHeader>

                  <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {error && (
                        <div className="flex items-center gap-2 p-4 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                          <AlertCircle className="h-5 w-5 shrink-0" />
                          <p>{error}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-300">
                            Your Name *
                          </label>
                          <Input
                            name="name"
                            placeholder="John Doe"
                            className="bg-slate-950/50"
                            value={formData.name}
                            onChange={handleChange}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-300">
                            Email Address *
                          </label>
                          <Input
                            type="email"
                            name="email"
                            placeholder="john@example.com"
                            className="bg-slate-950/50"
                            value={formData.email}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                          Subject *
                        </label>
                        <Select
                          name="subject"
                          className="bg-slate-950/50"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                        >
                          <option value="" disabled>
                            Select a topic
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

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                          Message *
                        </label>
                        <textarea
                          name="message"
                          placeholder="How can we help you today?"
                          rows={5}
                          className="flex w-full rounded-md border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors resize-none"
                          value={formData.message}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="pt-2">
                        <Button
                          type="submit"
                          variant="primary"
                          className="w-full sm:w-auto px-8 gap-2"
                          disabled={status === "loading"}
                        >
                          {status === "loading" ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Sending Message...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Send Message
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
  );
}
