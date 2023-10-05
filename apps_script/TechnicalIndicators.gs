//add option to turn on/off specific part of indicator (e.g. dmi() show only ADX part)
//indicator parts ordering (e.g. upper, basis, lower)
//move 'source' parameter at end
//replace size to .length
//one-liner when declaring variables
//add limit catcher
//add .filter(Number.isFinite) to Math.max() and Math.min()
//simplify rsi(), rsi_() [Miscellaneous.gs] & other functions that relies on rsi's formula

function chaikvola(stockCode, length = 10, ROCLength = 10, hasHeader = true) {
  let highs, lows;

  if (typeof stockCode === "string") {
    [highs, lows] = ImportJSON(stockCode, "high/low", true);
  } else if (Array.isArray(stockCode)) {
    [highs, lows] = stockCode;
  }
  
  let diffs = [];
  
  for (let i = 0; i < highs.length; ++i) {
    diffs[i] = highs[i] - lows[i];
  }
  
  let diffsEma = ema([diffs], length, null, false);
  let output = (new Array(length - 1).fill(null)).concat( roc([diffsEma.filter(value => value !== null)], ROCLength, null, false) );
  
  if (hasHeader) {
    output.unshift(Utilities.formatString('Chaikin Vola(%s, %s)', length, ROCLength));
  }

  return output;
}

function trix(stockCode, length = 18, hasHeader = true) {
  let input;

  if (typeof stockCode === "string") {
    [input] = ImportJSON(stockCode, "close", true);
  } else if (Array.isArray(stockCode)) {
    [input] = stockCode;
  }
  
  let i;
  let logs = [], output = (new Array((length - 1) * 3 + 1).fill(null));
  
  for (i = 0; i < input.length; ++i) {
    logs[i] = Math.log(input[i]);
  }

  let tripleEmaLogs1 = ema([logs], length, null, false),
      tripleEmaLogs2 = ema([tripleEmaLogs1.filter(value => value !== null)], length, null, false),
      tripleEmaLogs3 = (new Array(length * 2 - 2)).fill(null).concat(ema([tripleEmaLogs2.filter(value => value !== null)], length, null, false));
      
  for (i = (length - 1) * 3 + 1, j = 0; i < input.length; ++i, ++j) {
    output[i] = 10000 * (tripleEmaLogs3[i] - tripleEmaLogs3[i-1]);
  }
  
  if (hasHeader) {
    output.unshift(Utilities.formatString('TRIX(%s)', length));
  }

  return output;
}

function pvt(stockCode, hasHeader = true) {
  let input, volume;

  if (typeof stockCode === "string") {
    [input, volume] = ImportJSON(stockCode, "close/volume", true);
  } else if (Array.isArray(stockCode)) {
    [input, volume] = stockCode;
  }
  
  let sum = 0, output = [null];
  
  for (let i = 1; i < input.length; ++i) {
    sum += volume[i] * ((input[i] - input[i-1]) / input[i-1]);
    output[i] = sum;
  }
  
  if (hasHeader) {
    output.unshift('PVT');
  }

  return output;
}

function chaikosc(stockCode, fastLength = 3, slowLength = 10, hasHeader = true) {
  let input;

  if (typeof stockCode === "string") {
    [input] = [accdist(stockCode, false)];
  } else if (Array.isArray(stockCode)) {
    [input] = stockCode;
  }
  
  let start = Math.max(slowLength, fastLength) - 1;
  let fastEmaAD = ema([input], fastLength, null, false), slowEmaAD = ema([input], slowLength, null, false);
  let output = (new Array(start).fill(null));
  
  for (let i = start; i < input.length; ++i) {
    output[i] = fastEmaAD[i] - slowEmaAD[i];
  }
  
  if (hasHeader) {
    output.unshift(Utilities.formatString('Chaikin Osc(%s, %s)', fastLength, slowLength));
  }
  
  return output;
}

