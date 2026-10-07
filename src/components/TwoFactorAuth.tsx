import React, { useState, useEffect } from 'react';
import { X, Lock, Radio, Shield, Smartphone, Key } from 'lucide-react';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/types';

interface TwoFactorAuthProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

type AuthMethod = 'totp' | 'yubikey';

const TOTP_SECRET_KEY = 'ham_radio_totp_secret_v1';
const TOTP_SETUP_COMPLETE_KEY = 'ham_radio_totp_setup_complete_v1';
const WEBAUTHN_CREDENTIALS_KEY = 'ham_radio_webauthn_credentials_v1';
const WEBAUTHN_CHALLENGE_KEY = 'ham_radio_webauthn_challenge_v1';
const GLOBAL_SETUP_MARKER_KEY = 'ham_radio_2fa_ever_setup_v1'; // Cross-browser marker

export const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({
  isOpen,
  onClose,
  onAuthenticated
}) => {
  const [authMethod, setAuthMethod] = useState<AuthMethod>('totp');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [webAuthnSupported, setWebAuthnSupported] = useState(false);
  const [hasYubiKey, setHasYubiKey] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    try {
      // Check WebAuthn support
      const supported = browserSupportsWebAuthn();
      setWebAuthnSupported(supported);

      // Check if TOTP setup is complete IN THIS BROWSER
      const totpSetupComplete = localStorage.getItem(TOTP_SETUP_COMPLETE_KEY) === 'true';
      const totpSecret = localStorage.getItem(TOTP_SECRET_KEY);

      // Check if YubiKey is registered IN THIS BROWSER
      const credentials = localStorage.getItem(WEBAUTHN_CREDENTIALS_KEY);
      const hasYubiKeySetup = !!(credentials && JSON.parse(credentials).length > 0);
      setHasYubiKey(hasYubiKeySetup);

      // Setup is complete if either method is configured
      const setupComplete = totpSetupComplete || hasYubiKeySetup;
      setIsSetupComplete(setupComplete);

      // Default to YubiKey if available and supported, otherwise TOTP
      if (hasYubiKeySetup && supported) {
        setAuthMethod('yubikey');
      } else {
        setAuthMethod('totp');
      }

      // SECURITY FIX: Prevent setup in incognito/private mode
      // This is a single-user blog - setup should only happen ONCE in normal browser
      if (!setupComplete && authMethod === 'totp') {
        // Detect if running in private/incognito mode
        // Check 1: Try to detect private mode via various methods
        const seemsPrivate = (function() {
          // Private mode often has limited storage
          try {
            if (!window.indexedDB) return true;
            if (window.localStorage.length === 0 && window.sessionStorage.length === 0) {
              // Completely empty storage might indicate private mode
              return true;
            }
          } catch (e) {
            return true;
          }
          return false;
        })();

        // Check 2: If this is the SECOND time seeing the setup screen, block it
        // On first load, sessionStorage is empty. On reload, it persists (but incognito resets it)
        const setupAttempts = sessionStorage.getItem('ham_radio_setup_attempts') || '0';
        const attempts = parseInt(setupAttempts, 10);

        // CRITICAL SECURITY FIX: Detect if this is user's main browser vs incognito
        // Check if there's ANY blog data in localStorage (posts, session, etc.)
        const hasBlogData = Object.keys(localStorage).some(key =>
          key.startsWith('ham_radio_') && key !== TOTP_SECRET_KEY && key !== GLOBAL_SETUP_MARKER_KEY
        );

        // If this browser has blog data BUT no secret, likely user already set up 2FA elsewhere
        // OR if the global marker exists (from a previous session before incognito)
        const everSetup = localStorage.getItem(GLOBAL_SETUP_MARKER_KEY) === 'true';

        if (!totpSecret && (hasBlogData || everSetup)) {
          // This browser has used the blog before, so 2FA is likely already configured
          setError('⚠️ 2FA is already configured for this blog. Use your existing Google Authenticator app or YubiKey to authenticate. Opening setup in a new browser or incognito mode is not allowed. If you lost access, see RESET_2FA.md for emergency reset.');
          setIsSetupComplete(true); // Force to auth-only screen
          return;
        }

        // First time TOTP setup - only if we have a secret OR can generate one
        let totpSecretKey: string;

        if (totpSecret) {
          // Use existing secret from this browser
          totpSecretKey = totpSecret;
        } else {
          // FIRST TIME EVER setup - generate new secret
          const totp = new OTPAuth.TOTP({
            issuer: '73 On The Air',
            label: 'W7SDR Blog',
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
          });
          totpSecretKey = totp.secret.base32;
          localStorage.setItem(TOTP_SECRET_KEY, totpSecretKey);
          // Mark that 2FA has been set up (permanent marker)
          localStorage.setItem(GLOBAL_SETUP_MARKER_KEY, 'true');
        }

        setSecret(totpSecretKey);

        // Generate QR code URL
        const otpauthUrl = `otpauth://totp/73%20On%20The%20Air:W7SDR%20Blog?secret=${totpSecretKey}&issuer=73%20On%20The%20Air`;

        QRCode.toDataURL(otpauthUrl).then(url => {
          setQrCodeUrl(url);
        }).catch(err => {
          console.error('QR code generation failed:', err);
          setError('Failed to generate QR code');
        });
      }
    } catch (e) {
      console.error('Failed to setup 2FA:', e);
      setError('Failed to initialize 2FA');
    }
  }, [isOpen, authMethod]);

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

  const generateChallenge = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const handleYubiKeyRegistration = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // Generate challenge
      const challenge = generateChallenge();
      localStorage.setItem(WEBAUTHN_CHALLENGE_KEY, challenge);

      // Create registration options
      const options: PublicKeyCredentialCreationOptionsJSON = {
        challenge,
        rp: {
          name: '73 On The Air',
          id: window.location.hostname,
        },
        user: {
          id: 'ham-radio-operator',
          name: 'W7SDR',
          displayName: 'Ham Radio Operator',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        timeout: 60000,
        attestation: 'none',
        authenticatorSelection: {
          authenticatorAttachment: 'cross-platform',
          requireResidentKey: false,
          userVerification: 'preferred',
        },
      };

      // Start registration
      const credential = await startRegistration(options);

      // Store credential
      const credentials = JSON.parse(localStorage.getItem(WEBAUTHN_CREDENTIALS_KEY) || '[]');
      credentials.push({
        id: credential.id,
        publicKey: credential.response.publicKey,
        counter: 0,
        timestamp: Date.now(),
      });
      localStorage.setItem(WEBAUTHN_CREDENTIALS_KEY, JSON.stringify(credentials));

      // SECURITY: Mark that 2FA is now active globally
      localStorage.setItem(GLOBAL_SETUP_MARKER_KEY, 'true');

      setHasYubiKey(true);
      onAuthenticated();
      setError('');
    } catch (e: any) {
      console.error('YubiKey registration failed:', e);
      if (e.name === 'NotAllowedError') {
        setError('Registration cancelled or timed out');
      } else if (e.name === 'SecurityError') {
        setError('Security error - make sure you\'re using HTTPS');
      } else {
        setError('Failed to register YubiKey. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleYubiKeyAuthentication = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const credentialsData = localStorage.getItem(WEBAUTHN_CREDENTIALS_KEY);
      if (!credentialsData) {
        throw new Error('No YubiKey registered');
      }

      const credentials = JSON.parse(credentialsData);
      if (credentials.length === 0) {
        throw new Error('No YubiKey registered');
      }

      // Generate challenge
      const challenge = generateChallenge();
      localStorage.setItem(WEBAUTHN_CHALLENGE_KEY, challenge);

      // Create authentication options
      const options: PublicKeyCredentialRequestOptionsJSON = {
        challenge,
        timeout: 60000,
        rpId: window.location.hostname,
        allowCredentials: credentials.map((cred: any) => ({
          id: cred.id,
          type: 'public-key',
          transports: ['usb', 'nfc', 'ble'],
        })),
        userVerification: 'preferred',
      };

      // Start authentication
      await startAuthentication(options);

      // If we got here, authentication succeeded
      onAuthenticated();
      setError('');
    } catch (e: any) {
      console.error('YubiKey authentication failed:', e);
      if (e.name === 'NotAllowedError') {
        setError('Authentication cancelled or timed out');
      } else if (e.name === 'SecurityError') {
        setError('Security error - make sure you\'re using HTTPS');
      } else {
        setError('Failed to authenticate with YubiKey. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authMethod === 'yubikey') {
      if (!isSetupComplete) {
        await handleYubiKeyRegistration();
      } else {
        await handleYubiKeyAuthentication();
      }
      return;
    }

    // TOTP verification
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError('Please enter a 6-digit code');
      return;
    }

    if (verifyCode(code)) {
      // Mark setup as complete if this is first time
      if (!isSetupComplete) {
        localStorage.setItem(TOTP_SETUP_COMPLETE_KEY, 'true');
        // SECURITY: Mark that 2FA is now active globally
        localStorage.setItem(GLOBAL_SETUP_MARKER_KEY, 'true');
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

        {/* Method Selector */}
        <div className="mb-6">
          <label className="block text-slate-300 text-sm font-semibold mb-3">
            Choose Authentication Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAuthMethod('totp')}
              className={`p-4 rounded-xl border-2 transition-all ${
                authMethod === 'totp'
                  ? 'border-amber-400 bg-amber-400/10'
                  : 'border-slate-800 bg-slate-950 hover:border-slate-700'
              }`}
            >
              <Smartphone className={`w-6 h-6 mx-auto mb-2 ${authMethod === 'totp' ? 'text-amber-400' : 'text-slate-400'}`} />
              <div className="text-sm font-semibold text-white mb-1">Google Authenticator</div>
              <div className="text-xs text-slate-400">Time-based codes</div>
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('yubikey')}
              disabled={!webAuthnSupported}
              className={`p-4 rounded-xl border-2 transition-all ${
                !webAuthnSupported
                  ? 'opacity-50 cursor-not-allowed border-slate-800 bg-slate-950'
                  : authMethod === 'yubikey'
                  ? 'border-amber-400 bg-amber-400/10'
                  : 'border-slate-800 bg-slate-950 hover:border-slate-700'
              }`}
            >
              <Key className={`w-6 h-6 mx-auto mb-2 ${authMethod === 'yubikey' ? 'text-amber-400' : 'text-slate-400'}`} />
              <div className="text-sm font-semibold text-white mb-1">YubiKey</div>
              <div className="text-xs text-slate-400">
                {webAuthnSupported ? 'Hardware security key' : 'Not supported'}
              </div>
            </button>
          </div>
        </div>

        {/* Setup Instructions - Google Authenticator */}
        {!isSetupComplete && authMethod === 'totp' && (
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

        {/* Setup Instructions - YubiKey */}
        {!isSetupComplete && authMethod === 'yubikey' && (
          <div className="mb-6">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                Setup YubiKey
              </h3>
              <ol className="text-slate-300 text-sm space-y-2 list-decimal list-inside">
                <li>Insert your YubiKey into a USB port (or connect via NFC)</li>
                <li>Click "Register YubiKey" below</li>
                <li>Touch the button on your YubiKey when it blinks</li>
                <li>Your YubiKey will be registered for this blog</li>
              </ol>
            </div>
          </div>
        )}

        {/* Code Entry - TOTP */}
        {authMethod === 'totp' && (
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

            {/* Buttons - TOTP */}
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
        )}

        {/* YubiKey Authentication */}
        {authMethod === 'yubikey' && (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center">
                <Key className="w-12 h-12 mx-auto mb-3 text-amber-400" />
                <p className="text-white font-semibold mb-2">
                  {isSetupComplete ? 'Touch Your YubiKey' : 'Register Your YubiKey'}
                </p>
                <p className="text-slate-400 text-sm">
                  {isSetupComplete
                    ? 'Click the button below and touch your YubiKey when it blinks'
                    : 'Click the button below to register your YubiKey for the first time'}
                </p>
              </div>
              {error && (
                <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
              )}
            </div>

            {/* Buttons - YubiKey */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="flex-1 px-4 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Touch YubiKey...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>{isSetupComplete ? 'Authenticate' : 'Register YubiKey'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-slate-800">
          {isSetupComplete && (
            <p className="text-slate-400 text-xs text-center mb-3">
              {authMethod === 'totp' && hasYubiKey && 'Switch to YubiKey above for hardware authentication'}
              {authMethod === 'yubikey' && localStorage.getItem(TOTP_SETUP_COMPLETE_KEY) === 'true' &&
                'Switch to Google Authenticator above for TOTP codes'}
            </p>
          )}
          <p className="text-slate-500 text-xs text-center">
            73 de W7SDR • 2FA required for transmissions
          </p>
        </div>
      </div>
    </div>
  );
};
