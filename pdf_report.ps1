#TODO, improve id incrementing (not including weekends & holidays)
$counter = 0;
#minimum 3219 (December 1 2016)
#December 1 2016 to September 30 2020, $counter == 930
$starting_id = 4138 #September 9 2020
$year = 2020
$last_id = 4150 #September 25 2020
$id_border = 3239, 3482, 3727, 3971

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

for ($id = $starting_id; $id -le $last_id; $id++) {
    if ($id -in $id_border) {
        ++$year
    }

    $url = "https://www.pse.com.ph" `
        +"/stockMarket/marketInfo-marketActivity-marketReports.html" `
        +"?ajax=true&method=downloadMarketReports&ids=[%22PSE_DQTRT$year$id%22]"

    $response = Invoke-WebRequest `
        -Uri "$url" `
        -Headers @{
            'Referer'= 'https/www.pse.com.ph/stockMarket/marketInfo-marketActivity.html?tab=4';
        } `
        -Method Get

    try {
        $file_name = [System.Net.Mime.ContentDisposition]::new($response.Headers['Content-Disposition']).FileName
        [System.IO.File]::WriteAllBytes("$PSScriptRoot\pdf\$file_name", $response.Content)
    }
    catch [System.IndexOutOfRangeException], [System.Management.Automation.MethodException] {
        continue
    }

    Write-Host "$file_name saved ($year$id)"
    ++$counter
}

Write-Host "$counter total saves"
