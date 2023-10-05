// add empty row for ichimoku's displacement
//change all variables to snake_case

function ImportJSON(stockCode="MM", returned = "t/o/h/l/c/v", isTransposed = false, hasHeader = true) {
  let path = MASTER_PATH + stockCode + ".json";
  let stockJson = UrlFetchApp.fetch(path, {"headers": {"Authorization": "Basic " + Utilities.base64Encode(TOKEN)}});
  console.log(stockJson)
  let stockJsonData = JSON.parse(stockJson.getContentText());
  let sources = [];

  returned = returned.toLowerCase().split('/').filter(source => source.length > 0);

  for (const source of returned) {
    let hasKeyOrHeaderName =
      STOCK_FIELDS.find(fields => fields.key.toLowerCase() === source)
      || STOCK_FIELDS.find(fields => fields.header_name.toLowerCase() === source);

    if (hasKeyOrHeaderName) {
      if (!sources.includes(hasKeyOrHeaderName.key)) {
        sources.push(hasKeyOrHeaderName.key);
      } else {
        throw new Error("duplicate \"" + source + "\" source");
      }
    } else {
      throw new Error("\"" + source + "\" source not exists");
    }
  }

  let stockKeyNoSort = [];
  let stockDataNoSort = [];

  let hasDateRange = false; //CAN CAUSE INCORRECT COMPUTATION OF INDICATORS AND OTHER PRICE SOURCES (HL2, HLC3, OHLC4)

  let startDateString = "09-01-2020".split("-");
  let endDateString = "09-30-2020".split("-");

  let startDateUnix = (
    new Date(Date.UTC(parseInt(startDateString[2], 10), parseInt(startDateString[0], 10) - 1, parseInt(startDateString[1], 10)))
  ).getTime() / 1000;
  let endDateUnix = (
    new Date(Date.UTC(parseInt(endDateString[2], 10), parseInt(endDateString[0], 10) - 1, parseInt(endDateString[1], 10)))
  ).getTime() / 1000;

  let skippedData = [];

  for (const key in stockJsonData) {
    if (sources.includes(key)) {
      stockKeyNoSort.push(key);

      for (let i = 0, j = 0; i < stockJsonData[key].length; i++) {
        let value = stockJsonData[key][i];

        if (typeof value === "number") {
          if (hasDateRange && key === "t" && (value < startDateUnix || value > endDateUnix)) {
            skippedData.push(i);
            continue;
          } else if (hasDateRange && skippedData.includes(i)) {
            continue;
          }

          value = value.toString();

          if (key === "t") {
            value = Utilities.formatDate(new Date(value * 1000), "GMT", "MMMM dd, yyyy");
          }
        }

        if (stockDataNoSort[j] === undefined) {
          stockDataNoSort.push([value]);
        } else {
          stockDataNoSort[j].push(value);
        }

        j++;
      }
    }
  }

  //apply hasDateRange in other price sources
  for (const source of sources) {
    let priceSource = [];

    if (!stockKeyNoSort.includes(source)) {
      stockKeyNoSort.push(source);

      if (source === "n") {
        priceSource = Array.from(Array(stockDataNoSort.length), (_, i) => i + 1);
      } else if (source === "hl2") {
        priceSource = hl2_(stockJsonData.h, stockJsonData.l);
      } else if (source === "hlc3") {
        priceSource = hlc3_(stockJsonData.h, stockJsonData.l, stockJsonData.c);
      } else if (source === "ohlc4") {
        priceSource = ohlc4_(stockJsonData.o, stockJsonData.h, stockJsonData.l, stockJsonData.c);
      }

      for (let i = 0; i < priceSource.length; i++) {
        if (stockDataNoSort[i] === undefined) {
          stockDataNoSort.push([priceSource[i].toString()]);
        } else {
          stockDataNoSort[i].push(priceSource[i].toString());
        }
      }
    }
  }

  let stockHeader = [];
  let stockData = [];

  for (let i = 0; i < stockDataNoSort.length; i++) {
    let data = [];

    for (let j = 0; j < stockDataNoSort[i].length; j++) {
      let stockField = STOCK_FIELDS.find(fields => fields.key === stockKeyNoSort[j]);

      data.push({
        "value": (stockField.number ? Number(stockDataNoSort[i][j]) : stockDataNoSort[i][j]),
        "position": sources.indexOf(stockField.key)
      })
    }

    data.sort(function (a, b) {
      return a.position - b.position;
    });

    data = data.map(data => data.value);
    stockData.push(data);
  }

  if (!isTransposed && hasHeader) {
    sources.forEach(source => stockHeader.push(STOCK_FIELDS.find(fields => fields.key === source).header_name));
    stockData.unshift(stockHeader);
  }

  return (isTransposed ? transpose_(stockData) : stockData);
}
