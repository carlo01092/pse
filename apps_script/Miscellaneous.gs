/*
function getCurrentCell() {
  return SpreadsheetApp.getActiveSheet().getActiveCell().getA1Notation();
}
*/

function transpose_(a) {
  return a[0].map((_, c) => a.map(r => r[c]));
}

function tr_(input) {
  let [highs, lows, close] = input;
  let output = [null];

  //highs.length === lows.length  === close.length
  for (let i = 1; i < highs.length; ++i) {
    output[i] = Math.max(highs[i] - lows[i], Math.abs(highs[i] - close[i-1]), Math.abs(lows[i] - close[i-1]));
  }

  return output;
}

function avg_(input, nullAsZero = true) {
  let sum = 0;
  let count = 0;

  for (let i = 0; i < input.length; ++i) {
    if ((input[i] !== null) || input[i] === null && nullAsZero) {
      sum += input[i];
      ++count;
    }
  }

  return (sum / count);
}

function rma_(input, length = 14, nullAsZero = true) {
  let output = (new Array(length - 1).fill(null));
  let value = avg_(input.slice(0, length), nullAsZero);
  output[length - 1] = value;

  for (let i = length; i < input.length; ++i) {
    //value = (1/length) * input[i] + (1-(1/length)) * value;
    value = ((value * (length - 1)) + input[i]) / length;
    output[i] = value;
  }

  return output;
}

function dmplus_(input) {
  let [highs, lows] = input;
  let output = [null];
  let highDifference, lowDifference;
  
  for (let i = 1; i < highs.length; ++i) {
    highDifference = highs[i] - highs[i-1];
    lowDifference = -(lows[i] - lows[i - 1]);
    
    output[i] = (highDifference > lowDifference && highDifference > 0) ? highDifference : 0;
  }
  
  return output;
}

function dmminus_(input) {
  let [highs, lows] = input;
  let output = [null];
  let highDifference, lowDifference;
  
  for (let i = 1; i < highs.length; ++i) {
    highDifference = highs[i] - highs[i-1];
    lowDifference = -(lows[i] - lows[i - 1]);
    
    output[i] = (lowDifference > highDifference && lowDifference > 0) ? lowDifference : 0;
  }
  
  return output;
}

function stdev_(input) {
  return Math.sqrt(avg_(input.map(value => (value - avg_(input)) ** 2)));
}

function dev_(input) {
  let mean = avg_(input);

  return avg_(input.map(value => (Math.abs(value - mean)) ));
}

/*
function rsi_(input, length = 14) {
  let i, upwards = [null], downwards = [null], output = (new Array(length).fill(null));
  
  for (i = 1; i < input.length; ++i) {
    upwards[i] = Math.max(input[i] - input[i-1], 0);
    downwards[i] = Math.max(input[i-1] - input[i], 0);
  }
  
  let rmiUpwards = rma_(upwards, length, false);
  let rmiDownwards = rma_(downwards, length, false);
  
  for (i = length; i < rmiUpwards.length; ++i) {
    output[i] = 100 - 100 / (1 + rmiUpwards[i]/rmiDownwards[i]);
  }

  return output;
}
*/

function get_board_lot(price) {
  return BOARDLOT_PRICEFLUC.filter(bl_pf => price >= bl_pf.lower_bound && price <= bl_pf.upper_bound)[0].board_lot;
}

function get_price_fluctuation(price) {
  return BOARDLOT_PRICEFLUC.filter(bl_pf => price >= bl_pf.lower_bound && price <= bl_pf.upper_bound)[0].price_fluctuation;
}