function backtest(stockCode="MM", is_exact_shares=true, buy_condition, sell_condition) {
  //current strategy is buy if above SMA(10) and sell below SMA(10) [close]
  let stockData = ImportJSON(stockCode, "close", "false", "false");
  let indicatorResult = sma(stockData, 10, "close", false);
  let output = [];
  let latestTradeAction = "";
  let winRate = [0, 0]; //[win, lose]
  let broker = "col";

  let charge = 0;
  let hidden_charge = 0; //confirm GAIN/LOSS if from Market Value or Net Value (buy)
  let net = 0;
  let market = 0;

  let strategy = {
    "cash_position": STRATEGY.initial_capital,
    "quantity_type": STRATEGY.quantity_type,
    "quantity_value": STRATEGY.quantity_value,
    "equity": STRATEGY.initial_capital,
    "bought_price": 0,
    "bought_shares": 0,
    "bought_amount": 0,
    "sold_price": 0,
    "sold_amount": 0
  };

  for (let i = 0; i < stockData[0].length; ++i) {
    if (indicatorResult[i] === null) {
      output[i] = null;
    } else if (indicatorResult[i] < stockData[0][i]) {
      output[i] = [(latestTradeAction === TRADE_ACTION.buy) ? TRADE_ACTION.wait : TRADE_ACTION.buy];
      latestTradeAction = TRADE_ACTION.buy;
    } else {
      output[i] = [(latestTradeAction === TRADE_ACTION.sell) ? TRADE_ACTION.wait : TRADE_ACTION.sell];
      latestTradeAction = TRADE_ACTION.sell;
    }

    if (indicatorResult[i] !== null) {
      if (output[i][0] === TRADE_ACTION.buy) {
        strategy.bought_price = stockData[0][i];
        [strategy.bought_shares, strategy.bought_amount] = compute_buy_value_(strategy, is_exact_shares);

        charge = compute_buy_charge_(strategy.bought_shares, strategy.bought_price, strategy.bought_amount, is_exact_shares, broker);
        net = strategy.bought_amount + charge;
        market = (net/ strategy.bought_shares).round(4) * strategy.bought_shares;
        hidden_charge = market - net;

        strategy.cash_position -= net;
        strategy.equity = strategy.cash_position + net;

        output[i][3] = strategy.bought_amount;
        output[i][4] = net;
        output[i][5] = market;
        output[i][6] = charge;
        output[i][7] = strategy.cash_position;
        output[i][8] = strategy.equity;
      } else if(output[i][0] === TRADE_ACTION.sell) {
        strategy.sold_price = stockData[0][i];
        strategy.sold_amount = compute_sell_value_(strategy, is_exact_shares);

        charge = compute_sell_charge_(strategy.bought_shares, strategy.sold_price, strategy.sold_amount, is_exact_shares, broker);
        net = strategy.sold_amount - charge;

        strategy.cash_position += net - hidden_charge;
        strategy.equity = strategy.cash_position;

        //output[i][1] = ((stockData[0][i] - strategy.bought_price) / strategy.bought_price * 100);
        output[i][1] = ((net - market) / market) * 100;
        //output[i][2] = strategy.sold_amount - strategy.bought_amount;
        output[i][2] = net - market;
        output[i][3] = strategy.sold_amount;
        output[i][4] = net;
        output[i][5] = null;
        output[i][6] = charge;
        output[i][7] = strategy.cash_position;
        output[i][8] = strategy.equity;

        if (output[i][1] > 0) {
          ++winRate[0];
        } else {
          ++winRate[1];
        }
      }
    }
  }

  let winRatePercentage = ((winRate[0] / (winRate[0] + winRate[1])) * 100).round(0);
  output.unshift([
    Utilities.formatString("backtest (%s%)", winRatePercentage),
    "Gain/Loss %",
    "Gain/Loss Value",
    "Gross Value",
    "Net Value",
    "Market Value",
    "Charge",
    Utilities.formatString("Cash (%s)", STRATEGY.initial_capital),
    Utilities.formatString("Equity (%s)", STRATEGY.initial_capital)
  ]);
  return output;
}

function compute_buy_value_(strategy, is_exact_shares) {
  let shares = compute_exact_shares_(strategy);
  let amount = 0;

  if (strategy.quantity_type === QUANTITY_TYPE.cash) {
    amount = is_exact_shares ? (shares * strategy.bought_price) : strategy.quantity_value;
  } else if (strategy.quantity_type === QUANTITY_TYPE.fixed) {
    if (!is_exact_shares) {
      shares = strategy.quantity_value;
    }

    amount = shares * strategy.bought_price
  } else if (strategy.quantity_type === QUANTITY_TYPE.equity_percentage) {
    amount = is_exact_shares ? (shares * strategy.bought_price) : (strategy.quantity_value / 100) * strategy.equity;
  }

  return [shares, amount];
}

function compute_sell_value_(strategy, is_exact_shares) {
  let gain_loss = ((strategy.sold_price - strategy.bought_price) / strategy.bought_price * 100).round();
  let shares = strategy.bought_shares;
  let amount = 0;

  if (strategy.quantity_type === QUANTITY_TYPE.cash || strategy.quantity_type === QUANTITY_TYPE.equity_percentage) {
    amount = is_exact_shares ? (shares * strategy.sold_price) : (strategy.bought_amount + ((gain_loss / 100) * strategy.bought_amount));
  } else if (strategy.quantity_type === QUANTITY_TYPE.fixed) {
    if (!is_exact_shares) {
      shares = strategy.quantity_value;
    }

    amount = shares * strategy.sold_price;
  }

  return amount;
}

function compute_exact_shares_(strategy) {
  let boardLot = get_board_lot(strategy.bought_price);

  if (strategy.quantity_type === QUANTITY_TYPE.cash) {
    return (Math.floor((strategy.quantity_value / strategy.bought_price) / boardLot) * boardLot);
  } else if (strategy.quantity_type === QUANTITY_TYPE.fixed) {
    return (Math.floor(strategy.quantity_value / boardLot) * boardLot);
  } else if (strategy.quantity_type === QUANTITY_TYPE.equity_percentage) {
    let amount = (strategy.quantity_value / 100) * strategy.equity;

    return (Math.floor((amount / strategy.bought_price) / boardLot) * boardLot);
  }
}