function accdist(stockCode, hasHeader = true) {
  let highs, lows, close, volume;

  if (typeof stockCode === "string") {
    [highs, lows, close, volume] = ImportJSON(stockCode, "high/low/close/volume", true);
  } else if (Array.isArray(stockCode)) {
    [highs, lows, close, volume] = stockCode;
  }
  
  let sum = 0, output = [];

  for (let i = 0; i < highs.length; ++i) {    
    sum +=
      (close[i] == highs[i] && close[i] == lows[i] || highs[i] == lows[i])
      ? 0
      : (((2 * close[i] - lows[i] - highs[i]) / (highs[i]-lows[i])) * volume[i]);
      
    output[i] = sum;
  }
  
  if (hasHeader) {
    output.unshift('Accum/Dist');
  }

  return output;
}

function obv(stockCode, hasHeader = true) {
  let input, volume;

  if (typeof stockCode === "string") {
    [input, volume] = ImportJSON(stockCode, "close/volume", true);
  } else if (Array.isArray(stockCode)) {
    [input, volume] = stockCode;
  }
  
  let sum = 0, output = [0];
  
  for (let i = 1; i < input.length; ++i) {
    sum += Math.sign(input[i] - input[i-1]) * volume[i];
    output[i] = sum;
  }
  
  if (hasHeader) {
    output.unshift('OBV');
  }

  return output;
}

function stochrsi(stockCode, rsiLength = 14, stochLength = 14, smoothK = 3, smoothD = 3, hasHeader = true) {
  //no value when rsiLength = 1
  let input;

  if (typeof stockCode === "string") {
    [input] = ImportJSON(stockCode, "close", true);
  } else if (Array.isArray(stockCode)) {
    [input] = stockCode;
  }
  
  let i, upwards = [null], downwards = [null], rsi = [null];
  let max, min;
  
  for (i = 1; i < input.length; ++i) {
    upwards[i] = Math.max(input[i] - input[i-1], 0);
    downwards[i] = Math.max(input[i-1] - input[i], 0);
    rsi[i] = null;
  }
  
  let rmiUpwards = rma_(upwards, rsiLength, false);
  let rmiDownwards = rma_(downwards, rsiLength, false);
  
  for (i = rsiLength, j = 0; i < rmiUpwards.length; ++i) {
    rsi[i] = 100 - 100 / (1 + rmiUpwards[i]/rmiDownwards[i]);
  }

  let output = stoch([rsi, rsi, rsi], stochLength, smoothD, smoothK, false);
  
  //investagrams
  let firstNonNullIndexK = output.findIndex((KD) => Number.isFinite(KD[0]));

  if (firstNonNullIndexK > -1) {
    for (i = firstNonNullIndexK; i < firstNonNullIndexK + (stochLength - 2); ++i) {
      output[i][0] = null;
      output[i][1] = null;
    }

    for (i = firstNonNullIndexK + (stochLength - 2); i < firstNonNullIndexK + (stochLength - 2) + (smoothD - 1); ++i) {
      output[i][1] = null;
    }
  }
  //end investagrams
  
  if (hasHeader) {
    output.unshift([Utilities.formatString('Stoch RSI(%s, %s, %s, %s)', rsiLength, stochLength, smoothK, smoothD) + "\n" + "K", "D"]);
  }

  console.log("output...");
  console.log(output);
  return output;
}

function cmf(stockCode, length = 20, hasHeader = true) {
  let high, low, close, volume;

  if (typeof stockCode === "string") {
    [high, low, close, volume] = ImportJSON(stockCode, "high/low/close/volume", true);
  } else if (Array.isArray(stockCode)) {
    [high, low, close, volume] = stockCode;
  }
  
  let AD = [], volumes = [], output = [];
  let sumAD = 0, sumVolume = 0;
  
  for (let i = 0; i < high.length; ++i) {
    sumAD += 
      (close[i] == high[i] && close[i] == low[i]) || high[i] == low[i]
      ? 0
      : ((2 * close[i] - low[i] - high[i]) / (high[i] - low[i])) * volume[i];
    sumVolume += volume[i];
      
    if (i < length - 1) {
      //investagrams
      AD[i] = sumAD;
      volumes[i] = sumVolume;
      output[i] = AD[i] / volumes[i];

      //tradingview
      //AD[i] = volumes[i] = output[i] = null;
    } else {     
      AD[i] = sumAD;
      sumAD -= 
        (close[i-(length-1)] == high[i-(length-1)] && close[i-(length-1)] == low[i-(length-1)]) || high[i-(length-1)] == low[i-(length-1)]
        ? 0
        : ((2 * close[i-(length-1)] - low[i-(length-1)] - high[i-(length-1)]) / (high[i-(length-1)] - low[i-(length-1)])) * volume[i-(length-1)];
        
      volumes[i] = sumVolume;
      sumVolume -= volume[i-(length-1)];
      
      output[i] = AD[i] / volumes[i];
    }
  }
  
  if (hasHeader) {
    output.unshift(Utilities.formatString('CMF(%s)', length));
  }

  return output;
}


