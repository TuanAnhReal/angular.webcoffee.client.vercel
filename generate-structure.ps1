# ============================================
# GENERATE PROJECT STRUCTURE
# Angular + .NET Clean Tree Export
# ============================================

$OutputFile = "structure.txt"

# Danh sách thư mục/file cần loại bỏ
$ExcludeFolders = @(
    "bin",
    "obj",
    "node_modules",
    "dist",
    ".git",
    ".vs",
    ".angular",
    ".vscode",
    "coverage",
    "packages",
    "TestResults",
    "wwwroot\lib"
)

# Xóa file cũ nếu tồn tại
if (Test-Path $OutputFile) {
    Remove-Item $OutputFile
}

function Show-Tree {
    param (
        [string]$Path = ".",
        [string]$Indent = ""
    )

    $Items = Get-ChildItem $Path -Force | Where-Object {

        $FullPath = $_.FullName

        foreach ($Exclude in $ExcludeFolders) {
            if ($FullPath -like "*\$Exclude*") {
                return $false
            }
        }

        return $true
    }

    foreach ($Item in $Items) {

        $Line = "$Indent|-- $($Item.Name)"

        Add-Content -Path $OutputFile -Value $Line

        if ($Item.PSIsContainer) {
            Show-Tree -Path $Item.FullName -Indent "$Indent    "
        }
    }
}

# Ghi tiêu đề
Add-Content -Path $OutputFile -Value "PROJECT STRUCTURE"
Add-Content -Path $OutputFile -Value "================="
Add-Content -Path $OutputFile -Value ""

# Chạy
Show-Tree

Write-Host ""
Write-Host "DONE!"
Write-Host "File exported: $OutputFile"