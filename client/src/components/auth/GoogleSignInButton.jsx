import { useEffect, useRef } from 'react';

const GOOGLE_SCRIPT_ID = 'google-identity-services';

export default function GoogleSignInButton({ onCredential }) {
  const buttonRef = useRef(null);
  const callbackRef = useRef(onCredential);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!clientId || !buttonRef.current) return undefined;
    let cancelled = false;

    const renderButton = () => {
      if (cancelled || !window.google?.accounts?.id || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response?.credential) callbackRef.current?.(response.credential);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      buttonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        width: Math.min(buttonRef.current.clientWidth || 340, 400),
        logo_alignment: 'left',
      });
    };

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
    if (window.google?.accounts?.id) {
      renderButton();
    } else if (existingScript) {
      existingScript.addEventListener('load', renderButton);
    } else {
      const script = document.createElement('script');
      script.id = GOOGLE_SCRIPT_ID;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = renderButton;
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      existingScript?.removeEventListener('load', renderButton);
    };
  }, [clientId]);

  if (!clientId) {
    return <p className="rounded-xl border border-dashed border-border px-4 py-3 text-center text-xs text-text-muted">Google sign-in will appear when VITE_GOOGLE_CLIENT_ID is configured.</p>;
  }

  return <div ref={buttonRef} className="flex min-h-11 w-full justify-center" aria-label="Continue with Google" />;
}
