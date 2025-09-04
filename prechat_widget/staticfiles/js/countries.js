// Country data with flags and phone codes
const countries = [
    { code: 'US', name: 'United States', flag: '🇺🇸', phoneCode: '+1' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦', phoneCode: '+1' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', phoneCode: '+44' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪', phoneCode: '+49' },
    { code: 'FR', name: 'France', flag: '🇫🇷', phoneCode: '+33' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹', phoneCode: '+39' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸', phoneCode: '+34' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱', phoneCode: '+31' },
    { code: 'BE', name: 'Belgium', flag: '🇧🇪', phoneCode: '+32' },
    { code: 'CH', name: 'Switzerland', flag: '🇨🇭', phoneCode: '+41' },
    { code: 'AT', name: 'Austria', flag: '🇦🇹', phoneCode: '+43' },
    { code: 'SE', name: 'Sweden', flag: '🇸🇪', phoneCode: '+46' },
    { code: 'NO', name: 'Norway', flag: '🇳🇴', phoneCode: '+47' },
    { code: 'DK', name: 'Denmark', flag: '🇩🇰', phoneCode: '+45' },
    { code: 'FI', name: 'Finland', flag: '🇫🇮', phoneCode: '+358' },
    { code: 'PL', name: 'Poland', flag: '🇵🇱', phoneCode: '+48' },
    { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', phoneCode: '+420' },
    { code: 'HU', name: 'Hungary', flag: '🇭🇺', phoneCode: '+36' },
    { code: 'RO', name: 'Romania', flag: '🇷🇴', phoneCode: '+40' },
    { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', phoneCode: '+359' },
    { code: 'GR', name: 'Greece', flag: '🇬🇷', phoneCode: '+30' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹', phoneCode: '+351' },
    { code: 'IE', name: 'Ireland', flag: '🇮🇪', phoneCode: '+353' },
    { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', phoneCode: '+352' },
    { code: 'IN', name: 'India', flag: '🇮🇳', phoneCode: '+91' },
    { code: 'CN', name: 'China', flag: '🇨🇳', phoneCode: '+86' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵', phoneCode: '+81' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷', phoneCode: '+82' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺', phoneCode: '+61' },
    { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', phoneCode: '+64' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬', phoneCode: '+65' },
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾', phoneCode: '+60' },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭', phoneCode: '+66' },
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳', phoneCode: '+84' },
    { code: 'PH', name: 'Philippines', flag: '🇵🇭', phoneCode: '+63' },
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩', phoneCode: '+62' },
    { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', phoneCode: '+880' },
    { code: 'PK', name: 'Pakistan', flag: '🇵🇰', phoneCode: '+92' },
    { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', phoneCode: '+94' },
    { code: 'NP', name: 'Nepal', flag: '🇳🇵', phoneCode: '+977' },
    { code: 'AE', name: 'UAE', flag: '🇦🇪', phoneCode: '+971' },
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', phoneCode: '+966' },
    { code: 'QA', name: 'Qatar', flag: '🇶🇦', phoneCode: '+974' },
    { code: 'KW', name: 'Kuwait', flag: '🇰🇼', phoneCode: '+965' },
    { code: 'BH', name: 'Bahrain', flag: '🇧🇭', phoneCode: '+973' },
    { code: 'OM', name: 'Oman', flag: '🇴🇲', phoneCode: '+968' },
    { code: 'IL', name: 'Israel', flag: '🇮🇱', phoneCode: '+972' },
    { code: 'TR', name: 'Turkey', flag: '🇹🇷', phoneCode: '+90' },
    { code: 'EG', name: 'Egypt', flag: '🇪🇬', phoneCode: '+20' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦', phoneCode: '+27' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬', phoneCode: '+234' },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪', phoneCode: '+254' },
    { code: 'GH', name: 'Ghana', flag: '🇬🇭', phoneCode: '+233' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷', phoneCode: '+55' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷', phoneCode: '+54' },
    { code: 'CL', name: 'Chile', flag: '🇨🇱', phoneCode: '+56' },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴', phoneCode: '+57' },
    { code: 'PE', name: 'Peru', flag: '🇵🇪', phoneCode: '+51' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽', phoneCode: '+52' },
    { code: 'RU', name: 'Russia', flag: '🇷🇺', phoneCode: '+7' },
    { code: 'UA', name: 'Ukraine', flag: '🇺🇦', phoneCode: '+380' }
];

// Function to populate country dropdowns
function populateCountryDropdown(selectId, includePhoneCode = false) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    // Clear existing options except the first one
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }
    
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = includePhoneCode ? country.phoneCode : country.name;
        option.textContent = includePhoneCode 
            ? `${country.flag} ${country.phoneCode} ${country.name}`
            : `${country.flag} ${country.name}`;
        option.dataset.phoneCode = country.phoneCode;
        option.dataset.flag = country.flag;
        select.appendChild(option);
    });
}

// Function to setup mobile number field with country code
function setupMobileField() {
    const mobileContainer = document.querySelector('.mobile-container');
    if (!mobileContainer) return;
    
    const countrySelect = mobileContainer.querySelector('.country-code-select');
    const mobileInput = mobileContainer.querySelector('.mobile-input');
    
    if (countrySelect && mobileInput) {
        // Populate country codes
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.phoneCode;
            option.textContent = `${country.flag} ${country.phoneCode}`;
            option.dataset.country = country.name;
            countrySelect.appendChild(option);
        });
        
        // Set default to India
        countrySelect.value = '+91';
    }
}
