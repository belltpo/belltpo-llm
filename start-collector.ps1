Set-Location "C:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\collector"
Write-Host "Starting collector service..."
try {
    & node index.js
    Write-Host "Collector started successfully"
} catch {
    Write-Host "Error starting collector: $_"
}
Read-Host "Press Enter to continue"
