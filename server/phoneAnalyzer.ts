export interface PhoneSuggestion {
  type: 'missing_digits' | 'transposed' | 'invalid_area_code' | 'format_issue' | 'placeholder' | 'sequential';
  severity: 'high' | 'medium' | 'low';
  message: string;
  suggestedNumbers?: string[];
  action?: string;
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

export function analyzeInvalidPhone(phone: string, errorMessage?: string): PhoneSuggestion[] {
  const suggestions: PhoneSuggestion[] = [];
  const digits = phone.replace(/\D/g, '');
  
  // Check for placeholder patterns - SAFE: This is a warning, not a fix
  if (isPlaceholder(digits)) {
    suggestions.push({
      type: 'placeholder',
      severity: 'high',
      message: 'This appears to be a placeholder number (e.g., 000-0000, 555-1234)',
      action: 'Verify with patient - likely not a real number. Do not use.'
    });
    return suggestions;
  }

  // Check for sequential patterns - SAFE: This is a warning, not a fix
  if (isSequential(digits)) {
    suggestions.push({
      type: 'sequential',
      severity: 'high',
      message: 'Sequential number detected (e.g., 123-4567) - may be placeholder',
      action: 'Verify with patient before using. This pattern suggests test data.'
    });
  }

  // Check for too many digits (might have extension) - SAFE: Deterministic removal
  if (digits.length > 10 && digits.length <= 14) {
    const cleaned = digits.slice(0, 10);
    const areaCode = cleaned.slice(0, 3);
    // Only suggest if the resulting area code would be valid
    if (VALID_US_AREA_CODES.has(areaCode)) {
      suggestions.push({
        type: 'format_issue',
        severity: 'low',
        message: 'Extra digits detected (likely extension or country code)',
        suggestedNumbers: [formatPhone(cleaned)],
        action: 'Try removing the extension/extra digits'
      });
    } else {
      suggestions.push({
        type: 'format_issue',
        severity: 'medium',
        message: 'Extra digits detected, but removing them does not yield a valid number',
        action: 'Verify the complete number with patient'
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
        action: 'Verify the area code with patient. Common area codes: 410 (Baltimore), 301 (Maryland), 202 (DC), 212 (NYC), 213 (LA)'
      });
    }
  }

  // Check for missing digits - SAFE: Just identify, don't pad with guesses
  if (digits.length > 0 && digits.length < 10) {
    suggestions.push({
      type: 'missing_digits',
      severity: 'high',
      message: `Missing ${10 - digits.length} digit(s) - incomplete number`,
      action: 'Request complete number from patient. Do not guess missing digits.'
    });
  }

  // Check for format issues - SAFE: Just cleanup, no number changes
  const formatIssues = detectFormatIssues(phone);
  if (formatIssues.length > 0 && digits.length === 10) {
    const areaCode = digits.slice(0, 3);
    if (VALID_US_AREA_CODES.has(areaCode)) {
      suggestions.push({
        type: 'format_issue',
        severity: 'low',
        message: formatIssues.join(', '),
        suggestedNumbers: [formatPhone(digits)],
        action: 'Format cleanup - same digits, standardized format'
      });
    }
  }

  // If no suggestions yet, provide generic guidance
  if (suggestions.length === 0) {
    suggestions.push({
      type: 'format_issue',
      severity: 'high',
      message: 'Unable to validate this phone number',
      action: 'Verify complete number with patient. Ensure 10-digit US format.'
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
  
  // Check for 555 area code with 0000-9999 (classic fake numbers)
  if (digits.startsWith('555') && digits.length === 10) {
    const lastFour = digits.slice(6);
    if (lastFour === '0000' || lastFour === '1234') return true;
  }
  
  return false;
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
