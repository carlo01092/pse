function compute_buy_charge_(shares=10000, price=3.51, amount=35100, is_exact_shares=true, broker = "col") {
  let charges = CHARGES.find(c => c.broker === broker);
  
  if (charges === undefined) {
    charges = CHARGES.find(c => c.broker === "0");
  }

  let grossAmount = is_exact_shares ? (shares * price) : amount;
  let commision =
    ((grossAmount * charges.commision) < charges.minimum_commision)
    ? charges.minimum_commision
    : grossAmount * charges.commision;
  
  let buy_charges =
    commision.round()
    + (commision * charges.vat).round()
    + (grossAmount * charges.transaction_fee).round()
    + (grossAmount * charges.clearing_fee).round();
  
  return buy_charges;
}

function compute_sell_charge_(shares, price, amount, is_exact_shares, broker = "col") {
  let charges = CHARGES.find(c => c.broker === broker);
  
  if (charges === undefined) {
    charges = CHARGES.find(c => c.broker === "0");
  }

  let grossAmount = is_exact_shares ? (shares * price) : amount;
  let commision =
    ((grossAmount * charges.commision) < charges.minimum_commision)
    ? charges.minimum_commision
    : grossAmount * charges.commision;
  
  let sell_charges =
    commision.round()
    + (commision * charges.vat).round()
    + (grossAmount * charges.transaction_fee).round()
    + (grossAmount * charges.clearing_fee).round()
    + (grossAmount * charges.sales_tax).round();

  return sell_charges;
}

function charge(shares=7700, buyPrice=6.85, sellPrice=7.58, broker = "col") {
  let charges = CHARGES.find(c => c.broker === broker);
  let commision = 0;
  
  if (charges === undefined) {
    charges = CHARGES.find(c => c.broker === "0");
  }

  let output = {
    "buy": {
      "grossAmount": 0,
      "charges": 0,
      "netValue": 0,
      "averagePrice": 0,
      "marketValue": 0
    },
    "sell": {
      "grossAmount": 0,
      "charges": 0,
      "netValue": 0
    },
    "gainLossValue": 0,
    "gainLossPercentage": 0
  }

  output.buy.grossAmount = buyPrice * shares;

  commision =
    ((output.buy.grossAmount * charges.commision) < charges.minimum_commision)
    ? charges.minimum_commision
    : output.buy.grossAmount * charges.commision;
  
  output.buy.charges =
    commision.round()
    + (commision * charges.vat).round()
    + (output.buy.grossAmount * charges.transaction_fee).round()
    + (output.buy.grossAmount * charges.clearing_fee).round();

  output.buy.netValue = output.buy.grossAmount + output.buy.charges;
  output.buy.averagePrice = output.buy.netValue / shares;
  output.buy.marketValue = output.buy.averagePrice.round(4) * shares;

  output.sell.grossAmount = sellPrice * shares;

  commision =
    ((output.sell.grossAmount * charges.commision) < charges.minimum_commision)
    ? charges.minimum_commision
    : output.sell.grossAmount * charges.commision;

  output.sell.charges =
    commision.round()
    + (commision * charges.vat).round()
    + (output.sell.grossAmount * charges.transaction_fee).round()
    + (output.sell.grossAmount * charges.clearing_fee).round()
    + (output.sell.grossAmount * charges.sales_tax).round();

  output.sell.netValue = output.sell.grossAmount - output.sell.charges;

  output.gainLossValue = output.sell.netValue - output.buy.marketValue;
  output.gainLossPercentage = (output.gainLossValue / output.buy.marketValue) * 100;

  return output;
}

function risk(capital=100000, riskPercentage=5, entryPrice=3, cutPrice=1) {
  let riskAmount = capital * (riskPercentage * 0.01); 
  let output = {
    "riskAmount": riskAmount,
    "shares": riskAmount / (entryPrice - cutPrice)
  }

  return output;
}

function breakEvenPercentage(lossPercentage) {
  return (lossPercentage / (1 - (lossPercentage / 100)));
}
