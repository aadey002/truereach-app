export interface PhoneSuggestion {
  type: 'missing_digits' | 'transposed' | 'invalid_area_code' | 'format_issue' | 'placeholder' | 'sequential';
  severity: 'high' | 'medium' | 'low';
  message: string;
  suggestedNumbers?: string[];
  action?: string;
  confidence?: number; // 0-100 percentage
  details?: string; // Additional context like "Digits 2-1 transposed"
}

const VALID_US_AREA_CODES = new Set([
  '201', '202', '203', '205', '206', '207', '208', '209', '210', '212', '213', '214', '215', '216', '217', '218', '219',
  '220', '224', '225', '228', '229', '231', '234', '239', '240', '248', '251', '252', '253', '254', '256', '260', '262',
  '267', '269', '270', '272', '274', '276', '281', '283', '301', '302', '303', '304', '305', '307', '308', '309', '310',
  '312', '313', '314', '315', '316', '317', '318', '319', '320', '321', '323', '325', '330', '331', '334', '336', '337',
  '339', '346', '347', '351', '352', '360', '361', '364', '380', '385', '386', '401', '402', '404', '405', '406', '407',
  '408', '409', '410', '412', '413', '414', '415', '417', '419', '423', '424', '425', '430', '432', '434', '435', '440',
  '442', '443', '458', '463', '464', '469', '470', '475', '478', '479', '480', '484', '501', '502', '503', '504', '505',
  '507', '508', '509', '510', '512', '513', '515', '516', '517', '518', '520', '530', '531', '534', '539', '540', '541',
  '551', '559', '561', '562', '563', '564', '567', '570', '571', '573', '574', '575', '580', '585', '586', '601', '602',
  '603', '605', '606', '607', '608', '609', '610', '612', '614', '615', '616', '617', '618', '619', '620', '623', '626',
  '628', '629', '630', '631', '636', '641', '646', '650', '651', '657', '660', '661', '662', '667', '669', '678', '681',
  '682', '701', '702', '703', '704', '706', '707', '708', '712', '713', '714', '715', '716', '717', '718', '719', '720',
  '724', '725', '727', '730', '731', '732', '734', '737', '740', '743', '747', '754', '757', '760', '762', '763', '765',
  '769', '770', '772', '773', '774', '775', '779', '781', '785', '786', '801', '802', '803', '804', '805', '806', '808',
  '810', '812', '813', '814', '815', '816', '817', '818', '828', '830', '831', '832', '843', '845', '847', '848', '850',
  '854', '856', '857', '858', '859', '860', '862', '863', '864', '865', '870', '872', '878', '901', '903', '904', '906',
  '907', '908', '909', '910', '912', '913', '914', '915', '916', '917', '918', '919', '920', '925', '928', '929', '930',
  '931', '934', '936', '937', '938', '940', '941', '947', '949', '951', '952', '954', '956', '959', '970', '971', '972',
  '973', '978', '979', '980', '984', '985', '989'
]);

const STATE_AREA_CODES: Record<string, string[]> = {
  'MD': ['240', '301', '410', '443', '667'],
  'VA': ['276', '434', '540', '571', '703', '757', '804'],
  'DC': ['202'],
  'CA': ['209', '213', '310', '323', '408', '415', '424', '442', '510', '530', '559', '562', '619', '626', '650', '657', '661', '669', '707', '714', '747', '760', '805', '818', '831', '858', '909', '916', '925', '949', '951'],
  'NY': ['212', '315', '347', '516', '518', '585', '607', '631', '646', '716', '718', '845', '914', '917', '929', '934'],
  'TX': ['210', '214', '254', '281', '325', '346', '361', '409', '430', '432', '469', '512', '682', '713', '737', '806', '817', '830', '832', '903', '915', '936', '940', '956', '972', '979'],
  'FL': ['239', '305', '321', '352', '386', '407', '561', '727', '754', '772', '786', '813', '850', '863', '904', '941', '954'],
  'PA': ['215', '267', '272', '412', '484', '570', '610', '717', '724', '814', '878'],
  'IL': ['217', '224', '309', '312', '331', '618', '630', '708', '773', '815', '847', '872'],
  'OH': ['216', '220', '234', '330', '380', '419', '440', '513', '567', '614', '740', '937'],
};

