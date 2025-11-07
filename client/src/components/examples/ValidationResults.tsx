import ValidationResults from '../ValidationResults';

// todo: remove mock functionality
const mockResults = [
  {
    phone: '555-123-4567',
    valid: true,
    phone_type: 'mobile',
    can_receive_sms: true,
    carrier: 'Verizon'
  },
  {
    phone: '(555) 234-5678',
    valid: true,
    phone_type: 'landline',
    can_receive_sms: false,
    carrier: 'AT&T'
  },
  {
    phone: '555-345-6789',
    valid: false,
    phone_type: 'unknown',
    can_receive_sms: false,
    carrier: 'Unknown'
  },
  {
    phone: '+1-555-456-7890',
    valid: true,
    phone_type: 'mobile',
    can_receive_sms: true,
    carrier: 'T-Mobile'
  },
  {
    phone: '555.567.8901',
    valid: true,
    phone_type: 'mobile',
    can_receive_sms: true,
    carrier: 'Sprint'
  }
];

export default function ValidationResultsExample() {
  return (
    <div className="max-w-6xl mx-auto">
      <ValidationResults
        results={mockResults}
        validCount={4}
        invalidCount={1}
        smsCount={3}
      />
    </div>
  );
}
