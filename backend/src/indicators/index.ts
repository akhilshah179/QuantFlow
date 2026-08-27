export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorPoint {
  timestamp: number;
  value: number;
}

export interface MACDPoint {
  timestamp: number;
  macd: number;
  signal: number;
  histogram: number;
}

export interface BollingerBandPoint {
  timestamp: number;
  upper: number;
  middle: number;
  lower: number;
}

/**
 * Calculates Simple Moving Average (SMA)
 */
export function calculateSMA(candles: Candle[], period: number): IndicatorPoint[] {
  if (!candles || candles.length < period || period <= 0) return [];
  const results: IndicatorPoint[] = [];

  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += candles[j].close;
    }
    const sma = sum / period;
    results.push({
      timestamp: candles[i].timestamp,
      value: Number(sma.toFixed(4)),
    });
  }

  return results;
}

/**
 * Calculates Exponential Moving Average (EMA)
 */
export function calculateEMA(candles: Candle[], period: number): IndicatorPoint[] {
  if (!candles || candles.length < period || period <= 0) return [];
  const results: IndicatorPoint[] = [];
  const multiplier = 2 / (period + 1);

  let sum = 0;
  for (let j = 0; j < period; j++) {
    sum += candles[j].close;
  }
  let prevEma = sum / period;
  results.push({
    timestamp: candles[period - 1].timestamp,
    value: Number(prevEma.toFixed(4)),
  });

  for (let i = period; i < candles.length; i++) {
    const close = candles[i].close;
    const currentEma = (close - prevEma) * multiplier + prevEma;
    results.push({
      timestamp: candles[i].timestamp,
      value: Number(currentEma.toFixed(4)),
    });
    prevEma = currentEma;
  }

  return results;
}

/**
 * Calculates Relative Strength Index (RSI)
 */
export function calculateRSI(candles: Candle[], period: number = 14): IndicatorPoint[] {
  if (!candles || candles.length <= period || period <= 0) return [];
  const results: IndicatorPoint[] = [];

  let gainSum = 0;
  let lossSum = 0;

  for (let i = 1; i <= period; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change >= 0) {
      gainSum += change;
    } else {
      lossSum += Math.abs(change);
    }
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - 100 / (1 + rs);

  results.push({
    timestamp: candles[period].timestamp,
    value: Number(rsi.toFixed(2)),
  });

  for (let i = period + 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    const gain = change >= 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - 100 / (1 + rs);

    results.push({
      timestamp: candles[i].timestamp,
      value: Number(rsi.toFixed(2)),
    });
  }

  return results;
}

/**
 * Calculates Moving Average Convergence Divergence (MACD)
 */
export function calculateMACD(
  candles: Candle[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDPoint[] {
  if (!candles || candles.length < slowPeriod + signalPeriod) return [];

  const fastEMA = calculateEMA(candles, fastPeriod);
  const slowEMA = calculateEMA(candles, slowPeriod);

  const slowMap = new Map<number, number>();
  slowEMA.forEach((pt) => slowMap.set(pt.timestamp, pt.value));

  const macdLine: IndicatorPoint[] = [];
  fastEMA.forEach((fastPt) => {
    const slowVal = slowMap.get(fastPt.timestamp);
    if (slowVal !== undefined) {
      macdLine.push({
        timestamp: fastPt.timestamp,
        value: Number((fastPt.value - slowVal).toFixed(4)),
      });
    }
  });

  if (macdLine.length < signalPeriod) return [];

  const macdAsCandles: Candle[] = macdLine.map((pt) => ({
    timestamp: pt.timestamp,
    open: pt.value,
    high: pt.value,
    low: pt.value,
    close: pt.value,
    volume: 0,
  }));

  const signalLine = calculateEMA(macdAsCandles, signalPeriod);
  const signalMap = new Map<number, number>();
  signalLine.forEach((pt) => signalMap.set(pt.timestamp, pt.value));

  const results: MACDPoint[] = [];
  macdLine.forEach((mPt) => {
    const sigVal = signalMap.get(mPt.timestamp);
    if (sigVal !== undefined) {
      const macd = mPt.value;
      const signal = sigVal;
      const histogram = Number((macd - signal).toFixed(4));
      results.push({
        timestamp: mPt.timestamp,
        macd,
        signal,
        histogram,
      });
    }
  });

  return results;
}

/**
 * Calculates Bollinger Bands
 */
export function calculateBollingerBands(
  candles: Candle[],
  period: number = 20,
  multiplier: number = 2
): BollingerBandPoint[] {
  if (!candles || candles.length < period || period <= 0) return [];
  const results: BollingerBandPoint[] = [];

  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += candles[j].close;
    }
    const middle = sum / period;

    let varianceSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      varianceSum += Math.pow(candles[j].close - middle, 2);
    }
    const stdDev = Math.sqrt(varianceSum / period);

    const upper = middle + multiplier * stdDev;
    const lower = middle - multiplier * stdDev;

    results.push({
      timestamp: candles[i].timestamp,
      upper: Number(upper.toFixed(4)),
      middle: Number(middle.toFixed(4)),
      lower: Number(lower.toFixed(4)),
    });
  }

  return results;
}

/**
 * Calculates Volume Weighted Average Price (VWAP)
 */
export function calculateVWAP(candles: Candle[]): IndicatorPoint[] {
  if (!candles || candles.length === 0) return [];

  const results: IndicatorPoint[] = [];
  let cumulativeTPV = 0; // Typical Price x Volume sum
  let cumulativeVolume = 0;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const typicalPrice = (c.high + c.low + c.close) / 3;
    const tpv = typicalPrice * (c.volume || 1);

    cumulativeTPV += tpv;
    cumulativeVolume += (c.volume || 1);

    const vwap = cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : typicalPrice;

    results.push({
      timestamp: c.timestamp,
      value: Number(vwap.toFixed(4)),
    });
  }

  return results;
}

/**
 * Calculates Average True Range (ATR)
 */
export function calculateATR(candles: Candle[], period: number = 14): IndicatorPoint[] {
  if (!candles || candles.length <= period || period <= 0) return [];

  const trueRanges: number[] = [];

  // First TR is simply High - Low
  trueRanges.push(candles[0].high - candles[0].low);

  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const prevClose = candles[i - 1].close;

    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prevClose),
      Math.abs(current.low - prevClose)
    );
    trueRanges.push(tr);
  }

  const results: IndicatorPoint[] = [];

  // Initial ATR over period
  let trSum = 0;
  for (let i = 0; i < period; i++) {
    trSum += trueRanges[i];
  }
  let currentATR = trSum / period;

  results.push({
    timestamp: candles[period - 1].timestamp,
    value: Number(currentATR.toFixed(4)),
  });

  // Wilder's Smoothing
  for (let i = period; i < candles.length; i++) {
    currentATR = (currentATR * (period - 1) + trueRanges[i]) / period;
    results.push({
      timestamp: candles[i].timestamp,
      value: Number(currentATR.toFixed(4)),
    });
  }

  return results;
}
