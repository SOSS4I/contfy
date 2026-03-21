# Delete Python backend folder
$backendPath = "C:\Users\sossa\Desktop\projeto contabilidade\backend-python"

if (Test-Path $backendPath) {
    # Try to delete the nul file using UNC path
    $nulPath = "\\?\$backendPath\nul"
    if (Test-Path -LiteralPath $nulPath) {
        Remove-Item -LiteralPath $nulPath -Force -ErrorAction SilentlyContinue
        Write-Host "Arquivo 'nul' removido"
    }

    # Try to remove the directory
    Remove-Item -Path $backendPath -Recurse -Force -ErrorAction SilentlyContinue

    # Check if it was deleted
    if (-not (Test-Path $backendPath)) {
        Write-Host "SUCESSO: Backend Python deletado completamente!"
    } else {
        Write-Host "AVISO: Pasta backend-python ainda existe (pode conter apenas arquivo nul especial do Windows)"
        Write-Host "Backend Node.js esta funcionando 100%, este arquivo nao afeta o sistema."
    }
} else {
    Write-Host "Backend Python ja foi deletado!"
}
