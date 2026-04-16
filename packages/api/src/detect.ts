const CARRIERS = [
  { name: 'amazon', regex: /^TBA\d{12}$/i },
  { name: 'dhl',    regex: /^(JJD|00340|JVGL|JD)/i },
  { name: 'dhl',    regex: /^\d{20}$/ },
  { name: 'dpost',  regex: /^RR\d{8}DE$/i },
  { name: 'ups',    regex: /^1Z[A-Z0-9]{16}$/i },
  { name: 'hermes', regex: /^H\d{19}$/i },
  { name: 'gls',    regex: /^(\d{8}|GLS\d+)$/i },
  { name: 'dpd',    regex: /^\d{14}$/ },
  { name: 'fedex',  regex: /^\d{12}(\d{3})?$/ },
];

export function detectCarrier(raw: string): string | null {
  const clean = raw.trim().toUpperCase().replace(/\s+/g, '');
  for (const { name, regex } of CARRIERS) {
    if (regex.test(clean)) return name;
  }
  return null;
}