function mfi(stockCode, length = 14, hasHeader = true) {
  let input, volume;

  if (typeof stockCode === "string") {
    [input, volume] = ImportJSON(stockCode, "hlc3/volume", true);
  } else if (Array.isArray(stockCode)) {
    [input, volume] = stockCode;
  }
  
  let sumUpper = 0, sumLower = 0;
  let upper = [], lower = [], output = [];
  
  for (let i = 0; i < input.length; ++i) {
    sumUpper += volume[i] * (input[i] - input[i-1] <= 0 ? 0 : input[i]);
    sumLower += volume[i] * (input[i] - input[i-1] >= 0 ? 0 : input[i]);
    
    if (i < length - 1) {
      //investagrams
      upper[i] = sumUpper;
      lower[i] = sumLower;
      output[i] = 100 - 100 / (1 + upper[i]/lower[i]);
      
      //tradingview
      //upper[i] = lower[i] = output[i] = null;
    } else {
      upper[i] = sumUpper;
      sumUpper -= volume[i-(length-1)] * (input[i-(length-1)] - input[(i-1)-(length-1)] <= 0 ? 0 : input[i-(length-1)]);
      
      lower[i] = sumLower;
      sumLower -= volume[i-(length-1)] * (input[i-(length-1)] - input[(i-1)-(length-1)] >= 0 ? 0 : input[i-(length-1)]);
      
      output[i] = 100 - 100 / (1 + upper[i]/lower[i]);
    }
  }
  
  if (hasHeader) {
    output.unshift(Utilities.formatString('MFI(%s)', length));
  }

  return output;
}

function cci(stockCode, length = 20, hasHeader = true) {
  let input;

  if (typeof stockCode === "string") {
    [input] = ImportJSON(stockCode, "hlc3", true);
  } else if (Array.isArray(stockCode)) {
    [input] = stockCode;
  }
  
  let means = sma([input], 20, "close",false);
  let output = (new Array(length - 1).fill(null));
  
  for (let i = length - 1; i < input.length; ++i) {
    output[i] = (input[i] - means[i]) / (0.015 * dev_(input.slice((i - length) + 1, i + 1), length));
  }
  
  if (hasHeader) {
    output.unshift(Utilities.formatString('CCI(%s)', length));
  }

  return output;
}

function efi(stockCode, length = 13, hasHeader = true) {
  let input, volume;

  if (typeof stockCode === "string") {
    [input, volume] = ImportJSON(stockCode, "close/volume", true);
  } else if (Array.isArray(stockCode)) {
    [input, volume] = stockCode;
  }
  
  let output = [];
  let alpha = 2 / (length + 1);
  let sum = 0;
  let i;
  
  for (i = 1; i <= length; ++i) {
    sum += (input[i] - input[i-1]) * volume[i];
    output[i] = null;
  }
  
  let value = sum / length
  output[length] = value;
  
  for (i = length + 1; i < input.length; ++i) {
    sum = (input[i] - input[i-1]) * volume[i];
    value = ((sum  - value) * alpha) + value;
    output[i] = value;
  }
  
  if (hasHeader) {
    output.unshift(Utilities.formatString('EFI(%s)', length));
  }

  return output;
}

