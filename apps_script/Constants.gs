const TOKEN = "";
const MASTER_PATH = "https://raw.githubusercontent.com/carlo01092/pse/master/json/";
const STOCK_FIELDS = [
  {
    "key": "n",
    "header_name": "No",
    "number": false
  },
  {
    "key": "t",
    "header_name": "Date",
    "number": false
  },
  {
    "key": "o",
    "header_name": "Open",
    "number": true
  },
  {
    "key": "h",
    "header_name": "High",
    "number": true
  },
  {
    "key": "l",
    "header_name": "Low",
    "number": true
  },
  {
    "key": "c",
    "header_name": "Close",
    "number": true
  },
  {
    "key": "v",
    "header_name": "Volume",
    "number": true
  },
  {
    "key": "hl2",
    "header_name": "HL2",
    "number": true,
  },
  {
    "key": "hlc3",
    "header_name": "HLC3",
    "number": true,
  },
  {
    "key": "ohlc4",
    "header_name": "ohlc4",
    "number": true
  },
];

// https://www.colfinancial.com/ape/final2/home/faq.asp#how_much_are_the_trade_charges
const CHARGES = [
  {
    "broker": "0",
    "minimum_commision": 0,
    "commision": 0,
    "vat": 0,
    "transaction_fee": 0,
    "clearing_fee": 0,
    "sales_tax": 0
  },
  {
    "broker": "col",
    "minimum_commision": 20,
    "commision": 0.0025,
    "vat": 0.12,
    "transaction_fee": 0.00005,
    "clearing_fee": 0.0001,
    "sales_tax": 0.006
  }
];

const TRADE_ACTION = {
  "buy": "BUY",
  "sell": "SELL",
  "hold": "HOLD",
  "wait": "WAIT",
  "long": "LONG",
  "short": "SHORT",
};

const QUANTITY_TYPE = {
  "fixed": "fixed",
  "cash": "cash",
  "equity_percentage": "equity_percentage"
}

const STRATEGY = {
  "initial_capital": 100000,
  "quantity_type": QUANTITY_TYPE.fixed,
  "quantity_value": 10000,
};

// https://www.colfinancial.com/ape/final2/home/online_trading.asp#board_lot_and_price_fluctuations
const BOARDLOT_PRICEFLUC = [
  {
    "lower_bound": 0.0001,
    "upper_bound": 0.0099,
    "board_lot": 1000000,
    "price_fluctuation": 0.0001
  },
  {
    "lower_bound": 0.01,
    "upper_bound": 0.049,
    "board_lot": 100000,
    "price_fluctuation": 0.001
  },
  {
    "lower_bound": 0.05,
    "upper_bound": 0.249,
    "board_lot": 10000,
    "price_fluctuation": 0.001
  },
  {
    "lower_bound": 0.25,
    "upper_bound": 0.495,
    "board_lot": 10000,
    "price_fluctuation": 0.005
  },
  {
    "lower_bound": 0.50,
    "upper_bound": 4.99,
    "board_lot": 1000,
    "price_fluctuation": 0.01
  },
  {
    "lower_bound": 5.00,
    "upper_bound": 9.99,
    "board_lot": 100,
    "price_fluctuation": 0.01
  },
  {
    "lower_bound": 10.00,
    "upper_bound": 19.98,
    "board_lot": 100,
    "price_fluctuation": 0.02
  },
  {
    "lower_bound": 20.00,
    "upper_bound": 49.95,
    "board_lot": 100,
    "price_fluctuation": 0.05
  },
  {
    "lower_bound": 50.00,
    "upper_bound": 99.95,
    "board_lot": 10,
    "price_fluctuation": 0.05
  },
  {
    "lower_bound": 100,
    "upper_bound": 199.9,
    "board_lot": 10,
    "price_fluctuation": 0.10
  },
  {
    "lower_bound": 200,
    "upper_bound": 499.8,
    "board_lot": 10,
    "price_fluctuation": 0.20
  },
  {
    "lower_bound": 500,
    "upper_bound": 999.5,
    "board_lot": 10,
    "price_fluctuation": 0.50
  },
  {
    "lower_bound": 1000,
    "upper_bound": 1999,
    "board_lot": 5,
    "price_fluctuation": 1
  },
  {
    "lower_bound": 2000,
    "upper_bound": 4998,
    "board_lot": 5,
    "price_fluctuation": 2
  },
  {
    "lower_bound": 5000,
    "upper_bound": Number.MAX_SAFE_INTEGER,
    "board_lot": 5,
    "price_fluctuation": 5
  },
];

Number.prototype.round = function(precision = 2) {
  let number = this.valueOf();

  if (precision === Infinity) {
    return number;
  }

  if (!Number.isInteger(precision)) {
    throw new TypeError('Expected precision to be an integer');
  }

  const isRoundingAndNegative = number < 0;
  if (isRoundingAndNegative) {
    number = Math.abs(number);
  }

  const power = 10 ** precision;

  let result = Math.round((number * power).toPrecision(15)) / power;

  if (isRoundingAndNegative) {
    result = -result;
  }

  return result;
};
