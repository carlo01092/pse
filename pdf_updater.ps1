$start_date = Get-Date "12/10/2020"
$end_date = Get-Date "15/01/2021" #or Get-Date only

$pdf_path = "$PWD\pdf\"
$json_path = "$PWD\json\"
$pdf_file = "stockQuotes_" + $start_date.ToString("MMddyyyy") + ".pdf"

$ohlcvvf_collector = @()

while ($start_date -le $end_date) {
    if ([System.IO.File]::Exists($pdf_path + $pdf_file)) {
        $ohlcvvf_collect = (.\pdf_reader.ps1 $pdf_file $true)

        if ($ohlcvvf_collect.Length -eq 0) {
            Write-Host "$start_date" -ForegroundColor Red
        } else {
            Write-Host "$start_date"
            $ohlcvvf_collector += (.\pdf_reader.ps1 $pdf_file $true)
        }
    } else {
        Write-Host "$start_date" -ForegroundColor Yellow
    }

    $start_date = $start_date.AddDays(1)
    $pdf_file = "stockQuotes_" + $start_date.ToString("MMddyyyy") + ".pdf"
}