function vwma(stockCode, length = 20, source = "close", hasHeader = true) {
  let input, volume;

  if (typeof stockCode === "string") {
    [input, volume] = ImportJSON(stockCode, source+"/volume", true);
  } else if (Array.isArray(stockCode)) {
    [input, volume] = stockCode;
  }
  
  let output = [];
  let sum = 0, volumeSum = 0;
  let i;

  for (i = 0; i < length; ++i) {
    sum += input[i] * volume[i];
    volumeSum += volume[i];
    output[i] = null;
  }
  
  output[length-1] = sum / volumeSum;
  
  for (i = length; i < input.length; ++i) {
    sum += input[i] * volume[i];
    sum -= input[i-length] * volume[i-length];
    volumeSum += volume[i];
    volumeSum -= volume[i-length];
    
    output[i] = sum / volumeSum;
  }

  if (hasHeader) {
    output.unshift(Utilities.formatString('VWMA(%s)', length));
  }

  return output;
}

function roc(stockCode, length = 9, source = "close", hasHeader = true) {
  let input;

  if (typeof stockCode === "string") {
    [input] = ImportJSON(stockCode, source, true);
  } else if (Array.isArray(stockCode)) {
    [input] = stockCode;
  }
  
  let output = (new Array(length).fill(null));
  
  for (let i = length; i < input.length; ++i) {
    output[i] = 100 * (input[i] - input[i-length]) / input[i-length];
  }
  
  if (hasHeader) {
    output.unshift(Utilities.formatString('ROC(%s)', length));
  }

  return output;
}

function mom(stockCode, length = 10, source = "close", hasHeader = true) {
  let input;

  if (typeof stockCode === "string") {
    [input] = ImportJSON(stockCode, source, true);
  } else if (Array.isArray(stockCode)) {
    [input] = stockCode;
  }
  
  let output = (new Array(length).fill(null));
  
  for (let i = length; i < input.length; ++i) {
    output[i] = input[i] - input[i-length];
  }
  
  if (hasHeader) {
    output.unshift(Utilities.formatString('Mom(%s)', length));
  }

  return output;
}

function stoch(stockCode, periodK = 14, periodD = 3, smoothK = 3, hasHeader = true) {
   let highs, lows, close;

  if (typeof stockCode === "string") {
    [highs, lows, close] = ImportJSON(stockCode, "high/low/close", true);
  } else if (Array.isArray(stockCode)) {
    [highs, lows, close] = stockCode;
  }

  let stochK = [], percentK = [], percentD = [];
  let sumStochK = 0, sumPercentK = 0, max, min;
  let stochKSkip = 0;
  
  for (let i = 0; i < highs.length; ++i) {
    if (i < periodK - 1) {
      stochK[i] = null;
      percentK[i] = null;
      percentD[i] = null;
    } else {
      max = Math.max(...highs.slice((i - periodK) + 1, i + 1).filter(Number.isFinite));
      min = Math.min(...lows.slice((i - periodK) + 1, i + 1).filter(Number.isFinite));
      stochK[i] = 100 * ((close[i] - min) / (max - min));

      if (Number.isNaN(stochK[i])) {
        stochK[i] = null;
        percentK[i] = null;
        percentD[i] = null;
        ++stochKSkip;
        continue;
      }

      sumStochK += stochK[i];
      
      if (i >= (periodK + smoothK) - 2 + stochKSkip) {
        percentK[i] = sumStochK / smoothK;
        sumPercentK += percentK[i];
        sumStochK -= stochK[i-(smoothK - 1)];
      } else {
        percentK[i] = null;
      }
      
      if (i >= (periodK + smoothK + periodD) - 3 + stochKSkip) {
        percentD[i] = sumPercentK / periodD;
        sumPercentK -= percentK[i-(periodD - 1)];
      } else {
        percentD[i] = null;
      }
    }
  }
  
  let output = transpose_([percentK, percentD]);
  
  if (hasHeader) {
    output.unshift([Utilities.formatString('Stoch(%s, %s, %s)', periodK, periodD, smoothK) + "\n" + "%K", "%D"]);
  }

  return output;
}


