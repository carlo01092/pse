1. Log in to Investagrams (https://www.investagrams.com/Chart)
2. Open Chrome DevTools
3. In Sources Tab, "Save for overrides" this file (top\www.investagrams.com\Javascript\Common\MainSiteJavascript.js)
4. Append part 1 to MainSiteJavascript.js (then refresh)
5. Variables _lt6_jD1 and _lt6_jD2 has initial values of current reloaded symbol (check in console)
6. Run part 2 to Console to reset/empty the variables (_lt6_jD1, _lt6_jD2)
6. Go to Console, change Javascript context dropdown to tradingview_...
7. Run part 2.1 to Console to start scraping (make sure first _lt6_jD1 and _lt6_jD2 is empty) (current symbol must not start at first symbol (_lt6_activeStockSymbol[0]) to redirect/scrape). Wait till finished
8. change back Javascript context dropdown to top
9. Run part 3 to Console to start downloading all symbols and its info as json file (make sure to turn off "Ask where to save each file before downloading" at Chrome settings (chrome://settings/downloads) and allow Automatic downloads (Site settings))
