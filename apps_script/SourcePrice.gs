function hl2_(highPrices, lowPrices) {
  let outputPrices = [];
  
  if (highPrices.length === lowPrices.length) {
    for (let i = 0; i < highPrices.length; i++) {
      outputPrices[i] = (highPrices[i] + lowPrices[i]) / 2;
    }
  } else {
    throw new Error("price length not equal");
  }
  
  return outputPrices;
}

function hlc3_(highPrices, lowPrices, closePrices) {
  let outputPrices = [];
  
  if (highPrices.length === lowPrices.length && lowPrices.length === closePrices.length) {
    for (let i = 0; i < highPrices.length; i++) {
      outputPrices[i] = (highPrices[i] + lowPrices[i] + closePrices[i]) / 3;
    }
  } else {
    throw new Error("price length not equal");
  }
  
  return outputPrices;
}

function ohlc4_(openPrices, highPrices, lowPrices, closePrices) {
  let outputPrices = [];
  
  if (openPrices.length === highPrices.length && highPrices.length === lowPrices.length && lowPrices.length === closePrices.length) {
    for (let i = 0; i < openPrices.length; i++) {
      outputPrices[i] = (openPrices[i] + highPrices[i] + lowPrices[i] + closePrices[i]) / 4;
    }
  } else {
    throw new Error("price length not equal");
  }
  
  return outputPrices;
}

function med_price(stockCode, hasHeader = true) {
  let output = ImportJSON(stockCode, "hl2", false, false);
  
  if (hasHeader) {
    output.unshift('Median Price');
  }

  return output;
}

function typ_price(stockCode, hasHeader = true) {
  let output = ImportJSON(stockCode, "hlc3", false, false);
  
  if (hasHeader) {
    output.unshift('Typical Price');
  }

  return output;
}

function avg_price(stockCode, hasHeader = true) {
  let output = ImportJSON(stockCode, "ohlc4", false, false);
  
  if (hasHeader) {
    output.unshift('Average Price');
  }

  return output;
}