param(
    [string]$BaseUrl = 'http://localhost:8080'
)

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$captcha = Invoke-RestMethod -Uri "$BaseUrl/api/auth.php?action=captcha" `
    -WebSession $session `
    -Method Get `
    -TimeoutSec 10

if ([string]$captcha.question -notmatch '(\d+)\s*\+\s*(\d+)') {
    throw 'Could not parse the login security question.'
}

$answer = [int]$Matches[1] + [int]$Matches[2]
$payload = @{
    username = 'local_db_smoke_probe'
    password = 'not-a-real-password'
    captcha = $answer
} | ConvertTo-Json -Compress

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/auth.php?action=login" `
        -WebSession $session `
        -Method Post `
        -Body $payload `
        -ContentType 'application/json' `
        -UseBasicParsing `
        -TimeoutSec 15
    $statusCode = [int]$response.StatusCode
    $content = $response.Content
}
catch {
    $httpResponse = $_.Exception.Response
    if (-not $httpResponse) {
        throw
    }

    $statusCode = [int]$httpResponse.StatusCode
    $reader = New-Object System.IO.StreamReader($httpResponse.GetResponseStream())
    $content = $reader.ReadToEnd()
}

if ($statusCode -eq 503 -or $content -match 'Database connection failed') {
    throw 'Local authentication endpoint cannot connect to MySQL.'
}

if ($statusCode -ne 401 -or $content -notmatch 'Invalid username or password') {
    throw "Unexpected authentication probe response: HTTP $statusCode $content"
}

Write-Host 'PASS: localhost authentication reached MySQL successfully.'
