export interface EconomicEvent {
  id: string;
  country: string;
  countryFlag: string;
  event: string;
  time: string;
  date: string;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  actual?: string;
  forecast?: string;
  previous?: string;
}

export interface IPOListing {
  id: string;
  company: string;
  symbol: string;
  exchange: string;
  listingDate: string;
  priceRange: string;
  status: 'UPCOMING' | 'LISTED' | 'FILED';
}

export class CalendarService {
  public async getEconomicEvents(): Promise<EconomicEvent[]> {
    const today = new Date().toISOString().slice(0, 10);
    return [
      { id: '1', country: 'US', countryFlag: '🇺🇸', event: 'US Core Inflation Rate (MoM / YoY)', time: '18:00 IST', date: today, importance: 'HIGH', forecast: '0.2%', previous: '0.3%' },
      { id: '2', country: 'US', countryFlag: '🇺🇸', event: 'Initial Jobless Claims', time: '18:00 IST', date: today, importance: 'MEDIUM', forecast: '235K', previous: '233K' },
      { id: '3', country: 'IN', countryFlag: '🇮🇳', event: 'RBI Monetary Policy Interest Rate Decision', time: '10:00 IST', date: today, importance: 'HIGH', actual: '6.50%', forecast: '6.50%', previous: '6.50%' },
      { id: '4', country: 'EU', countryFlag: '🇪🇺', event: 'ECB President Lagarde Speech', time: '20:30 IST', date: today, importance: 'MEDIUM' },
      { id: '5', country: 'JP', countryFlag: '🇯🇵', event: 'Bank of Japan Monetary Policy Meeting Minutes', time: '05:20 IST', date: today, importance: 'HIGH', forecast: '0.25%', previous: '0.10%' },
      { id: '6', country: 'US', countryFlag: '🇺🇸', event: 'US Gross Domestic Product (GDP QoQ Final)', time: '18:30 IST', date: today, importance: 'HIGH', forecast: '2.8%', previous: '1.4%' },
      { id: '7', country: 'IN', countryFlag: '🇮🇳', event: 'India Industrial Production (YoY)', time: '17:30 IST', date: today, importance: 'MEDIUM', actual: '4.2%', forecast: '3.8%', previous: '5.0%' },
    ];
  }

  public async getIPOCalendar(): Promise<IPOListing[]> {
    return [
      { id: '1', company: 'Ola Electric Mobility Ltd.', symbol: 'OLAELEC', exchange: 'NSE', listingDate: '2026-08-18', priceRange: '₹72 - ₹76', status: 'UPCOMING' },
      { id: '2', company: 'Brainbees Solutions (FirstCry)', symbol: 'FIRSTCRY', exchange: 'NSE', listingDate: '2026-08-20', priceRange: '₹440 - ₹465', status: 'UPCOMING' },
      { id: '3', company: 'Stripe, Inc.', symbol: 'STRIPE', exchange: 'NASDAQ', listingDate: '2026-09-12', priceRange: '$45 - $50', status: 'FILED' },
      { id: '4', company: 'Databricks Corp.', symbol: 'DATA', exchange: 'NYSE', listingDate: '2026-10-05', priceRange: '$120 - $135', status: 'FILED' },
      { id: '5', company: 'Akums Drugs & Pharmaceuticals', symbol: 'AKUMS', exchange: 'NSE', listingDate: '2026-08-06', priceRange: '₹679', status: 'LISTED' },
    ];
  }
}

export const calendarService = new CalendarService();
