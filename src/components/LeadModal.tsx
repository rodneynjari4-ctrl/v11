import React, { useState } from 'react';
import { X, CheckCircle, Calendar, Send, Building2, User, Mail, Phone, Layers } from 'lucide-react';
import { LeadFormData } from '../types';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (leadData: LeadFormData) => Promise<boolean>;
  initialType?: 'demo' | 'quote' | 'contact';
}

const INDUSTRIES = [
  'Manufacturing',
  'Construction & Contracting',
  'Agriculture & Agribusiness',
  'Wholesale & Distribution',
  'Property & Real Estate',
  'Professional Services',
  'Retail & Commerce',
  'Other',
];

const MODULE_OPTIONS = [
  'ERP Core',
  'Finance & Accounting',
  'HR & Payroll (Statutory/ESS)',
  'Inventory & Procurement',
  'eTIMS Electronic Invoicing',
  'M-Pesa Integration (STK/PayBill)',
];

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialType = 'demo',
}) => {
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    industry: 'Manufacturing',
    employeeCount: '10-50',
    modulesInterested: ['ERP Core', 'Finance & Accounting'],
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const toggleModule = (module: string) => {
    setFormData((prev) => {
      const exists = prev.modulesInterested.includes(module);
      return {
        ...prev,
        modulesInterested: exists
          ? prev.modulesInterested.filter((m) => m !== module)
          : [...prev.modulesInterested, module],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!formData.email.trim() && !formData.phone.trim()) {
      setErrorMsg('Please provide either an email address or phone number.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const success = await onSubmit(formData);
      if (success) {
        setIsSuccess(true);
      } else {
        setErrorMsg('Could not submit inquiry. Please try again or contact our team.');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    if (initialType === 'demo') return 'Schedule a VisionONE Access Demo';
    if (initialType === 'quote') return 'Request a Tailored Quote';
    return 'Talk to Our Business Consultants';
  };

  const getSubtitle = () => {
    if (initialType === 'demo') {
      return 'See how VisionONE connects ERP, Finance, HR & Payroll, and operations for complete business visibility.';
    }
    return 'Tell us about your organization and our team will prepare a tailored recommendation.';
  };

  return (
    <div id="visionone-lead-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111A3A]/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E5F0FE] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#111A3A] to-[#1D8DE6] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold font-['Sora'] leading-tight">{getTitle()}</h3>
              <p className="text-xs text-white/80 font-['Inter']">VisionONE Access Enterprise Platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#E5F0FE] text-[#1D8DE6] flex items-center justify-center">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-[#111A3A] font-['Sora']">Inquiry Received!</h4>
              <p className="text-sm text-[#111A3A]/70 max-w-sm mx-auto font-['Inter']">
                Thank you, <strong>{formData.name}</strong>. A VisionONE senior solutions specialist will contact you at{' '}
                <strong>{formData.email || formData.phone}</strong> to coordinate your personalized session.
              </p>
              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl text-sm font-semibold text-white bg-[#1D8DE6] hover:bg-[#35A6F7] shadow-sm transition-all"
                >
                  Return to Assistant
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-[#111A3A]/70 font-['Inter']">{getSubtitle()}</p>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111A3A] mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#1D8DE6]" /> Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5F0FE] focus:border-[#1D8DE6] focus:ring-1 focus:ring-[#1D8DE6] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111A3A] mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#1D8DE6]" /> Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="e.g. Apex Enterprises Ltd"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5F0FE] focus:border-[#1D8DE6] focus:ring-1 focus:ring-[#1D8DE6] outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111A3A] mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#1D8DE6]" /> Work Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sarah@company.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5F0FE] focus:border-[#1D8DE6] focus:ring-1 focus:ring-[#1D8DE6] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111A3A] mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#1D8DE6]" /> Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+254 700 000 000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5F0FE] focus:border-[#1D8DE6] focus:ring-1 focus:ring-[#1D8DE6] outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111A3A] mb-1">Industry</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5F0FE] focus:border-[#1D8DE6] bg-white outline-none"
                  >
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111A3A] mb-1">Company Size (Employees)</label>
                  <select
                    value={formData.employeeCount}
                    onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5F0FE] focus:border-[#1D8DE6] bg-white outline-none"
                  >
                    <option value="1-10">1 – 10 users</option>
                    <option value="11-50">11 – 50 users</option>
                    <option value="51-200">51 – 200 users</option>
                    <option value="200+">200+ enterprise users</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111A3A] mb-1.5 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[#1D8DE6]" /> Areas of Interest
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {MODULE_OPTIONS.map((module) => {
                    const selected = formData.modulesInterested.includes(module);
                    return (
                      <button
                        type="button"
                        key={module}
                        onClick={() => toggleModule(module)}
                        className={`text-left text-[11px] px-2.5 py-1.5 rounded-lg border transition-all ${
                          selected
                            ? 'bg-[#E5F0FE] border-[#1D8DE6] text-[#111A3A] font-medium'
                            : 'bg-white border-[#E5F0FE] text-[#111A3A]/70 hover:border-[#1D8DE6]/50'
                        }`}
                      >
                        {selected ? '✓ ' : '+ '}
                        {module}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111A3A] mb-1">Notes / Key Requirements (Optional)</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Tell us what business operations you are looking to streamline..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5F0FE] focus:border-[#1D8DE6] focus:ring-1 focus:ring-[#1D8DE6] outline-none transition"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E5F0FE]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-[#111A3A]/70 hover:text-[#111A3A] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#1D8DE6] to-[#35A6F7] hover:opacity-95 shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