function dc(stockCode, length = 20, hasHeader = true) {
  let highs, lows;

  if (typeof stockCode === "string") {
    [highs, lows] = ImportJSON(stockCode, "high/low", true);
  } else if (Array.isArray(stockCode)) {
    [highs, lows] = stockCode;
  }
  
  let basis = [], upper = [], lower = [];
  
  for (i = 0; i < highs.length; ++i) {
    if (i < length - 1) {
      basis[i] = upper[i] = lower[i] = null;
    } else {
      upper[i] = Math.max(...highs.slice((i - length) + 1, i + 1));
      lower[i] = Math.min(...lows.slice((i - length) + 1, i + 1));
      basis[i] = (upper[i] + lower[i]) / 2;
    }
  }
  
  let output = transpose_([basis, upper, lower]);
  
  if (hasHeader) {
    output.unshift([Utilities.formatString('DC(%s)', length) + "\n" + "Median", "Upper", "Lower"]);
  }
  
  return output;
}

function bb(stockCode, length = 20, mult = 2, source = "close", hasHeader = true) {
  let input;

  if (typeof stockCode === "string") {
    [input] = ImportJSON(stockCode, source, true);
  } else if (Array.isArray(stockCode)) {
    [input] = stockCode;
  }

  let basis = [], upper = [], lower = [];
  let sum = 0;
  let i, stdDev, value;
  
  for (i = 0; i < length; ++i) {
    sum += input[i];
    basis[i] = upper[i] = lower[i] = null;
  }
  
  basis[length-1] = sum / length;
  stdDev = mult * stdev_(input.slice(0, length));
  upper[length-1] = basis[i-1] + stdDev;
  lower[length-1] = basis[i-1] - stdDev;
  
  for (i = length; i < input.length; ++i) {
    sum = (sum + input[i]) - input[i - length];
    basis[i] = sum / length;
    stdDev = mult * stdev_(input.slice((i - length) + 1, i + 1));
    upper[i] = basis[i] + stdDev;
    lower[i] = basis[i] - stdDev;
  }

  let output = transpose_([basis, upper, lower]);
  
  if (hasHeader) {
    output.unshift([Utilities.formatString('BB(%s, %s, %s)', length, mult, source) + "\n" + "Median", "Upper", "Lower"]);
  }
  
  return output;
}

function ichimoku(stockCode, conversionLinePeriods = 9, baseLinePeriods = 26, laggingSpan2Periods = 52, displacement = 26, hasHeader = true) {
  let hlc;

  if (typeof stockCode === "string") {
    hlc = ImportJSON(stockCode, "high/low/close", true);
  } else if (Array.isArray(stockCode)) {
    hlc = stockCode;
  }

  let conversionLine = [], baseLine = [], leadingSpanA = [], leadingSpanB = [], laggingSpan = [];
  let [highs, lows, close] = hlc;
  let maxConversion, minConversion, maxBase, minBase, maxLeadSpanB, minLeadSpanB;

  for (let i = 0, j = 0; i < highs.length; ++i) {
    if (i < conversionLinePeriods - 1) {
      conversionLine[i] = null;
    } else {
      maxConversion = Math.max(...highs.slice((i - conversionLinePeriods) + 1, i + 1));
      minConversion = Math.min(...lows.slice((i - conversionLinePeriods) + 1, i + 1));
      conversionLine[i] = (maxConversion + minConversion) / 2;
    }

    if (i < baseLinePeriods - 1) {
      baseLine[i] = null;
    } else {
      maxBase = Math.max(...highs.slice((i - baseLinePeriods) + 1, i + 1));
      minBase = Math.min(...lows.slice((i - baseLinePeriods) + 1, i + 1));
      baseLine[i] = (maxBase + minBase) / 2;
    }
    
    //insert rows before start (displacement)
    if (i >= displacement) {
      laggingSpan[j++] = close[i];
    }

    if (conversionLine[i] !== null && baseLine[i] !== null) {
      leadingSpanA[i] = (conversionLine[i] + baseLine[i]) / 2;
    } else {
      leadingSpanA[i] = null;
    }

    if (i < laggingSpan2Periods - 1) {
      leadingSpanB[i] = null;
    } else {
      maxLeadSpanB = Math.max(...highs.slice((i - laggingSpan2Periods) + 1, i + 1));
      minLeadSpanB = Math.min(...lows.slice((i - laggingSpan2Periods) + 1, i + 1));
      leadingSpanB[i] = (maxLeadSpanB + minLeadSpanB) / 2;
    }
  }

  conversionLine.push(...new Array(displacement).fill(null));
  leadingSpanA.unshift(...new Array(displacement).fill(null));
  leadingSpanB.unshift(...new Array(displacement).fill(null));
  let output = transpose_([conversionLine, baseLine, laggingSpan, leadingSpanA, leadingSpanB]);

  if (hasHeader) {
    output.unshift(
      [
        Utilities.formatString(
          'Ichimoku(%s, %s)',
          conversionLinePeriods, baseLinePeriods, laggingSpan2Periods
        ) + "\n" + "Conversion Line", "Base Line", "Lagging Span", "Leading Span A", "Leading Span B"
      ]
    );
  }

  return output;
}

