import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import axios from 'axios';

export interface UpstoxInstrument {
  segment: string;
  instrument_key: string;
  trading_symbol: string;
  name: string;
  exchange: string;
  instrument_type: string;
  isin?: string;
  exchange_token?: string;
  tick_size?: number;
  lot_size?: number;
  short_name?: string;
  security_type?: string;
}

export class UpstoxInstrumentService {
  private dataDir = path.join(__dirname, '../../data');
  private jsonFilePath = path.join(this.dataDir, 'NSE.json');
  private downloadUrl = 'https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz';
  private secondaryDownloadUrl = 'https://assets.upstox.com/market-quote/instruments/exchange/complete.json.gz';

  private tradingSymbolMap: Map<string, UpstoxInstrument> = new Map();
  private isinMap: Map<string, UpstoxInstrument> = new Map();
  private instrumentList: UpstoxInstrument[] = [];

  private isInitialized = false;

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      let shouldDownload = true;

      if (fs.existsSync(this.jsonFilePath)) {
        const stats = fs.statSync(this.jsonFilePath);
        const ageMs = Date.now() - stats.mtimeMs;
        const maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours
        if (ageMs < maxAgeMs && stats.size > 1000) {
          shouldDownload = false;
        }
      }

      if (shouldDownload) {
        console.log('[UpstoxInstrumentService] Downloading NSE instrument master from Upstox...');
        await this.downloadAndDecompress();
      }

      this.loadAndIndexJson();
      this.isInitialized = true;
      console.log(`[UpstoxInstrumentService] Successfully indexed ${this.instrumentList.length} NSE instruments.`);
    } catch (err: any) {
      console.warn('[UpstoxInstrumentService] Master data initialization warning:', err.message);
      if (fs.existsSync(this.jsonFilePath)) {
        try {
          this.loadAndIndexJson();
          this.isInitialized = true;
          console.log(`[UpstoxInstrumentService] Loaded fallback cached NSE instruments (${this.instrumentList.length} items).`);
        } catch { }
      }
    }
  }

  private async downloadAndDecompress(): Promise<void> {
    let response;
    try {
      response = await axios.get(this.downloadUrl, {
        responseType: 'arraybuffer',
        timeout: 20000,
      });
    } catch {
      console.log('[UpstoxInstrumentService] Trying complete.json.gz fallback...');
      response = await axios.get(this.secondaryDownloadUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
    }

    if (!response || !response.data) {
      throw new Error('Failed to download Upstox instrument master file.');
    }

    const compressedBuffer = Buffer.from(response.data);
    const decompressedBuffer = zlib.gunzipSync(compressedBuffer);
    fs.writeFileSync(this.jsonFilePath, decompressedBuffer);
  }

  private loadAndIndexJson(): void {
    if (!fs.existsSync(this.jsonFilePath)) return;

    const rawContent = fs.readFileSync(this.jsonFilePath, 'utf-8');
    const instruments: UpstoxInstrument[] = JSON.parse(rawContent);

    if (!Array.isArray(instruments)) return;

    this.tradingSymbolMap.clear();
    this.isinMap.clear();
    this.instrumentList = [];

    for (const item of instruments) {
      if (!item || !item.instrument_key || !item.trading_symbol) continue;

      // Filter for NSE Equity / Index / Derivatives instruments
      if (item.segment === 'NSE_EQ' && item.instrument_type === 'EQ') {
        const symbolUpper = item.trading_symbol.toUpperCase().trim();

        if (!this.tradingSymbolMap.has(symbolUpper)) {
          this.tradingSymbolMap.set(symbolUpper, item);
          this.tradingSymbolMap.set(`${symbolUpper}:NSE`, item);
          this.instrumentList.push(item);
        }

        if (item.isin) {
          this.isinMap.set(item.isin.toUpperCase().trim(), item);
        }
      }
    }
  }

  public getInstrumentKey(symbol: string): string | null {
    if (!symbol) return null;
    const cleanSymbol = symbol.toUpperCase().split(':')[0].split('.')[0].trim();

    const inst = this.tradingSymbolMap.get(cleanSymbol) || this.tradingSymbolMap.get(symbol.toUpperCase());
    if (inst) {
      return inst.instrument_key;
    }

    return null;
  }

  public getInstrument(symbol: string): UpstoxInstrument | null {
    if (!symbol) return null;
    const cleanSymbol = symbol.toUpperCase().split(':')[0].split('.')[0].trim();
    return this.tradingSymbolMap.get(cleanSymbol) || this.tradingSymbolMap.get(symbol.toUpperCase()) || null;
  }

  public searchInstruments(query: string, limit: number = 10): UpstoxInstrument[] {
    if (!query || !query.trim()) return [];
    const qUpper = query.toUpperCase().trim();
    const qLower = query.toLowerCase().trim();

    const results: UpstoxInstrument[] = [];

    for (const inst of this.instrumentList) {
      const symUpper = inst.trading_symbol.toUpperCase();
      const nameLower = inst.name ? inst.name.toLowerCase() : '';

      if (symUpper.includes(qUpper) || nameLower.includes(qLower)) {
        results.push(inst);
        if (results.length >= limit) break;
      }
    }

    return results;
  }
}

export const upstoxInstrumentService = new UpstoxInstrumentService();
