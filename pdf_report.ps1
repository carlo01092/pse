$counter = 0;
$starting_id = 3219 #December 1 2016
$year = 2016
$last_id = 4131 #August 28 2020, $counter == 910

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

    "$file_name saved ($year$id)"
    ++$counter
}

"$counter total saves"
