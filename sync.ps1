$imagesFolder = "images"
$jsonFile = "images.json"
$currentDate = Get-Date -Format "yyyy-MM-dd"

# Ensure images folder exists
if (-not (Test-Path $imagesFolder)) {
    Write-Host "Images folder not found!" -ForegroundColor Red
    exit
}

# Load existing JSON or create empty array
if (Test-Path $jsonFile) {
    $existingData = Get-Content $jsonFile | ConvertFrom-Json
} else {
    $existingData = @()
}

# Get current files in images folder
$actualFiles = Get-ChildItem -Path $imagesFolder -Include *.png, *.jpg, *.jpeg, *.webp -File -Recurse | Select-Object -ExpandProperty Name

$newData = @()

# Process actual files
foreach ($file in $actualFiles) {
    # Check if this file already exists in JSON
    $existingEntry = $existingData | Where-Object { $_.filename -eq $file }
    
    if ($existingEntry) {
        # Keep existing metadata
        $newData += $existingEntry
    } else {
        # Create new entry with default data
        # Try to guess category and name from filename
        $cleanName = ($file -replace "\.[^.]+$", "" -replace "[-_]", " ")
        $cleanName = (Get-Culture).TextInfo.ToTitleCase($cleanName.ToLower())
        
        $newEntry = [PSCustomObject]@{
            id       = "img_$(Get-Random -Minimum 1000 -Maximum 9999)"
            name     = $cleanName
            category = "Uncategorized"
            filename = $file
            tags     = @("new")
            date     = $currentDate
        }
        $newData += $newEntry
        Write-Host "Added new image: $file" -ForegroundColor Green
    }
}

# Check for files in JSON that no longer exist
$missingCount = 0
foreach ($entry in $existingData) {
    if ($actualFiles -notcontains $entry.filename) {
        Write-Host "Removed missing file from JSON: $($entry.filename)" -ForegroundColor Yellow
        $missingCount++
    }
}

# Save updated JSON
$newData | ConvertTo-Json -Depth 5 | Out-File -FilePath $jsonFile -Encoding utf8
Write-Host "Sync complete! $($newData.Count) images tracked." -ForegroundColor Cyan
