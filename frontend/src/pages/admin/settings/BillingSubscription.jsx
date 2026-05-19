import { useState, useEffect } from "react";
import {
  CreditCard,
  Zap,
  CheckCircle2,
  Download,
  Receipt,
  ShieldCheck,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import api from "../../../lib/axios";

const pricingPlans = [
  {
    id: "FREE",
    name: "Free (NGO)",
    price: "₹0",
    description: "Basic features for small volunteer groups.",
    features: [
      "Up to 100 Donors",
      "1 Staff Account",
      "Public Directory Listing",
      "Community Support",
    ],
  },
  {
    id: "BASIC",
    name: "Basic",
    price: "₹1,999",
    description: "Perfect for local clinics and small blood banks.",
    features: [
      "Up to 1,000 Donors",
      "5 Staff Accounts",
      "Priority Directory Listing",
      "Email Support",
    ],
  },
  {
    id: "PREMIUM",
    name: "Premium",
    price: "₹4,999",
    description: "Unlimited capacity for major hospitals.",
    features: [
      "Unlimited Donors",
      "Unlimited Staff",
      "Analytics Dashboard",
      "24/7 Phone Support",
    ],
  },
];

// Placeholder for future Stripe/Razorpay integration
const invoices = [
  {
    id: "INV-2026-005",
    date: "May 15, 2026",
    amount: "₹4,999",
    status: "PAID",
  },
  {
    id: "INV-2026-004",
    date: "Apr 15, 2026",
    amount: "₹4,999",
    status: "PAID",
  },
  {
    id: "INV-2026-003",
    date: "Mar 15, 2026",
    amount: "₹4,999",
    status: "PAID",
  },
];

export default function BillingSubscription() {
  const [currentPlanId, setCurrentPlanId] = useState("FREE");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  // 1. Fetch the organization's current plan on load
  useEffect(() => {
    const fetchCurrentPlan = async () => {
      try {
        const response = await api.get("/tenant/organization/");
        setCurrentPlanId(response.data.plan_tier || "FREE");
      } catch (err) {
        console.error("Failed to fetch plan:", err);
        setError("Could not load billing details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCurrentPlan();
  }, []);

  // 2. Handle Plan Upgrade/Downgrade
  const handlePlanChange = async (planId) => {
    if (planId === currentPlanId) return;

    setIsProcessing(planId);
    setSuccessMessage("");
    setError("");

    try {
      await api.patch("/tenant/billing/plan/", { plan_tier: planId });
      setCurrentPlanId(planId);
      setSuccessMessage(
        `Successfully updated subscription to the ${planId} plan.`,
      );
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      console.error(err);
      setError("Failed to update subscription plan. Please try again.");
    } finally {
      setIsProcessing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  const activePlanDetails =
    pricingPlans.find((p) => p.id === currentPlanId) || pricingPlans[0];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-rose-500" />
          Billing & Subscription
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your organization's subscription plan and payment methods.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* --- Section 1: Current Overview --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Plan Card */}
        <Card className="border-rose-500/30 bg-slate-900/60 backdrop-blur-md relative overflow-hidden">
          <div className="absolute -right-20 -top-20 h-40 w-40 bg-rose-500/20 rounded-full blur-[50px] pointer-events-none" />

          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">
                  Current Plan
                </p>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  {activePlanDetails.name}
                  <Badge variant="success" className="ml-2">
                    Active
                  </Badge>
                </h3>
              </div>
              <div className="h-10 w-10 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/20">
                <Zap className="h-5 w-5 text-rose-500" />
              </div>
            </div>

            <div className="space-y-1 mb-6">
              <p className="text-3xl font-bold text-white">
                {activePlanDetails.price}
                <span className="text-sm font-normal text-slate-400">
                  {" "}
                  / month
                </span>
              </p>
              <p className="text-sm text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                No active billing cycle (Development Mode)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Card */}
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <CardContent className="p-6 flex flex-col h-full justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">
                    Payment Method
                  </p>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 text-slate-500 italic">
                    Not Configured
                  </h3>
                </div>
                <div className="h-10 w-10 bg-slate-800 rounded-md flex items-center justify-center border border-slate-700">
                  <CreditCard className="h-5 w-5 text-slate-500" />
                </div>
              </div>
              <p className="text-sm text-slate-400 mb-6">
                Payment gateway integration (Stripe/Razorpay) is required to
                process automated billing.
              </p>
            </div>

            <Button variant="secondary" className="w-full sm:w-auto" disabled>
              Update Payment Method
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5" />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      {/* --- Section 2: Available Plans --- */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2">
          Available Plans
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricingPlans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col transition-all duration-300 ${
                  isCurrent
                    ? "border-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.1)] bg-slate-900/80"
                    : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                }`}
              >
                {isCurrent && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Badge
                      variant="primary"
                      className="px-3 py-1 shadow-lg shadow-rose-500/20"
                    >
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pt-8 pb-4">
                  <CardTitle className="text-xl text-white">
                    {plan.name}
                  </CardTitle>
                  <p className="text-sm text-slate-400 mt-2 h-10">
                    {plan.description}
                  </p>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-white">
                      {plan.price}
                    </span>
                    <span className="text-slate-500">/mo</span>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-sm text-slate-300"
                      >
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={isCurrent ? "secondary" : "primary"}
                    className="w-full"
                    disabled={isCurrent || isProcessing !== null}
                    onClick={() => handlePlanChange(plan.id)}
                  >
                    {isProcessing === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Processing
                      </>
                    ) : isCurrent ? (
                      "Active"
                    ) : (
                      "Switch Plan"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* --- Section 3: Billing History --- */}
      <div className="opacity-60 pointer-events-none">
        <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2 flex items-center justify-between">
          Billing History
          <Badge variant="default">Coming Soon</Badge>
        </h3>
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Invoice ID</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-slate-500" />
                      {invoice.id}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{invoice.date}</td>
                    <td className="px-6 py-4">{invoice.amount}</td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="success"
                        className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      >
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-white"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
