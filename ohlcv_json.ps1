#TODO, fix MAC because of stock dividends
$total_saves = 0;
$stocks_counter = 0;
$current_date_unix = [double]::Parse((Get-Date -Date "12:00:00 AM" -UFormat %s))
[double]$from_unix = 473472000 #January 2, 1985 12:00:00 AM

Get-Content .\stock.txt | ForEach-Object {
    $is_file_exists = [System.IO.File]::Exists("$PSScriptRoot\json\$_.json")

    if ($is_file_exists) {
        $json_data = (Get-Content .\json\$_.json) | ConvertFrom-Json
        $from_unix = $json_data.t[-1] + 86400
    }

    $response = Invoke-WebRequest -Uri "https://api.kisschart.com/api/chart/history?symbol=$_&resolution=D&from=$from_unix&to=$current_date_unix"

    if ($response.StatusCode -eq 200) {
        $fetched_json = $response.Content | ConvertFrom-Json

        if ($fetched_json.s -eq "ok") {
            $fetched_json.PSObject.Properties.Remove('s')

            if (
                $fetched_json.t.Length -eq
                $fetched_json.o.Length -eq
                $fetched_json.h.Length -eq
                $fetched_json.l.Length -eq
                $fetched_json.c.Length -eq
                $fetched_json.v.Length
            ) {
                if ($is_file_exists) {
                    $json_data.PSObject.Properties.Name | ForEach-Object {$json_data.$_ += $fetched_json.$_}
                    (ConvertTo-Json -InputObject $json_data -Compress) | Set-Content .\json\$_.json       
                } else {
                    $fetched_json = $fetched_json | ConvertTo-Json -Compress
                    $ohlcv_bytes =  [System.Text.Encoding]::UTF8.GetBytes($fetched_json + [Environment]::NewLine)
                    [System.IO.File]::WriteAllBytes("$PSScriptRoot\json\$_.json", $ohlcv_bytes)
                }

                "$_ saved"
                ++$total_saves
            } else {
                Write-Warning "$_ objects unequal (!json.object.Length)"
            }
        } else {
            Write-Warning "$_ not found (!symbol || !time)"
        }
    } else {
        Write-Warning "$_ not OK (!200)"
    }

    ++$stocks_counter
}

"$total_saves/$stocks_counter total saves"
