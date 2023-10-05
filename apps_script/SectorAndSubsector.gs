function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

function main() {
  var SECTOR_ROWS = 9;
  var SUBSECTOR_ROWS = 28;
  
  var sheet_stock = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("stock");
  var sheet_sector= SpreadsheetApp.getActiveSpreadsheet().getSheetByName("sector");
  var sheet_subsector = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("subsector");
  
  var sector = {};
  var subsector = {};
  
  var row_start = 2;
  var row_end_stock = 274;
  
  /*
  for (var i = row_start; i <= SECTOR_ROWS; i++) {
  sector[ sheet_sector.getRange(i,1).getValue() ] = sheet_sector.getRange(i,2).getValue();
  }
  */
  
  for (var i = row_start; i <= SUBSECTOR_ROWS; i++) {
    subsector[ sheet_subsector.getRange(i,1).getValue() ] = sheet_subsector.getRange(i,2).getValue();
  }
  
  for (var i = row_start; i <= row_end_stock; i++) {
    //var cell = sheet_stock.getRange(i,4);
    var cell = sheet_stock.getRange(i,5);
    
    //cell.setValue(getKeyByValue(sector, cell.getValue()));
    cell.setValue(getKeyByValue(subsector, cell.getValue()));
  }
}