import { GLOBAL_INSTRUMENT_CATALOG, instrumentService } from './instrumentService';
import { upstoxInstrumentService } from './upstoxInstrumentService';

export interface NormalizedSymbol {
  symbol: string;
  displaySymbol: string;
  providerSymbol: string;
  companyName: string;
  exchange: string;
  country: string;
  currency: string;
  assetType: string;
  provider: string;
  supported: boolean;
  unsupportedReason?: string;
}

export class SymbolResolverService {
  private knownAliasMap: Record<string, { displaySymbol: string; providerSymbol: string; name: string; exchange: string; country: string; currency: string; provider: string; assetType?: string }> = {
    // Adidas
    'ADIDAS.BD': { displaySymbol: 'ADIDAS', providerSymbol: 'ADS.DE', name: 'Adidas AG', exchange: 'XETRA', country: 'DE', currency: 'EUR', provider: 'finnhub' },
    'ADIDAS': { displaySymbol: 'ADIDAS', providerSymbol: 'ADS.DE', name: 'Adidas AG', exchange: 'XETRA', country: 'DE', currency: 'EUR', provider: 'finnhub' },
    'ADS.DE': { displaySymbol: 'ADS', providerSymbol: 'ADS.DE', name: 'Adidas AG', exchange: 'XETRA', country: 'DE', currency: 'EUR', provider: 'finnhub' },
    'ADDYY': { displaySymbol: 'ADDYY', providerSymbol: 'ADDYY', name: 'Adidas AG (US ADR)', exchange: 'OTCMKTS', country: 'US', currency: 'USD', provider: 'finnhub' },

    // European & UK Giants
    'SHEL.L': { displaySymbol: 'SHEL', providerSymbol: 'SHEL.L', name: 'Shell plc', exchange: 'LSE', country: 'UK', currency: 'GBP', provider: 'finnhub' },
    'SAP.DE': { displaySymbol: 'SAP', providerSymbol: 'SAP.DE', name: 'SAP SE', exchange: 'XETRA', country: 'DE', currency: 'EUR', provider: 'finnhub' },

    // Crypto Pairs
    'BTCUSD': { displaySymbol: 'BTC/USDT', providerSymbol: 'BTCUSDT', name: 'Bitcoin', exchange: 'BINANCE_SPOT', country: 'GLOBAL', currency: 'USDT', provider: 'binance' },
    'BTCUSDT': { displaySymbol: 'BTC/USDT', providerSymbol: 'BTCUSDT', name: 'Bitcoin', exchange: 'BINANCE_SPOT', country: 'GLOBAL', currency: 'USDT', provider: 'binance' },
    'ETHUSD': { displaySymbol: 'ETH/USDT', providerSymbol: 'ETHUSDT', name: 'Ethereum', exchange: 'BINANCE_SPOT', country: 'GLOBAL', currency: 'USDT', provider: 'binance' },
    'ETHUSDT': { displaySymbol: 'ETH/USDT', providerSymbol: 'ETHUSDT', name: 'Ethereum', exchange: 'BINANCE_SPOT', country: 'GLOBAL', currency: 'USDT', provider: 'binance' },

    // Forex Pair Formats (EURUSD and EUR/USD)
    'EURUSD': { displaySymbol: 'EUR/USD', providerSymbol: 'EUR/USD', name: 'EUR / USD', exchange: 'FOREX', country: 'GLOBAL', currency: 'USD', provider: 'twelvedata', assetType: 'FOREX' },
    'EUR/USD': { displaySymbol: 'EUR/USD', providerSymbol: 'EUR/USD', name: 'EUR / USD', exchange: 'FOREX', country: 'GLOBAL', currency: 'USD', provider: 'twelvedata', assetType: 'FOREX' },
    'GBPUSD': { displaySymbol: 'GBP/USD', providerSymbol: 'GBP/USD', name: 'GBP / USD', exchange: 'FOREX', country: 'GLOBAL', currency: 'USD', provider: 'twelvedata', assetType: 'FOREX' },
    'GBP/USD': { displaySymbol: 'GBP/USD', providerSymbol: 'GBP/USD', name: 'GBP / USD', exchange: 'FOREX', country: 'GLOBAL', currency: 'USD', provider: 'twelvedata', assetType: 'FOREX' },
    'USDJPY': { displaySymbol: 'USD/JPY', providerSymbol: 'USD/JPY', name: 'USD / JPY', exchange: 'FOREX', country: 'GLOBAL', currency: 'JPY', provider: 'twelvedata', assetType: 'FOREX' },
    'USD/JPY': { displaySymbol: 'USD/JPY', providerSymbol: 'USD/JPY', name: 'USD / JPY', exchange: 'FOREX', country: 'GLOBAL', currency: 'JPY', provider: 'twelvedata', assetType: 'FOREX' },
    'USDCHF': { displaySymbol: 'USD/CHF', providerSymbol: 'USD/CHF', name: 'USD / CHF', exchange: 'FOREX', country: 'GLOBAL', currency: 'CHF', provider: 'twelvedata', assetType: 'FOREX' },
    'USD/CHF': { displaySymbol: 'USD/CHF', providerSymbol: 'USD/CHF', name: 'USD / CHF', exchange: 'FOREX', country: 'GLOBAL', currency: 'CHF', provider: 'twelvedata', assetType: 'FOREX' },
    'AUDUSD': { displaySymbol: 'AUD/USD', providerSymbol: 'AUD/USD', name: 'AUD / USD', exchange: 'FOREX', country: 'GLOBAL', currency: 'USD', provider: 'twelvedata', assetType: 'FOREX' },
    'AUD/USD': { displaySymbol: 'AUD/USD', providerSymbol: 'AUD/USD', name: 'AUD / USD', exchange: 'FOREX', country: 'GLOBAL', currency: 'USD', provider: 'twelvedata', assetType: 'FOREX' },
    'USDCAD': { displaySymbol: 'USD/CAD', providerSymbol: 'USD/CAD', name: 'USD / CAD', exchange: 'FOREX', country: 'GLOBAL', currency: 'CAD', provider: 'twelvedata', assetType: 'FOREX' },
    'USD/CAD': { displaySymbol: 'USD/CAD', providerSymbol: 'USD/CAD', name: 'USD / CAD', exchange: 'FOREX', country: 'GLOBAL', currency: 'CAD', provider: 'twelvedata', assetType: 'FOREX' },
    'NZDUSD': { displaySymbol: 'NZD/USD', providerSymbol: 'NZD/USD', name: 'NZD / USD', exchange: 'FOREX', country: 'GLOBAL', currency: 'USD', provider: 'twelvedata', assetType: 'FOREX' },
    'NZD/USD': { displaySymbol: 'NZD/USD', providerSymbol: 'NZD/USD', name: 'NZD / USD', exchange: 'FOREX', country: 'GLOBAL', currency: 'USD', provider: 'twelvedata', assetType: 'FOREX' },
    'USDINR': { displaySymbol: 'USD/INR', providerSymbol: 'USD/INR', name: 'USD / INR', exchange: 'FOREX', country: 'GLOBAL', currency: 'INR', provider: 'twelvedata', assetType: 'FOREX' },
    'USD/INR': { displaySymbol: 'USD/INR', providerSymbol: 'USD/INR', name: 'USD / INR', exchange: 'FOREX', country: 'GLOBAL', currency: 'INR', provider: 'twelvedata', assetType: 'FOREX' },
  };


