# Required Fonts

## Download with PowerShell (from project root):

```powershell
# Lora (serif display — headlines and numbers)
Invoke-WebRequest -Uri "https://fonts.gstatic.com/s/lora/v35/0QI6MX1D_JOxE7fSbyxlhWCEHI0.ttf" -OutFile "assets\fonts\Lora-Regular.ttf"
Invoke-WebRequest -Uri "https://fonts.gstatic.com/s/lora/v35/0QI6MX1D_JOxE7fSbyxluzCEHI0.ttf" -OutFile "assets\fonts\Lora-Bold.ttf"

# Inter (clean sans — labels and body)
Invoke-WebRequest -Uri "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2" -OutFile "assets\fonts\Inter-Regular.ttf"
Invoke-WebRequest -Uri "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2" -OutFile "assets\fonts\Inter-Medium.ttf"
Invoke-WebRequest -Uri "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2" -OutFile "assets\fonts\Inter-Bold.ttf"
```

Note: woff2 files work fine with expo-font on native.
