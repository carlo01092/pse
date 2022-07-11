$total_saves = 0;
$stocks_counter = 0;

Get-Content .\stock.txt | ForEach-Object {

    $is_file1_exists = [System.IO.File]::Exists("$PWD\json\$_.json")
    $is_file2_exists = [System.IO.File]::Exists("$PWD\json2\$_.json")

    if ($is_file2_exists) {
        if ($is_file1_exists) {
            $json_data1 = (Get-Content .\json\$_.json) | ConvertFrom-Json
        }

        $json_data2 = (Get-Content .\json2\$_.json) | ConvertFrom-Json

        if (
            $json_data2.t.Length -eq
            $json_data2.o.Length -eq
            $json_data2.h.Length -eq
            $json_data2.l.Length -eq
            $json_data2.c.Length -eq
            $json_data2.v.Length
        ) {
            if ($is_file1_exists) {
                $json_data1.PSObject.Properties.Name | ForEach-Object {$json_data1.$_ += $json_data2.$_}
                (ConvertTo-Json -InputObject $json_data1 -Compress) | Set-Content .\json\$_.json
            } else {
                Copy-Item "$PWD\json2\$_.json" -Destination "$PWD\json"
            }

            Write-Host "$_ saved"
            ++$total_saves
        } else {
            Write-Warning "$_ objects unequal (!json.object.Length)"
        }
    } else {
        Write-Warning "$_ not found (!symbol)"
    }

    ++$stocks_counter
}

Write-Host "$total_saves/$stocks_counter total saves"