function chop(stockCode, length = 14, hasHeader = true) {
  let hlc;

  if (typeof stockCode === "string") {
    hlc = ImportJSON(stockCode, "high/low/close", true);
  } else if (Array.isArray(stockCode)) {
    hlc = stockCode;
  }
  
  let output = (new Array(length).fill(null));
  let atr1 = atr(hlc, 1, false);
  let [highs, lows] = hlc;
  let sum = 0;
  let max = highs[0];
  let min = lows[0];
  let i;
  
  for (i = 0; i < length; ++i) {
    max = Math.max(max, highs[i]);
    min = Math.min(min, lows[i]);
    sum += (atr1[i] !== undefined) ? atr1[i] : 0;
  }
  
  output[length-1] = 100 * Math.log10(sum / (max - min)) / Math.log10(length);

  for (i = length; i < highs.length; ++i) {
    max = Math.max(...highs.slice((i - length) + 1, i + 1));
    min = Math.min(...lows.slice((i - length) + 1, i + 1));
    sum += (atr1[i] !== undefined) ? atr1[i] : 0;
    sum -= (atr1[i - length] !== undefined) ? atr1[i - length] : 0;
    output[i] = 100 * Math.log10(sum / (max - min)) / Math.log10(length);
  }

  if (hasHeader) {
    output.unshift(Utilities.formatString('CHOP(%s)', length));
  }

  return output;
}

function alma(stockCode, windowSize = 9, offset = 0.85, sigma = 6, hasHeader = true) {
  let input;

  if (typeof stockCode === "string") {
    [input] = ImportJSON(stockCode, "close", true);
  } else if (Array.isArray(stockCode)) {
    [input] = stockCode;
  }

  let m = Math.floor(offset * (windowSize - 1));
  let s = windowSize / sigma;
  let norm = 0;
  let sum = 0;
  let weight;
  let output = (new Array(windowSize - 1).fill(null));
  
  for (let i = windowSize - 1; i < input.length; ++i) {
    norm = 0;
    sum = 0;

    for (let j = 0; j <= windowSize - 1; ++j) {
      weight = Math.exp(-((j - m) ** 2) / (2 * (s ** 2)));
      norm += weight;
      sum += input[i - (windowSize - j - 1)] * weight;
    }
    
    output[i] = sum / norm;
  }

  if (hasHeader) {
    output.unshift(Utilities.formatString('ALMA(%s, %s, %s)', windowSize, offset, sigma));
  }

  return output;
}

function dmi(stockCode, diLength = 14, adxSmoothing = 14, hasHeader = true) {
  let hlc = ImportJSON(stockCode, "high/low/close", true);
  let tr_rma = rma_(tr_(hlc), diLength, false);
  let dmplus_rma = rma_(dmplus_(hlc), diLength);
  let dmminus_rma = rma_(dmminus_(hlc), diLength);
  
  let diplus = (new Array(diLength).fill(null));
  let diminus = (new Array(diLength).fill(null));
  let sum;
  let diplusminus = (new Array(diLength).fill(null));
  
  for (let i = diLength; i < hlc[0].length; ++i) {
    diplus[i] = 100 * (dmplus_rma[i] / tr_rma[i]);
    diminus[i] = 100 * (dmminus_rma[i] / tr_rma[i]);
    sum = diplus[i] + diminus[i];
    diplusminus[i] = Math.abs(diplus[i] - diminus[i]) / (sum === 0 ? 1 : sum);
  }
  
  let adx = (rma_(diplusminus.slice(diLength - 1), adxSmoothing, false)).map(value => (value !== null) ? value * 100 : null);
  adx[adxSmoothing - 1] = null;
  adx.unshift(...(new Array(diLength - 1).fill(null)));
  
  let output = transpose_([diplus, diminus, adx]);

  if (hasHeader) {
    output.unshift([Utilities.formatString('DMI(%s, %s)', diLength, adxSmoothing) + "\n" + "+DI", "-DI", "ADX"])
  }

  return output;
}

