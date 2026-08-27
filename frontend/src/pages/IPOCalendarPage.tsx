import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Award } from 'lucide-react';

export const IPOCalendarPage: React.FC = () => {
  const [listings, setListings] = useState<any[]>([]);

  useEffect(() => {
    api
      .get('/calendar/ipo')
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        setListings(list);
      })
      .catch(() => setListings([]));
  }, []);

  return (
    <div className="space-y-4 text-[#131722]">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-white border border-[#e0e3eb] rounded-lg p-4 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded bg-[#e8f0fe] text-[#2962ff] flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-mono text-[#131722]">Upcoming & Recent IPO Calendar</h1>
            <p className="text-xs font-mono text-[#707a8a] font-medium">Initial Public Offerings, listing dates, and offer price ranges</p>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {listings.map((ipo) => (
          <div key={ipo.id} className="bg-white border border-[#e0e3eb] rounded-lg p-4 space-y-3 font-mono shadow-xs hover:border-[#2962ff] transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-bold text-[#131722]">{ipo.company}</div>
                <div className="text-[11px] text-[#2962ff] font-bold mt-0.5">{ipo.symbol} • {ipo.exchange}</div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  ipo.status === 'UPCOMING'
                    ? 'bg-[#e8f0fe] text-[#2962ff]'
                    : ipo.status === 'LISTED'
                    ? 'bg-[#e6f4f1] text-[#089981]'
                    : 'bg-[#fff3e0] text-[#e65100]'
                }`}
              >
                {ipo.status}
              </span>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[#f0f3fa] text-xs">
              <div className="flex justify-between">
                <span className="text-[#707a8a]">Listing Date</span>
                <span className="text-[#131722] font-bold">{ipo.listingDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#707a8a]">Price Range</span>
                <span className="text-[#089981] font-bold">{ipo.priceRange}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
