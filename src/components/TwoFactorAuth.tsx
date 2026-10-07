import React, { useState, useEffect } from 'react';
import { X, Lock, Radio, Shield, Smartphone } from 'lucide-react';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

interface TwoFactorAuthProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

const TOTP_SECRET_KEY = 'ham_radio_totp_secret_v1';
const TOTP_SETUP_COMPLETE_KEY = 'ham_radio_totp_setup_complete_v1';

export const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({
  isOpen,
  onClose,
  onAuthenticated
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    try {
      // Check if setup is already complete
      const setupComplete = localStorage.getItem(TOTP_SETUP_COMPLETE_KEY) === 'true';
      setIsSetupComplete(setupComplete);

      if (!setupComplete) {
        // First time setup - generate secret and QR code
        const existingSecret = localStorage.getItem(TOTP_SECRET_KEY);
        let totpSecret: string;

        if (existingSecret) {
          totpSecret = existingSecret;
        } else {
          // Generate new secret
          const totp = new OTPAuth.TOTP({
            issuer: '73 On The Air',
            label: 'W7SDR Blog',
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
          });
          totpSecret = totp.secret.base32;
          localStorage.setItem(TOTP_SECRET_KEY, totpSecret);
        }

        setSecret(totpSecret);

        // Generate QR code URL
        const otpauthUrl = `otpauth://totp/73%20On%20The%20Air:W7SDR%20Blog?secret=${totpSecret}&issuer=73%20On%20The%20Air`;

        QRCode.toDataURL(otpauthUrl).then(url => {
          setQrCodeUrl(url);
        });
      }
    } catch (e) {
      console.error('Failed to setup 2FA:', e);
      setError('Failed to initialize 2FA');
    }
  }, [isOpen]);

  const verifyCode = (inputCode: string): boolean => {
    try {
      const totpSecret = localStorage.getItem(TOTP_SECRET_KEY);
      if (!totpSecret) return false;

      const totp = new OTPAuth.TOTP({
        issuer: '73 On The Air',
        label: 'W7SDR Blog',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: totpSecret,
      });

      const currentToken = totp.generate();

      // Also check previous and next token (30 second window)
      const delta = totp.validate({ token: inputCode, window: 1 });

      return delta !== null;
    } catch (e) {
      console.error('Failed to verify code:', e);
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError('Please enter a 6-digit code');
      return;
    }

    if (verifyCode(code)) {
      // Mark setup as complete if this is first time
      if (!isSetupComplete) {
        localStorage.setItem(TOTP_SETUP_COMPLETE_KEY, 'true');
      }
      onAuthenticated();
      setCode('');
      setError('');
    } else {
      setError('Invalid code. Please try again.');
      setCode('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white">
              {isSetupComplete ? '2FA Authentication' : '2FA Setup'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Setup Instructions */}
        {!isSetupComplete && (
          <div className="mb-6">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-400" />
                Setup Google Authenticator
              </h3>
              <ol className="text-slate-300 text-sm space-y-2 list-decimal list-inside">
                <li>Install Google Authenticator app on your phone</li>
                <li>Open the app and tap "+" to add a new account</li>
                <li>Scan the QR code below</li>
                <li>Enter the 6-digit code to complete setup</li>
              </ol>
            </div>

            {/* QR Code */}
            {qrCodeUrl && (
              <div className="bg-white p-4 rounded-xl mb-4 flex flex-col items-center">
                <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                <p className="text-slate-600 text-xs mt-2 text-center">
                  Scan with Google Authenticator
                </p>
              </div>
            )}

            {/* Manual Entry */}
            <button
              onClick={() => setShowSecret(!showSecret)}
              className="text-slate-400 text-xs hover:text-slate-300 mb-2"
            >
              {showSecret ? 'Hide' : 'Show'} secret key for manual entry
            </button>
            {showSecret && secret && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 mb-4">
                <p className="text-slate-400 text-xs mb-1">Secret Key:</p>
                <code className="text-amber-400 text-sm font-mono break-all">{secret}</code>
              </div>
            )}
          </div>
        )}

        {/* Code Entry */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-slate-300 text-sm font-semibold mb-2">
              {isSetupComplete ? 'Enter 6-Digit Code' : 'Enter Code to Complete Setup'}
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-center text-2xl font-mono tracking-widest placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              placeholder="000000"
              autoFocus
            />
            {error && (
              <p className="text-red-400 text-xs mt-2">{error}</p>
            )}
            <p className="text-slate-500 text-xs mt-2">
              Open Google Authenticator and enter the 6-digit code
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Radio className="w-4 h-4" />
              <span>{isSetupComplete ? 'Verify' : 'Complete Setup'}</span>
            </button>
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-slate-800">
          <p className="text-slate-500 text-xs text-center">
            73 de W7SDR • Google Authenticator 2FA required for transmissions
          </p>
        </div>
      </div>
    </div>
  );
};