function atr(stockCode, length = 14, hasHeader = true) {
  let hlc;

  if (typeof stockCode === "string") {
    hlc = ImportJSON(stockCode, "high/low/close", true);
  } else if (Array.isArray(stockCode)) {
    hlc = stockCode;
  }

  let tr = tr_(hlc);
  let size = hlc[0].length;
  let output = (new Array(length - 1).fill(null));
  let alpha = 1 / length;

  if (length < 1) {
    throw new Error("length must be greater than 1");
  }
  if (size <= length - 1) {
    return output;
  }

  let value = (length === 1) ? 0 : avg_(tr.slice(0, length), false);

  for (let i = length; i < size; ++i) {
    //value = ((value * (length - 1)) + tr[i]) * alpha;
    value = ((tr[i] - value) * alpha) + value;
    output[i] = value;
  }

  if (hasHeader) {
    output.unshift(Utilities.formatString('ATR(%s)', length));
  }

  return output;
}

function psar(stockCode, start = 0.02, increment = 0.02, maximum = 0.2, hasHeader = true) {
  //bug if start = 0 or maximum = 0
  let highs, lows;

  if (typeof stockCode === "string") {
    [highs, lows] = ImportJSON(stockCode, "high/low", true);
  } else if (Array.isArray(stockCode)) {
    [highs, lows] = stockCode;
  }

  let output = [];
  let isUptrend = highs[0] < highs[1];
  let accelerationFactor = 0;
  let extremePoint = isUptrend ? highs[0] : lows[0];

  output[0] = isUptrend ? lows[0] : highs[0];

  //highs.length === lows.length
  for (let i = 1; i < highs.length; ++i) {
    if (isUptrend) {
      if (highs[i] > extremePoint) {
        extremePoint = highs[i];
        accelerationFactor = Math.min((accelerationFactor === 0 ?  start : accelerationFactor + increment), maximum);
      }
      
      output[i] = output[i-1] + (accelerationFactor * (extremePoint - output[i-1]));
      
      if (output[i] > lows[i]) {
        output[i] = lows[i];
        
        if (output[i] <= output[i-1]) {
          output[i] = extremePoint;
          isUptrend = false;
          accelerationFactor = start;
          extremePoint = lows[i];
        }
      }
    } else {
      if (lows[i] < extremePoint) {
        extremePoint = lows[i];
        accelerationFactor = Math.min((accelerationFactor === 0 ?  start : accelerationFactor + increment), maximum);
      }
      
      output[i] = output[i-1] + (accelerationFactor * (extremePoint - output[i-1]));
      
      if (output[i] < highs[i]) {
        output[i] = highs[i];
        
        if (output[i] >= output[i-1]) {
          output[i] = extremePoint;
          isUptrend = true;
          accelerationFactor = start;
          extremePoint = highs[i];
        }
      }
    }
  }

  output[0] = null;
  
  if (hasHeader) {
    output.unshift(Utilities.formatString('PSAR(%s, %s, %s)', start, increment, maximum));
  }
  
  return output;
}

function macd(stockCode, fastLength = 12, slowLength = 26, source = "close", signalLength = 9, hasHeader = true) {
  let macd = [];
  let signal = [];
  let histogram = [];
  let output = [];
  
  let fastLengthEmaInput = ema(stockCode, fastLength, source, false);
  let slowLengthEmaInput = ema(stockCode, slowLength, source, false);

  //fastLengthEmaInput.length === slowLengthEmaInput.length
  for (let i = 0; i < fastLengthEmaInput.length; ++i) {
    if (fastLengthEmaInput[i] === null || slowLengthEmaInput[i] === null) {
      macd[i] = null;
    } else {
      macd[i] = fastLengthEmaInput[i] - slowLengthEmaInput[i];
    }
  }
  
  signal = ema([macd.filter(value => value !== null)], signalLength, null, false);
  signal = (new Array(macd.length - signal.length).fill(null)).concat(signal);

  //macd.length === signal.length
  for (let i = 0; i < macd.length; ++i) {
    if (macd[i] === null || signal[i] === null) {
      histogram[i] = null;
    } else {
      histogram[i] = macd[i] - signal[i];
    }
    
    output[i] = [histogram[i], macd[i], signal[i]];
  }
  
  if (hasHeader) {
    output.unshift([Utilities.formatString('MACD(%s, %s, %s, %s)', fastLength, slowLength, source, signalLength) + "\n" + "Histogram", "MACD", "SIGNAL"]);
  }
  
  return output;
}

