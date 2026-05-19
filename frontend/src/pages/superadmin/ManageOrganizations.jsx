import React, { useState, useEffect } from 'react';
import { 
  Building2, Search, Filter, CheckCircle, 
  XCircle, AlertTriangle, MoreVertical, Loader2, Mail, MapPin, Phone
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import api from '../../lib/axios';

export default function ManageOrganizations() {
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, PENDING, ACTIVE, SUSPENDED

  // Fetch all organizations on mount
  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    setIsLoading(true);
    setError('');
    try {
      // This endpoint requires Super Admin privileges
      const response = await api.get('/superadmin/organizations/');
      setOrganizations(response.data);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError('Failed to load organizations. Ensure you have Super Admin permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Approving or Suspending an Organization
  const updateOrgStatus = async (id, newStatus, orgName) => {
    const action = newStatus === 'ACTIVE' ? 'approve' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${action} ${orgName}?`)) return;

    try {
      await api.patch(`/superadmin/organizations/${id}/status/`, {
        status: newStatus
      });
      
      // Update local state instantly
      setOrganizations(prev => 
        prev.map(org => org.id === id ? { ...org, status: newStatus } : org)
      );
    } catch (err) {
      alert(`Failed to ${action} organization. Please try again.`);
    }
  };

  // Filter Logic
  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = 
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.contact_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || org.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats for the header
  const pendingCount = organizations.filter(o => o.status === 'PENDING').length;
  const activeCount = organizations.filter(o => o.status === 'ACTIVE').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="h-6 w-6 text-rose-500" />
            Tenant Organizations
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Approve, manage, and monitor hospitals and NGOs across the platform.
          </p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Pending Approval</p>
              <p className="text-2xl font-bold text-white">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Active Tenants</p>
              <p className="text-2xl font-bold text-white">{activeCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Building2 className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Registered</p>
              <p className="text-2xl font-bold text-white">{organizations.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-xl">
        <CardHeader className="border-b border-slate-800 pb-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <CardTitle className="text-lg font-medium text-white">Network Directory</CardTitle>
            
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Status Filter */}
              <div className="flex bg-slate-950/50 rounded-lg p-1 border border-slate-800">
                {['ALL', 'PENDING', 'ACTIVE', 'SUSPENDED'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      filterStatus === status 
                        ? 'bg-slate-800 text-white' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input 
                  placeholder="Search by name or email..." 
                  className="pl-9 h-9 bg-slate-950/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-rose-500" />
              <p>Loading tenant directory...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <AlertTriangle className="h-8 w-8 mb-4 text-rose-500" />
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={fetchOrganizations}>Retry</Button>
            </div>
          ) : filteredOrgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center px-4">
              <div className="h-16 w-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No Organizations Found</h3>
              <p>No tenants match your current search or filter criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400 bg-slate-950/30">
                    <th className="px-6 py-4 font-semibold">Organization</th>
                    <th className="px-6 py-4 font-semibold">Contact Info</th>
                    <th className="px-6 py-4 font-semibold">Location Limit</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{org.name}</p>
                            <p className="text-xs text-slate-500">{org.org_type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        <p className="text-xs text-slate-300 flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-slate-500" /> {org.contact_email}
                        </p>
                        {org.contact_phone && (
                          <p className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-slate-500" /> {org.contact_phone}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-300 flex items-start gap-1.5">
                          <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" /> 
                          <span>{org.district_name},<br/><span className="text-xs text-slate-500">{org.state_name}, {org.country_name}</span></span>
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {org.status === 'ACTIVE' ? (
                          <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>
                        ) : org.status === 'PENDING' ? (
                          <Badge variant="warning" className="bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse">Pending</Badge>
                        ) : (
                          <Badge variant="danger" className="bg-rose-500/10 text-rose-400 border-rose-500/20">Suspended</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          
                          {/* Approve Button (Only show if Pending or Suspended) */}
                          {org.status !== 'ACTIVE' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10"
                              onClick={() => updateOrgStatus(org.id, 'ACTIVE', org.name)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Approve
                            </Button>
                          )}

                          {/* Suspend Button (Only show if Active) */}
                          {org.status === 'ACTIVE' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 border-rose-500/50 text-rose-500 hover:bg-rose-500/10"
                              onClick={() => updateOrgStatus(org.id, 'SUSPENDED', org.name)}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Suspend
                            </Button>
                          )}

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}