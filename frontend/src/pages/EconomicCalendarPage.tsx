import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Calendar } from 'lucide-react';

export const EconomicCalendarPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api
      .get('/calendar/economic')
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        setEvents(list);
        setLoading(false);
      })
      .catch(() => {
        setEvents([]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-4 text-[#131722]">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-white border border-[#e0e3eb] rounded-lg p-4 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded bg-[#e8f0fe] text-[#2962ff] flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-mono text-[#131722]">Global Economic Calendar</h1>
            <p className="text-xs font-mono text-[#707a8a] font-medium">Scheduled high-impact macroeconomic indicators & central bank rate decisions</p>
          </div>
        </div>
      </div>

      {/* Calendar Data Table */}
      <div className="bg-white border border-[#e0e3eb] rounded-lg p-3.5 shadow-xs overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-[#e0e3eb] text-[#707a8a] uppercase text-[10px]">
              <th className="pb-2 px-3">Country</th>
              <th className="pb-2 px-3">Time</th>
              <th className="pb-2 px-3">Event</th>
              <th className="pb-2 px-3">Impact</th>
              <th className="pb-2 px-3 text-right">Actual</th>
              <th className="pb-2 px-3 text-right">Forecast</th>
              <th className="pb-2 px-3 text-right">Previous</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f3fa]">
            {events.map((ev) => (
              <tr key={ev.id} className="hover:bg-[#f8f9fd] transition-colors">
                <td className="py-2.5 px-3 flex items-center space-x-2">
                  <span>{ev.countryFlag}</span>
                  <span className="font-bold text-[#131722]">{ev.country}</span>
                </td>
                <td className="py-2.5 px-3 text-[#707a8a] font-medium">{ev.time}</td>
                <td className="py-2.5 px-3 font-bold text-[#131722]">{ev.event}</td>
                <td className="py-2.5 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ev.importance === 'HIGH'
                        ? 'bg-[#fdecee] text-[#f23645]'
                        : ev.importance === 'MEDIUM'
                        ? 'bg-[#fff3e0] text-[#e65100]'
                        : 'bg-[#f0f3fa] text-[#707a8a]'
                    }`}
                  >
                    {ev.importance}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-[#089981]">{ev.actual || '-'}</td>
                <td className="py-2.5 px-3 text-right font-bold text-[#131722]">{ev.forecast || '-'}</td>
                <td className="py-2.5 px-3 text-right text-[#707a8a]">{ev.previous || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
