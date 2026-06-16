// Known mobile/MVNO carriers that Veriphone often misclassifies as fixed_line
export const KNOWN_MOBILE_CARRIERS = [
  'simple mobile', 'boost mobile', 'cricket', 'cricket wireless',
  'metro', 'metro by t-mobile', 'metropcs', 'mint mobile',
  'visible', 'google fi', 'ting', 'us mobile', 'republic wireless',
  'consumer cellular', 'tracfone', 'straight talk', 'total wireless',
  'net10', 'h2o wireless', 'lycamobile', 'ultra mobile',
  'red pocket', 'gen mobile', 'good2go', 'twigby',
  'wing', 'reach mobile', 'tello', 'ting mobile',
];

// Check if carrier name matches a known mobile carrier
export function isKnownMobileCarrier(carrier: string): boolean {
  const lower = carrier.toLowerCase().trim();
  return KNOWN_MOBILE_CARRIERS.some(c => lower.includes(c));
}
