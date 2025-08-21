'use client';

import React, { useState } from 'react';
import LoadingSpinner from '@/components/auth/LoadingSpinner';

interface ContactDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message: string, urgency: 'low' | 'medium' | 'high') => Promise<void>;
  driverName?: string;
}

const URGENCY_OPTIONS = [
  { value: 'low', label: 'General Inquiry', color: 'text-green-400', bgColor: 'bg-green-900' },
  { value: 'medium', label: 'Need Assignment', color: 'text-yellow-400', bgColor: 'bg-yellow-900' },
  { value: 'high', label: 'Urgent Issue', color: 'text-red-400', bgColor: 'bg-red-900' }
] as const;

export default function ContactDispatchModal({ 
  isOpen, 
  onClose, 
  onSendMessage, 
  driverName 
}: ContactDispatchModalProps) {
  const [message, setMessage] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(message.trim(), urgency);
      setSuccess(true);
      
      // Show success for 2 seconds, then close
      setTimeout(() => {
        setSuccess(false);
        setMessage('');
        setUrgency('medium');
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending && !success) {
      setMessage('');
      setUrgency('medium');
      setSuccess(false);
      onClose();
    }
  };

  const selectedUrgencyOption = URGENCY_OPTIONS.find(opt => opt.value === urgency);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Contact Dispatch</h3>
              <p className="text-sm text-gray-400">Send a message to dispatch team</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSending || success}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Success State */}
        {success && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Message Sent!</h3>
            <p className="text-gray-400">Dispatch has been notified and will respond soon.</p>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Driver Info */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>From: <span className="text-white font-medium">{driverName || 'Unknown Driver'}</span></span>
              </div>
            </div>

            {/* Priority Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Priority Level
              </label>
              <div className="space-y-2">
                {URGENCY_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-3 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="urgency"
                      value={option.value}
                      checked={urgency === option.value}
                      onChange={(e) => setUrgency(e.target.value as 'low' | 'medium' | 'high')}
                      className="form-radio text-blue-600 focus:ring-blue-500 bg-gray-700 border-gray-600"
                    />
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${option.bgColor} ${option.color} group-hover:opacity-80 transition-opacity`}>
                      {option.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message to dispatch here..."
                disabled={isSending}
                rows={4}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400 disabled:opacity-50 resize-none"
                required
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  Be specific about your needs or concerns
                </p>
                <span className={`text-xs ${message.length > 500 ? 'text-red-400' : 'text-gray-500'}`}>
                  {message.length}/500
                </span>
              </div>
            </div>

            {/* Priority Indicator */}
            {selectedUrgencyOption && (
              <div className={`flex items-center space-x-2 p-3 rounded-lg ${selectedUrgencyOption.bgColor} bg-opacity-20 border border-opacity-30 ${selectedUrgencyOption.color.replace('text-', 'border-')}`}>
                <div className={`w-2 h-2 rounded-full ${selectedUrgencyOption.color.replace('text-', 'bg-')}`}></div>
                <span className={`text-sm font-medium ${selectedUrgencyOption.color}`}>
                  {selectedUrgencyOption.label}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSending}
                className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!message.trim() || message.length > 500 || isSending}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {isSending ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}