// Regional area code distribution for smarter suggestions
const REGIONAL_AREA_CODE_DISTRIBUTION: Record<string, { code: string; weight: number; region: string }[]> = {
  'MD': [
    { code: '410', weight: 35, region: 'Baltimore' },
    { code: '443', weight: 25, region: 'Baltimore overlay' },
    { code: '240', weight: 20, region: 'Western MD' },
    { code: '301', weight: 15, region: 'DC suburbs' },
    { code: '667', weight: 5, region: 'New overlay' },
  ],
  'DC': [
    { code: '202', weight: 100, region: 'Washington DC' },
  ],
  'VA': [
    { code: '703', weight: 30, region: 'Northern VA' },
    { code: '571', weight: 25, region: 'Northern VA overlay' },
    { code: '757', weight: 20, region: 'Hampton Roads' },
    { code: '804', weight: 15, region: 'Richmond' },
    { code: '540', weight: 10, region: 'Western VA' },
  ],
};

export function analyzeInvalidPhone(phone: string, errorMessage?: string): PhoneSuggestion[] {
  const suggestions: PhoneSuggestion[] = [];
  const digits = phone.replace(/\D/g, '');
  
  // Check for placeholder patterns - SAFE: This is a warning, not a fix
  if (isPlaceholder(digits)) {
    suggestions.push({
      type: 'placeholder',
      severity: 'high',
      message: 'This appears to be a placeholder/test number (000-0000, 555-1234, repeating digits, zero blocks)',
      action: 'Verify with patient - likely not a real number. Do not use.',
      confidence: 95 // HIGH tier: Pattern matching is very reliable
    });
    return suggestions;
  }

  // Check for sequential patterns - SAFE: This is a warning, not a fix
  if (isSequential(digits)) {
    suggestions.push({
      type: 'sequential',
      severity: 'high',
      message: 'Sequential number detected (e.g., 123-4567) - may be placeholder',
      action: 'Verify with patient before using. This pattern suggests test data.',
      confidence: 90 // HIGH tier: Pattern detection is reliable
    });
  }

  // Check for transposed digits - GUARDED: Speculative but helpful
  if (digits.length === 10) {
    const transposed = detectTransposedDigits(digits);
    if (transposed) {
      suggestions.push(transposed);
    }
  }

  // Check for too many digits (might have extension) - SAFE: Deterministic removal
  if (digits.length > 10 && digits.length <= 14) {
    const cleaned = digits.slice(0, 10);
    // CRITICAL FIX: Validate the cleaned number using full NANP rules, not just area code
    if (isValidNANPFormat(cleaned)) {
      suggestions.push({
        type: 'format_issue',
        severity: 'low',
        message: 'Extra digits detected (likely extension or country code)',
        suggestedNumbers: [formatPhone(cleaned)],
        action: 'Try removing the extension/extra digits',
        confidence: 75 // MEDIUM-HIGH tier: Deterministic removal, likely correct
      });
    } else {
      suggestions.push({
        type: 'format_issue',
        severity: 'medium',
        message: 'Extra digits detected, but removing them does not yield a valid NANP number',
        action: 'Verify the complete number with patient',
        confidence: 60 // MEDIUM tier: Issue identified but no clear fix
      });
    }
  }

  // Check for invalid area code - SAFE: Just identify the problem, don't guess
  if (digits.length === 10) {
    const areaCode = digits.slice(0, 3);
    if (!VALID_US_AREA_CODES.has(areaCode)) {
      suggestions.push({
        type: 'invalid_area_code',
        severity: 'high',
        message: `Area code ${areaCode} is not a valid US area code`,
        action: 'Verify the area code with patient. Common area codes: 410 (Baltimore), 301 (Maryland), 202 (DC), 212 (NYC), 213 (LA)',
        confidence: 85 // HIGH tier: Identification is reliable
      });
    }
  }

  // Check for missing digits - SAFE: Just identify, don't pad with guesses
  if (digits.length > 0 && digits.length < 10) {
    suggestions.push({
      type: 'missing_digits',
      severity: 'high',
      message: `Missing ${10 - digits.length} digit(s) - incomplete number`,
      action: 'Request complete number from patient. Do not guess missing digits.',
      confidence: 95 // HIGH tier: Detection is very reliable
    });
  }

  // Check for format issues - SAFE: Just cleanup, no number changes
  const formatIssues = detectFormatIssues(phone);
  if (formatIssues.length > 0 && digits.length === 10) {
    // CRITICAL FIX: Validate using full NANP rules before suggesting format cleanup
    if (isValidNANPFormat(digits)) {
      suggestions.push({
        type: 'format_issue',
        severity: 'low',
        message: formatIssues.join(', '),
        suggestedNumbers: [formatPhone(digits)],
        action: 'Format cleanup - same digits, standardized format',
        confidence: 90 // HIGH tier: Deterministic formatting
      });
    }
  }

  // If no suggestions yet, provide generic guidance
  if (suggestions.length === 0) {
    suggestions.push({
      type: 'format_issue',
      severity: 'high',
      message: 'Unable to validate this phone number',
      action: 'Verify complete number with patient. Ensure 10-digit US format.',
      confidence: 50 // MEDIUM tier: Generic guidance
    });
  }

  return suggestions;
}

