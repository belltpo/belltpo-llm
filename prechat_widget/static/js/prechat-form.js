/**
 * Prechat Form JavaScript
 * Handles form initialization, dropdowns, and interactions
 */

// Country data with flags and phone codes
const COUNTRIES = [
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

/**
 * Initialize country code dropdown
 */
function initializeCountryCodeDropdown() {
    const countryCodeSelect = document.getElementById('countryCode');
    if (countryCodeSelect) {
        // Clear existing options
        countryCodeSelect.innerHTML = '';

        // Sort countries alphabetically by name for country code dropdown
        const sortedCountries = [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));

        // Add all country codes
        sortedCountries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.phoneCode;
            option.textContent = `${country.flag} ${country.phoneCode}`;
            option.dataset.country = country.name;
            countryCodeSelect.appendChild(option);
        });

        // Set default to India
        countryCodeSelect.value = '+91';
        console.log(' Country code dropdown populated with', countryCodeSelect.options.length, 'options');
        return true;
    } else {
        console.error(' Country code select element not found');
        return false;
    }
}

/**
 * Initialize country dropdown
 */
function initializeCountryDropdown() {
    const regionSelect = document.getElementById('region');
    if (!regionSelect) {
        console.error('❌ Region select element not found');
        return false;
    }

    // Clear and add placeholder
    regionSelect.innerHTML = '<option value="">Select your country</option>';

    // Sort countries alphabetically by name for country dropdown
    const sortedCountries = [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));
    
    // Add all countries
    sortedCountries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.name;
        option.textContent = `${country.flag} ${country.name}`;
        regionSelect.appendChild(option);
    });

    console.log('✅ Region dropdown populated with', regionSelect.options.length, 'options');
    return true;
}

/**
 * Initialize close button functionality
 */
function initializeCloseButton() {
    const closeBtn = document.getElementById('closeBtn');
    if (!closeBtn) {
        console.error('❌ Close button not found');
        return false;
    }

    closeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('✅ Close button clicked');

        try {
            // Method 1: Send close message to parent window
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                    type: 'CLOSE_CHAT_WIDGET',
                    action: 'close_prechat',
                    source: 'prechat_form'
                }, '*');
                console.log('Sent close message to parent');
            }

            // Method 2: Try to close if popup
            if (window.opener) {
                window.close();
                return;
            }

            // Method 3: Hide widget with animation
            const widget = document.querySelector('.chat-widget');
            if (widget) {
                widget.style.transition = 'all 0.3s ease';
                widget.style.transform = 'scale(0.8)';
                widget.style.opacity = '0';

                setTimeout(() => {
                    widget.style.display = 'none';
                    document.body.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; color: #fff; font-family: Arial, sans-serif; background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);">Chat widget closed</div>';
                }, 300);
            }

            // Method 4: History fallback
            setTimeout(() => {
                if (window.history.length > 1) {
                    window.history.back();
                }
            }, 500);

        } catch (error) {
            console.error('Error closing widget:', error);
            const widget = document.querySelector('.chat-widget');
            if (widget) {
                widget.style.transition = 'all 0.3s ease';
                widget.style.transform = 'scale(0.8)';
                widget.style.opacity = '0';
                setTimeout(() => widget.style.display = 'none', 300);
            }
        }
    });

    console.log('✅ Close button initialized');
    return true;
}

/**
 * Initialize form submission handling
 */
function initializeFormSubmission() {
    const form = document.getElementById('prechatForm');
    if (!form) {
        console.error('❌ Prechat form not found');
        return false;
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitBtn = document.getElementById('submitBtn');
        const loading = document.getElementById('loading');

        // Show loading state
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing...';
        }
        if (loading) {
            loading.style.display = 'block';
        }

        // Get form data including country code
        const countryCode = document.getElementById('countryCode')?.value || '';
        const mobileNumber = document.getElementById('mobile')?.value || '';
        const fullMobile = countryCode + mobileNumber;

        const formData = {
            name: document.getElementById('name')?.value || '',
            email: document.getElementById('email')?.value || '',
            mobile: fullMobile,
            region: document.getElementById('region')?.value || ''
        };

        try {
            console.log('Submitting form data:', formData);

            const response = await fetch('/submit/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
                credentials: 'same-origin'
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Form submission result:', result);

            if (result.success) {
                console.log('Form submitted successfully');

                // Send success message to parent window
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage({
                        type: 'DJANGO_FORM_SUCCESS',
                        userData: result.user_data,
                        message: 'User data saved successfully'
                    }, '*');
                }

                // Show success message
                if (loading) {
                    loading.innerHTML = '<span style="color: #00bfff;">✓ Form submitted successfully! Starting chat...</span>';
                }

                // Redirect or close after delay
                setTimeout(() => {
                    if (result.redirect_url) {
                        window.location.href = result.redirect_url;
                    } else {
                        document.getElementById('closeBtn')?.click();
                    }
                }, 2000);

            } else {
                throw new Error(result.message || 'Form submission failed');
            }

        } catch (error) {
            console.error('Error submitting form:', error);

            // Show error message
            if (loading) {
                loading.innerHTML = '<span style="color: #ff6b6b;">❌ Error: ' + error.message + '</span>';
            }

            // Reset form after delay
            setTimeout(() => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Start Chat Session';
                }
                if (loading) {
                    loading.style.display = 'none';
                }
            }, 3000);
        }
    });

    console.log('✅ Form submission initialized');
    return true;
}

/**
 * Main initialization function
 */
function initializePrechatForm() {
    console.log('🚀 Initializing Prechat Form...');

    // Initialize all components
    const results = {
        countryCode: initializeCountryCodeDropdown(),
        country: initializeCountryDropdown(),
        closeButton: initializeCloseButton(),
        formSubmission: initializeFormSubmission()
    };

    // Log results
    const successCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;

    console.log(`✅ Prechat form initialization complete: ${successCount}/${totalCount} components initialized`);

    if (successCount === totalCount) {
        console.log('🎉 All components initialized successfully!');
    } else {
        console.warn('⚠️ Some components failed to initialize:', results);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializePrechatForm);

// Fallback initialization
setTimeout(initializePrechatForm, 100);

// Export for global access
window.PrechatForm = {
    initialize: initializePrechatForm,
    countries: COUNTRIES
};