  public resolve(inputSymbol: string): NormalizedSymbol {
    if (!inputSymbol) {
      return {
        symbol: 'AAPL',
        displaySymbol: 'AAPL',
        providerSymbol: 'AAPL',
        companyName: 'Apple Inc.',
        exchange: 'NASDAQ',
        country: 'US',
        currency: 'USD',
        assetType: 'EQUITY',
        provider: 'finnhub',
        supported: true,
      };
    }

    const rawUpper = inputSymbol.toUpperCase().trim();

    // 1. Check direct Known Alias Map
    if (this.knownAliasMap[rawUpper]) {
      const alias = this.knownAliasMap[rawUpper];
      return {
        symbol: rawUpper.replace('/', ''),
        displaySymbol: alias.displaySymbol,
        providerSymbol: alias.providerSymbol,
        companyName: alias.name,
        exchange: alias.exchange,
        country: alias.country,
        currency: alias.currency,
        assetType: alias.assetType || (rawUpper.endsWith('USDT') || rawUpper.startsWith('BTC') || rawUpper.startsWith('ETH') ? 'CRYPTO' : 'EQUITY'),
        provider: alias.provider,
        supported: true,
      };
    }


    // 2. Check Dynamic Upstox NSE Instrument Master Service
    const upstoxInst = upstoxInstrumentService.getInstrument(rawUpper);
    if (upstoxInst) {
      return {
        symbol: rawUpper,
        displaySymbol: upstoxInst.trading_symbol,
        providerSymbol: upstoxInst.instrument_key,
        companyName: upstoxInst.name || `${upstoxInst.trading_symbol} Ltd.`,
        exchange: 'NSE',
        country: 'IN',
        currency: 'INR',
        assetType: 'EQUITY',
        provider: 'upstox',
        supported: true,
      };
    }

    // 3. Check Global Instrument Catalog in instrumentService
    const inst = instrumentService.getInstrument(rawUpper);
    if (inst) {
      return {
        symbol: inst.symbol,
        displaySymbol: inst.symbol.split(':')[0],
        providerSymbol: inst.providerSymbol || inst.symbol,
        companyName: inst.name,
        exchange: inst.exchange,
        country: inst.country,
        currency: inst.currency,
        assetType: inst.assetType,
        provider: inst.provider || 'finnhub',
        supported: true,
      };
    }

    // 4. Indian (.NS / .BO) Ticker Suffix Resolution via Upstox Master
    if (rawUpper.endsWith('.NS') || rawUpper.endsWith('.BO')) {
      const baseTicker = rawUpper.split('.')[0];
      const baseUpstoxInst = upstoxInstrumentService.getInstrument(baseTicker);
      if (baseUpstoxInst) {
        return {
          symbol: rawUpper,
          displaySymbol: baseUpstoxInst.trading_symbol,
          providerSymbol: baseUpstoxInst.instrument_key,
          companyName: baseUpstoxInst.name || `${baseUpstoxInst.trading_symbol} Ltd.`,
          exchange: 'NSE',
          country: 'IN',
          currency: 'INR',
          assetType: 'EQUITY',
          provider: 'upstox',
          supported: true,
        };
      }
    }

    // 5. International Ticker Suffix Resolution (e.g. .DE, .L, .PA, .MI, .TO, .AX)
    const supportedSuffixes = ['.DE', '.F', '.L', '.PA', '.MI', '.TO', '.AX', '.SA', '.HK', '.SS', '.SZ'];
    const matchedSuffix = supportedSuffixes.find((s) => rawUpper.endsWith(s));

    if (matchedSuffix) {
      const cleanTicker = rawUpper.split('.')[0];
      let exchange = 'XETRA';
      if (matchedSuffix === '.L') exchange = 'LSE';
      else if (matchedSuffix === '.PA') exchange = 'EURONEXT_PARIS';
      else if (matchedSuffix === '.TO') exchange = 'TSX';

      return {
        symbol: rawUpper,
        displaySymbol: cleanTicker,
        providerSymbol: rawUpper,
        companyName: `${cleanTicker} Corporation`,
        exchange,
        country: matchedSuffix === '.L' ? 'UK' : 'DE',
        currency: matchedSuffix === '.L' ? 'GBP' : 'EUR',
        assetType: 'EQUITY',
        provider: 'finnhub',
        supported: true,
      };
    }

    // 6. Generic US Stock (Default Finnhub lookup symbol e.g. AAPL, MSFT, NVDA)
    if (!rawUpper.includes('.')) {
      return {
        symbol: rawUpper,
        displaySymbol: rawUpper,
        providerSymbol: rawUpper,
        companyName: `${rawUpper} Inc.`,
        exchange: 'US',
        country: 'US',
        currency: 'USD',
        assetType: 'EQUITY',
        provider: 'finnhub',
        supported: true,
      };
    }

    // 7. Unsupported Exchange Suffix (e.g. .BD, .Z, .AT)
    const suffix = rawUpper.split('.')[1] || rawUpper;
    return {
      symbol: rawUpper,
      displaySymbol: rawUpper.split('.')[0],
      providerSymbol: rawUpper,
      companyName: `${rawUpper.split('.')[0]} (${suffix})`,
      exchange: suffix,
      country: 'INTERNATIONAL',
      currency: 'USD',
      assetType: 'EQUITY',
      provider: 'none',
      supported: false,
      unsupportedReason: `Market data is currently unavailable for exchange/suffix '${suffix}'.`,
    };
  }
}

export const symbolResolver = new SymbolResolverService();
