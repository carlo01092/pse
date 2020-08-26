Add-Type -path "itextsharp.dll"
$file = "$PWD\stockQuotes_08262020.pdf"
$pdf = New-Object iTextSharp.text.pdf.pdfreader -ArgumentList "$file"
[iTextSharp.text.pdf.parser.PdfTextExtractor]::GetTextFromPage($pdf, 1)

#for ($page = 1; $page -le 1; $page++) {
#    $texto = [iTextSharp.text.pdf.parser.PdfTextExtractor]::GetTextFromPage($pdf,$page)
#   Write-Output $texto
#}

$pdf.Close()
