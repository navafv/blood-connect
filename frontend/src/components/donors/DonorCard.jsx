import { useState } from 'react';
import { MapPin, Phone, Calendar, Droplet } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusBadge } from './StatusBadge';

export function DonorCard({ donor }) {
  const [showPhone, setShowPhone] = useState(false);

  // Helper to calculate if donor is currently eligible based on last donation
  // (In a real app, this logic often lives in the backend, but good for UI display)
  const isEligible = donor.status === 'AVAILABLE';

  return (
    <Card className="overflow-hidden transition-all hover:border-slate-700 hover:shadow-2xl">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          
          {/* Blood Group Highlight Section */}
          <div className="flex flex-col items-center justify-center bg-slate-950 p-6 sm:w-1/3 sm:border-r sm:border-slate-800">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20">
              <Droplet className="absolute h-12 w-12 text-rose-500 opacity-20" />
              <span className="z-10 text-3xl font-bold text-rose-500">{donor.bloodGroup}</span>
            </div>
            <StatusBadge status={donor.status} className="mt-4" />
          </div>

          {/* Donor Details Section */}
          <div className="flex flex-1 flex-col justify-between p-6">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">{donor.fullName}</h3>
                  <div className="mt-2 space-y-2 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{donor.city}, {donor.district} - {donor.pincode}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Last Donated: {new Date(donor.lastDonationDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Area */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="h-4 w-4 text-emerald-500" />
                <span className="font-mono font-medium tracking-wider">
                  {showPhone ? donor.phone : `${donor.phone.substring(0, 3)}XXXXXXX`}
                </span>
              </div>
              
              <Button 
                variant={showPhone ? "secondary" : "primary"}
                size="sm"
                disabled={!isEligible}
                onClick={() => setShowPhone(true)}
              >
                {showPhone ? 'Number Revealed' : 'View Contact'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}