function isPlaceholder(digits: string): boolean {
  // Check for obvious placeholders
  const placeholders = [
    '0000000000', '1111111111', '2222222222', '3333333333', '4444444444',
    '5555555555', '6666666666', '7777777777', '8888888888', '9999999999',
    '1234567890', '0987654321'
  ];
  
  if (placeholders.includes(digits)) return true;
  
  // Check if all digits are the same
  if (digits.length > 0 && new Set(digits).size === 1) return true;
  
  // Check for 555 area code with common fake patterns
  if (digits.startsWith('555') && digits.length === 10) {
    const lastFour = digits.slice(6);
    if (lastFour === '0000' || lastFour === '1234' || lastFour === '0100') return true;
  }
  
  // Check for zero blocks (e.g., 410-000-0000, XXX-000-XXXX)
  if (digits.length === 10) {
    const exchange = digits.slice(3, 6);
    const lastFour = digits.slice(6);
    if (exchange === '000' || lastFour === '0000') return true;
  }
  
  // Check for repeating patterns in last 7 digits (e.g., 443-555-5555)
  if (digits.length === 10) {
    const last7 = digits.slice(3);
    const firstDigit = last7[0];
    if (last7.split('').every(d => d === firstDigit)) return true;
  }
  
  return false;
}

// NANP failure codes for precise error reporting
type NANPFailureCode = 
  | 'invalid_area_code'
  | 'reserved_000_exchange'
  | 'reserved_555_exchange'
  | 'reserved_911_exchange'
  | 'n11_reserved'
  | 'leading_digit_violation'
  | 'zero_line';

// Shared NANP validation - returns validation result and specific failure code
// This ensures validation and suggestion logic stay in perfect lockstep
function getNANPValidation(digits: string): { valid: boolean; failureCode?: NANPFailureCode } {
  if (digits.length !== 10) return { valid: false };
  
  const areaCode = digits.slice(0, 3);
  const exchangeCode = digits.slice(3, 6);
  const lineNumber = digits.slice(6, 10);
  
  // Check area code is valid (highest priority check)
  if (!VALID_US_AREA_CODES.has(areaCode)) {
    return { valid: false, failureCode: 'invalid_area_code' };
  }
  
  // CRITICAL: Check exchange[0] is NOT 0 or 1 BEFORE other exchange checks
  // This prevents "111" from being misidentified as N11
  if (exchangeCode[0] === '0' || exchangeCode[0] === '1') {
    return { valid: false, failureCode: 'leading_digit_violation' };
  }
  
  // Specific reserved exchange codes
  if (exchangeCode === '000') {
    return { valid: false, failureCode: 'reserved_000_exchange' };
  }
  
  if (exchangeCode === '555') {
    return { valid: false, failureCode: 'reserved_555_exchange' };
  }
  
  if (exchangeCode === '911') {
    return { valid: false, failureCode: 'reserved_911_exchange' };
  }
  
  // N11 codes (211-811) - now safe because we already rejected 0xx/1xx above
  if (exchangeCode.endsWith('11')) {
    return { valid: false, failureCode: 'n11_reserved' };
  }
  
  // Line number cannot be all zeros
  if (lineNumber === '0000') {
    return { valid: false, failureCode: 'zero_line' };
  }
  
  return { valid: true };
}

