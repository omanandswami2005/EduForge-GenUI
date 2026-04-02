$ErrorActionPreference = 'Stop'
$token = (gcloud auth print-access-token).Trim()
Write-Host "Got access token"

$body = @{
    signIn = @{
        email = @{
            enabled = $true
            passwordRequired = $true
        }
    }
} | ConvertTo-Json -Depth 5

$headers = @{
    Authorization = "Bearer $token"
    'Content-Type' = 'application/json'
    'x-goog-user-project' = 'eduforge-genui-2026'
}

# First, initialize Identity Platform
$initUri = 'https://identitytoolkit.googleapis.com/v2/projects/eduforge-genui-2026/identityPlatform:initializeAuth'
try {
    $initResp = Invoke-WebRequest -Uri $initUri -Method Post -Headers $headers -Body '{}' -UseBasicParsing
    Write-Host "Identity Platform initialized: $($initResp.Content)"
} catch {
    Write-Host "Init note: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        Write-Host "Init response: $($reader.ReadToEnd())"
    }
}

# Now enable email/password sign-in
$uri = 'https://identitytoolkit.googleapis.com/admin/v2/projects/eduforge-genui-2026/config?updateMask=signIn.email'
try {
    $response = Invoke-WebRequest -Uri $uri -Method Patch -Headers $headers -Body $body -UseBasicParsing
    Write-Host "SUCCESS: Firebase Auth email/password enabled"
    Write-Host $response.Content
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        Write-Host "Response: $($reader.ReadToEnd())"
    }
}
