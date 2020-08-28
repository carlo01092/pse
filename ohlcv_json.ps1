$total_saves = 0;
$stocks_counter = 0;
$current_date_unix = [int][double]::Parse((Get-Date -Date "12:00:00 AM" -UFormat %s))

Get-Content .\stock.txt | ForEach-Object {
    $response = Invoke-WebRequest -Uri `
        "https://api.kisschart.com/api/chart/history?symbol=$_&resolution=D&from=473472000&to=$current_date_unix"

    if ($response.StatusCode -eq 200) {
        $ohlcv = $response.Content | ConvertFrom-Json

        if ($ohlcv.s -eq "ok") {
            $ohlcv.PSObject.Properties.Remove('s')
            $ohlcv_bytes =  [System.Text.Encoding]::UTF8.GetBytes(($ohlcv | ConvertTo-Json -Compress) + [Environment]::NewLine)
            [System.IO.File]::WriteAllBytes("$PSScriptRoot\json\$_.json", $ohlcv_bytes)
            "$_ saved"
            ++$total_saves
        } else {
            "$_ not ok"
        }
    } else {
        "$_ not found"
    }

    ++$stocks_counter
}

"$total_saves/$stocks_counter total saves"