// Helper: Validate full NANP (North American Numbering Plan) format
// EXPORTED for use in routes.ts to enforce NANP rules on all validations
// This is now a thin boolean wrapper around getNANPValidation
export function isValidNANPFormat(digits: string): boolean {
  return getNANPValidation(digits).valid;
}

// Helper: Get NANP-specific suggestion if NANP validation failed
// Returns a high-confidence suggestion explaining WHY NANP failed
// EXPORTED for use in routes.ts to provide detailed NANP guidance
// Now uses shared getNANPValidation() to ensure perfect lockstep with validation
export function getNANPSuggestion(digits: string): PhoneSuggestion | null {
  if (digits.length !== 10) return null;
  
  const { valid, failureCode } = getNANPValidation(digits);
  if (valid) return null;
  
  // Extract parts for detailed messaging
  const areaCode = digits.slice(0, 3);
  const exchangeCode = digits.slice(3, 6);
  
  // Switch on failure code to provide specific, actionable guidance
  switch (failureCode) {
    case 'invalid_area_code':
      return {
        type: 'invalid_area_code',
        severity: 'high',
        message: `Invalid area code: ${areaCode} is not a valid US/Canada area code`,
        action: 'Verify with patient - this area code does not exist in North America',
        confidence: 95
      };
    
    case 'reserved_555_exchange':
      return {
        type: 'format_issue',
        severity: 'high',
        message: 'Reserved exchange code: 555 is reserved for directory assistance and fictitious numbers',
        action: 'Verify with patient - this is likely a test/placeholder number, not a real phone',
        confidence: 95,
        details: 'NANP rule: 555 exchange is reserved for information services and fictional use in media'
      };
    
    case 'reserved_911_exchange':
      return {
        type: 'format_issue',
        severity: 'high',
        message: 'Reserved exchange code: 911 is reserved for emergency services',
        action: 'Verify with patient - this is the emergency services number, not a valid phone number',
        confidence: 95,
        details: 'NANP rule: 911 is reserved for emergency dialing and cannot be assigned to phone numbers'
      };
    
    case 'reserved_000_exchange':
      return {
        type: 'format_issue',
        severity: 'high',
        message: 'Reserved exchange code: 000 is not valid for phone numbers',
        action: 'Verify with patient - this appears to be a test or invalid number',
        confidence: 95,
        details: 'NANP rule: 000 exchange is reserved and cannot be assigned to phone numbers'
      };
    
    case 'n11_reserved':
      const serviceName = exchangeCode === '211' ? 'community information' :
                         exchangeCode === '311' ? 'non-emergency services' :
                         exchangeCode === '411' ? 'directory assistance' :
                         exchangeCode === '511' ? 'traffic/travel info' :
                         exchangeCode === '611' ? 'repair service' :
                         exchangeCode === '711' ? 'relay service' :
                         exchangeCode === '811' ? 'utility location' : 'special service';
      
      return {
        type: 'format_issue',
        severity: 'high',
        message: `Reserved N11 code: ${exchangeCode} is reserved for ${serviceName}`,
        action: 'Verify with patient - N11 codes are not valid phone numbers, they are special service codes',
        confidence: 95,
        details: `NANP rule: N11 codes (211-911) are reserved for abbreviated dialing services, not phone numbers`
      };
    
    case 'leading_digit_violation':
      return {
        type: 'format_issue',
        severity: 'high',
        message: `Invalid exchange format: Exchange code ${exchangeCode} cannot start with ${exchangeCode[0]}`,
        action: 'Verify with patient - exchange code must start with digits 2-9',
        confidence: 95,
        details: 'NANP rule: Exchange codes must start with digits 2-9, not 0 or 1'
      };
    
    case 'zero_line':
      return {
        type: 'format_issue',
        severity: 'high',
        message: 'Invalid line number: Line number cannot be 0000',
        action: 'Verify with patient - this appears to be a test or incomplete number',
        confidence: 95,
        details: 'NANP rule: Line number (last 4 digits) cannot be all zeros'
      };
    
    default:
      // Fallback for unknown failure codes (should never happen)
      return {
        type: 'format_issue',
        severity: 'high',
        message: 'Invalid NANP format',
        action: 'Verify with patient - this number does not meet North American Numbering Plan requirements',
        confidence: 95
      };
  }
}

