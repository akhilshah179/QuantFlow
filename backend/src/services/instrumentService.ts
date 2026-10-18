import { Instrument, MarketStatusType } from '../providers/MarketDataProvider';

export const GLOBAL_INSTRUMENT_CATALOG: Instrument[] = [
  // US Equities
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', assetType: 'EQUITY', providerSymbol: 'AAPL', provider: 'finnhub', timezone: 'America/New_York', sector: 'Technology', marketStatus: 'LIVE' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', assetType: 'EQUITY', providerSymbol: 'TSLA', provider: 'finnhub', timezone: 'America/New_York', sector: 'Consumer Cyclical', marketStatus: 'LIVE' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', country: 'US', currency: 'USD', assetType: 'EQUITY', providerSymbol: 'NVDA', provider: 'finnhub', timezone: 'America/New_York', sector: 'Technology', marketStatus: 'LIVE' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', country: 'US', currency: 'USD', assetType: 'EQUITY', providerSymbol: 'MSFT', provider: 'finnhub', timezone: 'America/New_York', sector: 'Technology', marketStatus: 'LIVE' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', assetType: 'EQUITY', providerSymbol: 'GOOGL', provider: 'finnhub', timezone: 'America/New_York', sector: 'Communication Services', marketStatus: 'LIVE' },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', assetType: 'EQUITY', providerSymbol: 'AMZN', provider: 'finnhub', timezone: 'America/New_York', sector: 'Consumer Cyclical', marketStatus: 'LIVE' },
  { symbol: 'META', name: 'Meta Platforms, Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', assetType: 'EQUITY', providerSymbol: 'META', provider: 'finnhub', timezone: 'America/New_York', sector: 'Communication Services', marketStatus: 'LIVE' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', exchange: 'NASDAQ', country: 'US', currency: 'USD', assetType: 'EQUITY', providerSymbol: 'AMD', provider: 'finnhub', timezone: 'America/New_York', sector: 'Technology', marketStatus: 'LIVE' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', exchange: 'NYSE', country: 'US', currency: 'USD', assetType: 'ETF', providerSymbol: 'SPY', provider: 'finnhub', timezone: 'America/New_York', sector: 'Financial Services', marketStatus: 'LIVE' },

  // Indian Equities (NSE)
  { symbol: 'RELIANCE:NSE', name: 'Reliance Industries Ltd.', exchange: 'NSE', country: 'IN', currency: 'INR', assetType: 'EQUITY', providerSymbol: 'NSE_EQ|INE002A01018', provider: 'upstox', timezone: 'Asia/Kolkata', sector: 'Energy', marketStatus: 'LIVE' },
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', exchange: 'NSE', country: 'IN', currency: 'INR', assetType: 'EQUITY', providerSymbol: 'NSE_EQ|INE002A01018', provider: 'upstox', timezone: 'Asia/Kolkata', sector: 'Energy', marketStatus: 'LIVE' },
  { symbol: 'TCS:NSE', name: 'Tata Consultancy Services', exchange: 'NSE', country: 'IN', currency: 'INR', assetType: 'EQUITY', providerSymbol: 'NSE_EQ|INE467B01029', provider: 'upstox', timezone: 'Asia/Kolkata', sector: 'Technology', marketStatus: 'LIVE' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE', country: 'IN', currency: 'INR', assetType: 'EQUITY', providerSymbol: 'NSE_EQ|INE467B01029', provider: 'upstox', timezone: 'Asia/Kolkata', sector: 'Technology', marketStatus: 'LIVE' },
  { symbol: 'INFY:NSE', name: 'Infosys Limited', exchange: 'NSE', country: 'IN', currency: 'INR', assetType: 'EQUITY', providerSymbol: 'NSE_EQ|INE009A01021', provider: 'upstox', timezone: 'Asia/Kolkata', sector: 'Technology', marketStatus: 'LIVE' },
  { symbol: 'INFY', name: 'Infosys Limited', exchange: 'NSE', country: 'IN', currency: 'INR', assetType: 'EQUITY', providerSymbol: 'NSE_EQ|INE009A01021', provider: 'upstox', timezone: 'Asia/Kolkata', sector: 'Technology', marketStatus: 'LIVE' },
  { symbol: 'HDFCBANK:NSE', name: 'HDFC Bank Limited', exchange: 'NSE', country: 'IN', currency: 'INR', assetType: 'EQUITY', providerSymbol: 'NSE_EQ|INE040A01034', provider: 'upstox', timezone: 'Asia/Kolkata', sector: 'Financial Services', marketStatus: 'LIVE' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', exchange: 'NSE', country: 'IN', currency: 'INR', assetType: 'EQUITY', providerSymbol: 'NSE_EQ|INE040A01034', provider: 'upstox', timezone: 'Asia/Kolkata', sector: 'Financial Services', marketStatus: 'LIVE' },
  { symbol: 'ICICIBANK:NSE', name: 'ICICI Bank Limited', exchange: 'NSE', country: 'IN', currency: 'INR', assetType: 'EQUITY', providerSymbol: 'NSE_EQ|INE090A01021', provider: 'upstox', timezone: 'Asia/Kolkata', sector: 'Financial Services', marketStatus: 'LIVE' },
  { symbol: 'SBIN:NSE', name: 'State Bank of India', exchange: 'NSE', country: 'IN', currency: 'INR', assetType: 'EQUITY', providerSymbol: 'NSE_EQ|INE062A01020', provider: 'upstox', timezone: 'Asia/Kolkata', sector: 'Financial Services', marketStatus: 'LIVE' },
  { symbol: 'TATAMOTORS:NSE', name: 'Tata Motors Limited', exchange: 'NSE', country: 'IN', currency: 'INR', assetType: 'EQUITY', providerSymbol: 'NSE_EQ|INE155A01022', provider: 'upstox', timezone: 'Asia/Kolkata', sector: 'Consumer Cyclical', marketStatus: 'LIVE' },

  // International Equities (LSE, DAX, Nikkei, HKEX)
  { symbol: 'SHEL', name: 'Shell plc', exchange: 'LSE', country: 'UK', currency: 'GBP', assetType: 'EQUITY', providerSymbol: 'SHEL.L', provider: 'finnhub', timezone: 'Europe/London', sector: 'Energy', marketStatus: 'LIVE' },
  { symbol: 'SAP', name: 'SAP SE', exchange: 'DAX', country: 'DE', currency: 'EUR', assetType: 'EQUITY', providerSymbol: 'SAP.DE', provider: 'finnhub', timezone: 'Europe/Berlin', sector: 'Technology', marketStatus: 'LIVE' },
];

export class InstrumentService {
  private instruments: Map<string, Instrument> = new Map();

  constructor() {
    GLOBAL_INSTRUMENT_CATALOG.forEach((inst) => {
      this.instruments.set(inst.symbol.toUpperCase(), inst);
    });
  }

  public getInstrument(symbol: string): Instrument | null {
    if (!symbol) return null;
    const upper = symbol.toUpperCase();
    let inst = this.instruments.get(upper);
    if (!inst && upper.includes(':')) {
      const baseSymbol = upper.split(':')[0];
      inst = this.instruments.get(baseSymbol);
    }
    return inst || null;
  }

  public getAllInstruments(): Instrument[] {
    return Array.from(this.instruments.values());
  }

  public searchInstruments(query: string): Instrument[] {
    const q = query.trim().toUpperCase();
    if (!q) return [];

    const matched = new Map<string, Instrument>();
    Array.from(this.instruments.values()).forEach((inst) => {
      if (
        inst.symbol.includes(q) ||
        inst.name.toUpperCase().includes(q) ||
        inst.exchange.toUpperCase().includes(q)
      ) {
        // Prefer canonical short symbol or explicit key
        const displayKey = inst.symbol.includes(':') ? inst.symbol : inst.symbol;
        if (!matched.has(inst.name)) {
          matched.set(inst.name, inst);
        }
      }
    });

    return Array.from(matched.values());
  }

  public getMarketStatusForExchange(exchange: string): MarketStatusType {
    const exchangeUpper = (exchange || 'US').toUpperCase();

    let timezone = 'America/New_York';
    if (exchangeUpper === 'NSE' || exchangeUpper === 'BSE' || exchangeUpper === 'IN') {
      timezone = 'Asia/Kolkata';
    } else if (exchangeUpper === 'LSE') {
      timezone = 'Europe/London';
    } else if (exchangeUpper === 'DAX') {
      timezone = 'Europe/Berlin';
    } else if (exchangeUpper === 'NIKKEI') {
      timezone = 'Asia/Tokyo';
    } else if (exchangeUpper === 'HKEX') {
      timezone = 'Asia/Hong_Kong';
    }

    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      });

      const parts = formatter.formatToParts(now);
      let day = '';
      let hour = 0;
      let minute = 0;

      parts.forEach((p) => {
        if (p.type === 'weekday') day = p.value;
        if (p.type === 'hour') hour = parseInt(p.value, 10);
        if (p.type === 'minute') minute = parseInt(p.value, 10);
      });

      // Weekend check
      if (day === 'Sat' || day === 'Sun') {
        return 'MARKET_CLOSED';
      }

      const totalMinutes = hour * 60 + minute;

      if (exchangeUpper === 'NSE' || exchangeUpper === 'BSE' || exchangeUpper === 'IN') {
        // India (IST): 09:00 - 09:15 Pre-market, 09:15 - 15:30 Open
        if (totalMinutes >= 540 && totalMinutes < 555) return 'PRE-MARKET';
        if (totalMinutes >= 555 && totalMinutes < 930) return 'LIVE';
        return 'MARKET_CLOSED';
      }

      if (exchangeUpper === 'NASDAQ' || exchangeUpper === 'NYSE' || exchangeUpper === 'US') {
        // US (ET): 04:00 - 09:30 Pre-market, 09:30 - 16:00 Open, 16:00 - 20:00 After-hours
        if (totalMinutes >= 240 && totalMinutes < 570) return 'PRE-MARKET';
        if (totalMinutes >= 570 && totalMinutes < 960) return 'LIVE';
        if (totalMinutes >= 960 && totalMinutes < 1200) return 'AFTER-HOURS';
        return 'MARKET_CLOSED';
      }

      if (exchangeUpper === 'LSE' || exchangeUpper === 'DAX') {
        // Europe: 08:00 - 16:30
        return totalMinutes >= 480 && totalMinutes < 990 ? 'LIVE' : 'MARKET_CLOSED';
      }

      return 'LIVE';
    } catch {
      return 'LIVE';
    }
  }
}

export const instrumentService = new InstrumentService();

