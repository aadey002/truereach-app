import { useState } from 'react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    phone: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          access_key: '2603658f-9610-45e5-8d3c-0ae67ef63013',
          name: formData.name,
          email: formData.email,
          organization: formData.organization,
          phone: formData.phone,
          message: formData.message,
          subject: `TrueReach Demo Request from ${formData.name}`,
        }),
      });

      const result = await response.json();
      console.log('Web3Forms response:', result);
      
      if (result.success) {
        setStatus('success');
        setFormData({ name: '', email: '', organization: '', phone: '', message: '' });
      } else {
        console.error('Web3Forms error:', result);
        setStatus('error');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (status === 'success') {
    return (
      <section id="contact" className="py-12 md:py-20 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 rounded-xl">
        <div className="max-w-2xl mx-auto px-4 md:px-6 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/20">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-4">Thank You!</h3>
            <p className="text-purple-200">
              We've received your message and will get back to you within 24 hours.
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-6 text-purple-300 hover:text-white underline"
              data-testid="button-send-another"
            >
              Send another message
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-12 md:py-20 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 rounded-xl">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
            Request a Free Demo
          </h2>
          <p className="text-base md:text-xl text-purple-200 max-w-2xl mx-auto">
            See how TrueReach can help your practice reduce no-shows by up to 25%. 
            Fill out the form below and we'll reach out within 24 hours.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 lg:p-12 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-purple-200 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition"
                  placeholder="Dr. Jane Smith"
                  data-testid="input-contact-name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-purple-200 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition"
                  placeholder="jane@clinic.com"
                  data-testid="input-contact-email"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-purple-200 mb-2">
                  Organization / Practice
                </label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition"
                  placeholder="City Health Clinic"
                  data-testid="input-contact-organization"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-purple-200 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition"
                  placeholder="(555) 123-4567"
                  data-testid="input-contact-phone"
                />
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-purple-200 mb-2">
                How can we help? *
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={4}
                value={formData.message}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition resize-none"
                placeholder="Tell us about your practice and how many patient contacts you handle monthly..."
                data-testid="input-contact-message"
              />
            </div>

            {status === 'error' && (
              <div className="bg-red-500/20 border border-red-400 rounded-lg p-4 text-red-200">
                Something went wrong. Please try again or email us directly at aadey002@gmail.com
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full bg-white text-purple-900 font-bold py-3 md:py-4 px-8 rounded-lg hover:bg-purple-100 transition duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-submit-contact"
            >
              {status === 'submitting' ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </span>
              ) : (
                'Request Free Demo'
              )}
            </button>

            <p className="text-center text-purple-300 text-sm">
              We respect your privacy. Your information will never be shared.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
