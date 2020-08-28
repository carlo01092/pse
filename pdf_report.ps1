$url = "https://www.pse.com.ph/stockMarket/marketInfo-marketActivity-marketReports.html?ajax=true&method=downloadMarketReports&ids=[%22PSE_DQTRT20204129%22]"

$response = Invoke-WebRequest `
    -Uri "$url" `
    -Headers @{
        'Referer'= 'https/www.pse.com.ph/stockMarket/marketInfo-marketActivity.html?tab=5';
    } `
    -Method Get

$file_name = [System.Net.Mime.ContentDisposition]::new($response.Headers['Content-Disposition']).FileName

[System.IO.File]::WriteAllBytes("C:\Users\CHARLES\Downloads\dev\$file_name", $response.Content)
