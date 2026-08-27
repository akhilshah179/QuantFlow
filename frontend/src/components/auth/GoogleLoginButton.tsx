import React, { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { AlertTriangle } from 'lucide-react';

interface Props {
  onSuccess?: () => void;
  onError?: (err: string) => void;
  text?: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const GoogleLoginButton: React.FC<Props> = ({ onSuccess, onError, text = 'Continue with Google' }) => {
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const gisContainerRef = useRef<HTMLDivElement>(null);

  const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    if (!googleClientId) return;

    const initGis = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (response: any) => {
              if (response?.credential) {
                handleGoogleCredentialResponse(response.credential);
              } else {
                setLoading(false);
                if (onError) onError('No credential returned from Google login.');
              }
            },
            error_callback: (err: any) => {
              console.error('[GoogleLoginButton] GIS error:', err);
              if (onError) {
                if (err?.type === 'origin_mismatch' || err?.error === 'idpiframe_initialization_failed') {
                  onError(`Google login origin is unauthorized. Ensure ${window.location.origin} is added to Authorized JavaScript origins in Google Cloud Console.`);
                } else {
                  onError(err?.message || 'Google Identity Services initialization failed.');
                }
              }
            },
          });

          if (gisContainerRef.current) {
            gisContainerRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(gisContainerRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              width: 380,
              text: text.toLowerCase().includes('sign up') ? 'signup_with' : 'continue_with',
              logo_alignment: 'left',
            });
          }

          setScriptLoaded(true);
        } catch (err: any) {
          console.error('[GoogleLoginButton] GIS init error:', err);
          if (onError) onError(err?.message || 'Failed to initialize Google Sign-In.');
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGis();
      return;
    }

    const existingScript = document.getElementById('google-jssdk');
    if (existingScript) {
      existingScript.addEventListener('load', initGis);
      return () => existingScript.removeEventListener('load', initGis);
    }

    const script = document.createElement('script');
    script.id = 'google-jssdk';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initGis();
    };
    script.onerror = () => {
      if (onError) onError('Failed to load Google Identity Services script. Check network connection.');
    };
    document.body.appendChild(script);
  }, [googleClientId, text]);

  const handleGoogleCredentialResponse = async (credential: string) => {
    setLoading(true);
    try {
      const res: any = await api.post('/auth/google', { credential });
      const authData = res?.data ? res.data : res;
      if (!authData || !authData.token) {
        throw new Error('Google authentication failed: Missing token in response.');
      }
      login(authData.token, authData.user);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Google login failed.';
      if (onError) onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (!googleClientId) {
      if (onError) {
        onError('Google login is not configured. Add VITE_GOOGLE_CLIENT_ID to frontend/.env.');
      }
      return;
    }

    if (!scriptLoaded || !window.google?.accounts?.id) {
      if (onError) {
        onError('Google Identity Services script is loading. Please wait a moment and try again.');
      }
      return;
    }

    setLoading(true);
    try {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
          setLoading(false);
          const reason = notification.getNotDisplayedReason() || 'popup blocked';
          if (reason === 'unregistered_origin') {
            if (onError) onError(`Google login origin is unauthorized. Ensure ${window.location.origin} is added to Authorized JavaScript origins in Google Cloud Console.`);
          } else if (onError) {
            onError(`Google login popup was blocked or could not open (${reason}). Please allow popups for ${window.location.origin}.`);
          }
        } else if (notification.isSkippedMoment()) {
          setLoading(false);
          const reason = notification.getSkippedReason() || 'skipped';
          if (onError) onError(`Google login popup was skipped (${reason}).`);
        } else if (notification.isDismissedMoment()) {
          const reason = notification.getDismissedReason();
          if (reason !== 'credential_returned') {
            setLoading(false);
            if (onError) onError('Google login prompt was closed.');
          }
        }
      });
    } catch (err: any) {
      setLoading(false);
      if (onError) onError(err?.message || 'Failed to open Google account chooser.');
    }
  };

  // If VITE_GOOGLE_CLIENT_ID is missing
  if (!googleClientId) {
    return (
      <div className="w-full bg-[#fff8e6] border border-[#ffe58f] text-[#d48806] rounded-lg p-3 text-xs font-mono font-semibold flex items-center space-x-2">
        <AlertTriangle className="w-4 h-4 shrink-0 text-[#d48806]" />
        <span>Google login is not configured. Add VITE_GOOGLE_CLIENT_ID to frontend/.env.</span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center space-y-2">
      {/* Official GIS Rendered Button Container */}
      <div ref={gisContainerRef} className="w-full flex justify-center min-h-[40px]" />

      {/* Fallback Custom Action Button if GIS script is still loading */}
      {(!scriptLoaded || loading) && (
        <button
          type="button"
          onClick={handleClick}
          disabled={!scriptLoaded || loading}
          className="w-full bg-white hover:bg-[#f8f9fd] disabled:opacity-60 disabled:cursor-not-allowed border border-[#e0e3eb] text-[#131722] font-mono text-xs font-bold py-2.5 px-4 rounded-lg transition-all shadow-xs flex items-center justify-center space-x-3 cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{!scriptLoaded ? 'Loading Google Sign-In...' : loading ? 'Authenticating...' : text}</span>
        </button>
      )}
    </div>
  );
};