// GUARDED TRANSPOSED DIGIT DETECTION - Architect-approved with safety guardrails
function detectTransposedDigits(digits: string): PhoneSuggestion | null {
  // SAFETY GUARDRAIL: Only work with exactly 10 digits
  if (digits.length !== 10) return null;
  
  const validSuggestions: { number: string; swapPosition: string }[] = [];
  
  // SAFETY GUARDRAIL: Try only adjacent swaps (max 9 positions)
  for (let i = 0; i < digits.length - 1; i++) {
    // Create swapped version
    const arr = digits.split('');
    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; // Swap adjacent digits
    const swapped = arr.join('');
    
    // CRITICAL FIX: Fully validate the swapped number using NANP rules
    // Not just area code, but also exchange code and line number validity
    if (isValidNANPFormat(swapped)) {
      const formatted = formatPhone(swapped);
      // Describe which digits were swapped (1-indexed for human readability)
      const swapDescription = `Digits at positions ${i + 1}-${i + 2} swapped`;
      validSuggestions.push({
        number: formatted,
        swapPosition: swapDescription
      });
    }
    
    // SAFETY GUARDRAIL: Limit to max 3 suggestions
    if (validSuggestions.length >= 3) break;
  }
  
  if (validSuggestions.length === 0) return null;
  
  // Return suggestion with LOW confidence tier (speculative)
  return {
    type: 'transposed',
    severity: 'medium',
    message: 'Possible transposed digits detected',
    suggestedNumbers: validSuggestions.map(s => s.number),
    details: validSuggestions.map(s => s.swapPosition).join('; '),
    confidence: 40, // LOW tier: This is speculative, requires verification
    action: 'SPECULATIVE SUGGESTION - Verify with patient before using. These numbers pass basic NANP validation but may not be correct.'
  };
}

function isSequential(digits: string): boolean {
  if (digits.length < 4) return false;
  
  // Check for ascending sequences (123, 234, 345, etc.)
  for (let i = 0; i < digits.length - 3; i++) {
    const seq = digits.slice(i, i + 4);
    let isAscending = true;
    for (let j = 0; j < seq.length - 1; j++) {
      if (parseInt(seq[j + 1]) !== parseInt(seq[j]) + 1) {
        isAscending = false;
        break;
      }
    }
    if (isAscending) return true;
  }
  
  // Check for descending sequences
  for (let i = 0; i < digits.length - 3; i++) {
    const seq = digits.slice(i, i + 4);
    let isDescending = true;
    for (let j = 0; j < seq.length - 1; j++) {
      if (parseInt(seq[j + 1]) !== parseInt(seq[j]) - 1) {
        isDescending = false;
        break;
      }
    }
    if (isDescending) return true;
  }
  
  return false;
}

function detectFormatIssues(phone: string): string[] {
  const issues: string[] = [];
  
  // Check for double punctuation
  if (/[-\.]{2,}/.test(phone)) {
    issues.push('Double punctuation detected');
  }
  
  // Check for extension markers
  if (/\b(ext|x|extension)\b/i.test(phone)) {
    issues.push('Extension marker found');
  }
  
  // Check for unusual characters
  if (/[^0-9\s\-\(\)\.\+]/.test(phone)) {
    issues.push('Unusual characters detected');
  }
  
  return issues;
}

function formatPhone(digits: string): string {
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return digits;
}