function rsi(stockCode, length = 14, source = "close", hasHeader = true) {
  let input;

  if (typeof stockCode === "string") {
    [input] = ImportJSON(stockCode, source, true);
  } else if (Array.isArray(stockCode)) {
    [input] = stockCode;
  }

  let size = input.length;
  let output = [];
  let o = 0;
  let alpha = 1 / length;
  
  if (length < 1) {
    throw new Error("length must be greater than 1");
  }
  if (size <= length) {
    return output;
  }
  
  let smoothUp = 0;
  let smoothDown = 0;
  let upward;
  let downward;
  
  let i;
  for (i = 1; i <= length; ++i) {
    upward = input[i] > input[i-1] ? input[i] - input[i-1] : 0;
    downward = input[i] < input[i-1] ? input[i-1] - input[i] : 0;
    smoothUp += upward;
    smoothDown += downward;
    output[o++] = null;
  }
  
  smoothUp /= length;
  smoothDown /= length;
  output[o] = 100 * (smoothUp / (smoothUp + smoothDown));
  
  for (i = length + 1; i < size; ++i) {
    upward = input[i] > input[i-1] ? input[i] - input[i-1] : 0;
    downward = input[i] < input[i-1] ? input[i-1] - input[i] : 0;
    smoothUp = (upward - smoothUp) * alpha + smoothUp;
    smoothDown = (downward - smoothDown) * alpha + smoothDown;
    output[++o] = 100 * (smoothUp / (smoothUp + smoothDown));
  }
  
  if (hasHeader) {
    output.unshift(Utilities.formatString('RSI(%s, %s)', length, source));
  }
  
  return output;
}

function sma(stockCode, length = 9, source = "close", hasHeader = true) {
  let input;

  if (typeof stockCode === "string") {
    [input] = ImportJSON(stockCode, source, true);
  } else if (Array.isArray(stockCode)) {
    [input] = stockCode;
  }

  let size = input.length;
  let output = (new Array(length - 1).fill(null));
  let alpha = 1 / length;

  if (length < 1) {
    throw new Error("length must be greater than 1");
  }
  if (size <= length - 1) {
    return output;
  }

  //change to for loop
  let sum = (input.slice(0, length)).reduce((accumulator, currentValue) => accumulator + currentValue);
  output[length - 1] = avg_(input.slice(0, length));

  for (i = length; i < size; ++i) {
    sum += input[i];
    sum -= input[i - length];
    output[i] = sum * alpha;
  }

  if (hasHeader) {
    output.unshift(Utilities.formatString('SMA(%s, %s)', length, source));
  }
  
  return output;
}

function ema(stockCode, length = 9, source = "close", hasHeader = true) {
  let input;

  if (typeof stockCode === "string") {
    [input] = ImportJSON(stockCode, source, true);
  } else if (Array.isArray(stockCode)) {
    [input] = stockCode;
  }

  let size = input.length;
  let output = (new Array(length - 1).fill(null));

  if (length < 1) {
    throw new Error("length must be greater than 1");
  }
  if (size <= length - 1) {
    return output;
  }
  
  let alpha = 2 / (length + 1);
  let value = avg_(input.slice(0, length));

  output[length - 1] = value;

  for (let i = length; i < size; ++i) {
    value = ((input[i] - value) * alpha) + value;
    output[i] = value;
  }

  if (hasHeader) {
    output.unshift(Utilities.formatString('EMA(%s, %s)', length, source));
  }

  return output;
}