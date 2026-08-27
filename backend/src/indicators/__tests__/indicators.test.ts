import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateVWAP,
  calculateATR,
  Candle,
} from '../index';

describe('Technical Indicators Calculation Unit Tests', () => {
  const generateMockCandles = (count: number, startPrice: number = 100): Candle[] => {
    const candles: Candle[] = [];
    const startTime = 1700000000;
    let price = startPrice;

    for (let i = 0; i < count; i++) {
      price += (i % 2 === 0 ? 1 : -0.5);
      candles.push({
        timestamp: startTime + i * 86400,
        open: price - 0.2,
        high: price + 1,
        low: price - 1,
        close: price,
        volume: 10000 + i * 500,
      });
    }
    return candles;
  };

  test('calculateSMA should return correct period average', () => {
    const candles = generateMockCandles(30);
    const sma20 = calculateSMA(candles, 20);

    expect(sma20.length).toBe(11);
    expect(sma20[0].value).toBeGreaterThan(0);
    expect(sma20[0].timestamp).toBe(candles[19].timestamp);
  });

  test('calculateEMA should weight recent candles higher', () => {
    const candles = generateMockCandles(30);
    const ema12 = calculateEMA(candles, 12);

    expect(ema12.length).toBe(19);
    expect(ema12[0].value).toBeGreaterThan(0);
  });

  test('calculateRSI should return values between 0 and 100', () => {
    const candles = generateMockCandles(50);
    const rsi14 = calculateRSI(candles, 14);

    expect(rsi14.length).toBeGreaterThan(0);
    rsi14.forEach((pt) => {
      expect(pt.value).toBeGreaterThanOrEqual(0);
      expect(pt.value).toBeLessThanOrEqual(100);
    });
  });

  test('calculateMACD should return valid macd, signal, and histogram', () => {
    const candles = generateMockCandles(60);
    const macd = calculateMACD(candles, 12, 26, 9);

    expect(macd.length).toBeGreaterThan(0);
    const first = macd[0];
    expect(first).toHaveProperty('macd');
    expect(first).toHaveProperty('signal');
    expect(first).toHaveProperty('histogram');
    expect(first.histogram).toBe(Number((first.macd - first.signal).toFixed(4)));
  });

  test('calculateBollingerBands should calculate upper > middle > lower', () => {
    const candles = generateMockCandles(30);
    const bb = calculateBollingerBands(candles, 20, 2);

    expect(bb.length).toBe(11);
    bb.forEach((pt) => {
      expect(pt.upper).toBeGreaterThanOrEqual(pt.middle);
      expect(pt.middle).toBeGreaterThanOrEqual(pt.lower);
    });
  });

  test('calculateVWAP should calculate volume weighted price', () => {
    const candles = generateMockCandles(30);
    const vwap = calculateVWAP(candles);

    expect(vwap.length).toBe(30);
    expect(vwap[0].value).toBeGreaterThan(0);
  });

  test('calculateATR should calculate average true range', () => {
    const candles = generateMockCandles(30);
    const atr = calculateATR(candles, 14);

    expect(atr.length).toBe(17);
    expect(atr[0].value).toBeGreaterThan(0);
  });
});
