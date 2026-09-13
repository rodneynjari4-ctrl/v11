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
    if (!formData.name.trim() || (!formData.email.trim() && !formData.phone.trim())) {
      setErrorMsg('Please enter your name and either email or phone.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

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
    if (initialType === 'demo') return 'Schedule a Demo';
    if (initialType === 'quote') return 'Request a Quote';
    return 'Speak with Consultants';
  };

  const getSubtitle = () => {
    if (initialType === 'demo') {
      return 'See how VisionONE connects ERP, Finance, HR & Payroll, and operations.';
    }
    return 'Tell us about your organization and our team will prepare a tailored recommendation.';
  };

  return (
    <div id="visionone-lead-modal" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#111A3A]/70 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-[94vw] sm:max-w-md bg-white rounded-2xl shadow-2xl border border-[#E5F0FE] overflow-hidden flex flex-col max-h-[90dvh]">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-[#111A3A] to-[#1D8DE6] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-md">
              <Calendar className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold font-['Sora'] leading-tight">{getTitle()}</h3>
              <p className="text-[10px] text-white/80 font-['Inter']">VisionONE Access Platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-3">
          {isSuccess ? (
            <div className="py-6 text-center space-y-2.5">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#E5F0FE] text-[#1D8DE6] flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-[#111A3A] font-['Sora']">Inquiry Received!</h4>
              <p className="text-xs text-[#111A3A]/70 max-w-xs mx-auto font-['Inter']">
                Thank you, <strong>{formData.name}</strong>. A VisionONE specialist will reach out to you shortly via{' '}
                <strong>{formData.email || formData.phone}</strong>.
              </p>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-5 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#1D8DE6] hover:bg-[#35A6F7] shadow-xs transition-all"
                >
                  Return to Assistant
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <p className="text-[11px] text-[#111A3A]/70 font-['Inter']">{getSubtitle()}</p>

              {errorMsg && (
                <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-600">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#111A3A] mb-0.5 flex items-center gap-1">
                    <User className="w-3 h-3 text-[#1D8DE6]" /> Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-[#E5F0FE] focus:border-[#1D8DE6] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#111A3A] mb-0.5 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-[#1D8DE6]" /> Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="e.g. Apex Enterprises Ltd"
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-[#E5F0FE] focus:border-[#1D8DE6] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#111A3A] mb-0.5 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-[#1D8DE6]" /> Work Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sarah@company.com"
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-[#E5F0FE] focus:border-[#1D8DE6] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#111A3A] mb-0.5 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#1D8DE6]" /> Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+254 700 000 000"
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-[#E5F0FE] focus:border-[#1D8DE6] outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#111A3A] mb-1 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-[#1D8DE6]" /> Modules of Interest
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {MODULE_OPTIONS.map((module) => {
                    const selected = formData.modulesInterested.includes(module);
                    return (
                      <button
                        type="button"
                        key={module}
                        onClick={() => toggleModule(module)}
                        className={`text-left text-[10px] px-2 py-1 rounded-lg border transition-all truncate ${
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

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E5F0FE]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs font-medium text-[#111A3A]/70 hover:text-[#111A3A] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#1D8DE6] to-[#35A6F7] hover:opacity-95 shadow-xs flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send className="w-3 h-3" /> Submit
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
