import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  UserPlus, ArrowLeft, Loader2, Heart, 
  Activity, AlertCircle, ShieldAlert
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import api from '../../lib/axios';

const BLOOD_GROUPS = [
  'A+', 'A-', 'A1+', 'A1-', 'A1B+', 'A1B-', 'A2+', 'A2-', 'A2B+', 'A2B-', 
  'AB+', 'AB-', 'B+', 'B-', 'BBG', 'INRA', 'O+', 'O-'
];

export default function AddDonor() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    date_of_birth: '',
    gender: 'M',
    blood_group: '',
    last_donation_date: '',
    is_permanently_deferred: false,
    deferral_reason: ''
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const payload = {
      ...formData,
      last_donation_date: formData.last_donation_date || null 
    };

    try {
      await api.post('/tenant/donors/', payload);
      navigate('/admin');
    } catch (err) {
      console.error("Full Error Response:", err.response?.data);
      
      const errorData = err.response?.data;
      let errorMessage = 'Failed to add donor. Please check the provided information.';

      if (errorData && typeof errorData === 'object' && !errorData.detail) {
        const firstKey = Object.keys(errorData)[0];
        if (Array.isArray(errorData[firstKey])) {
          errorMessage = `${firstKey.replace('_', ' ').toUpperCase()}: ${errorData[firstKey][0]}`;
        }
      } else if (errorData?.detail) {
        errorMessage = errorData.detail;
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
        <Link to="/admin">
          <Button variant="ghost" className="h-10 w-10 p-0 rounded-full hover:bg-slate-800 text-slate-400">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-rose-500" />
            Add New Donor
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Register a new donor to your local network. Geographic data will be synced automatically.
          </p>
        </div>
      </div>

      {/* Main Form */}
      <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl">
        <CardHeader className="border-b border-slate-800/50 pb-4">
          <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
            <Heart className="h-5 w-5 text-emerald-500" />
            Donor Information
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {error && (
              <div className="flex items-center gap-2 p-4 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* --- Section 1: Personal Details --- */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Full Name *</label>
                  <Input 
                    name="full_name" 
                    placeholder="e.g., John Doe" 
                    className="bg-slate-950/50"
                    value={formData.full_name}
                    onChange={handleChange}
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Phone Number *</label>
                  <Input 
                    name="phone_number" 
                    type="tel"
                    placeholder="+91 98765 43210" 
                    className="bg-slate-950/50 font-mono"
                    value={formData.phone_number}
                    onChange={handleChange}
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Date of Birth *</label>
                  <Input 
                    name="date_of_birth" 
                    type="date"
                    className="bg-slate-950/50"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Biological Gender *</label>
                  <Select 
                    name="gender" 
                    className="bg-slate-950/50"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="M">Male (90-day wait period)</option>
                    <option value="F">Female (120-day wait period)</option>
                    <option value="O">Other</option>
                  </Select>
                </div>
              </div>
            </div>

            {/* --- Section 2: Medical Info --- */}
            <div className="space-y-4 pt-4 border-t border-slate-800/50">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Activity className="h-4 w-4" /> Medical Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Blood Group *</label>
                  <Select 
                    name="blood_group" 
                    className="bg-slate-950/50"
                    value={formData.blood_group}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>Select Blood Group</option>
                    {BLOOD_GROUPS.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Last Donation Date</label>
                  <Input 
                    name="last_donation_date" 
                    type="date"
                    className="bg-slate-950/50"
                    value={formData.last_donation_date}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-slate-500 mt-1">Leave blank if this is a first-time donor.</p>
                </div>
              </div>
            </div>

            {/* --- Section 3: Eligibility & Deferrals --- */}
            <div className="space-y-4 pt-4 border-t border-slate-800/50">
              <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                <div className="mt-0.5">
                  <input 
                    type="checkbox" 
                    id="deferral"
                    name="is_permanently_deferred"
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900"
                    checked={formData.is_permanently_deferred}
                    onChange={handleChange}
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="deferral" className="text-sm font-medium text-amber-500 flex items-center gap-2 cursor-pointer">
                    <ShieldAlert className="h-4 w-4" /> Mark as Permanently Deferred
                  </label>
                  <p className="text-xs text-slate-400 mt-1">
                    Check this box if the donor has a medical condition that permanently prevents them from donating blood. They will be removed from public search results.
                  </p>
                </div>
              </div>

              {formData.is_permanently_deferred && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-medium text-slate-400">Deferral Reason / Medical Note</label>
                  <textarea 
                    name="deferral_reason"
                    placeholder="e.g., Heart condition, Chronic illness..."
                    className="w-full min-h-25 rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    value={formData.deferral_reason}
                    onChange={handleChange}
                    required={formData.is_permanently_deferred}
                  />
                </div>
              )}
            </div>

            {/* Submit Actions */}
            <div className="pt-6 border-t border-slate-800 flex justify-end gap-4">
              <Link to="/admin">
                <Button type="button" variant="ghost" className="text-slate-400 hover:text-white">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" variant="primary" disabled={isSubmitting} className="w-40">
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  'Save Donor Profile'
                )}
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}