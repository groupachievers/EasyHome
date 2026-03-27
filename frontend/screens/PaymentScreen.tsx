import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import type { WebViewOpenWindowEvent } from 'react-native-webview/lib/WebViewTypes';

import { HOME_LISTINGS } from '@/constants/homes';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/hooks/useAuth';

const FALLBACK_INLINE_SCRIPT_URL = 'https://newwebpay.qa.interswitchng.com/inline-checkout.js';
const DEFAULT_MERCHANT_CODE = 'MX276216';
const DEFAULT_PAY_ITEM_ID = 'Default_Payable_MX276216';
const DEFAULT_CURRENCY = '566';

type CheckoutBootstrapResponse = {
  currency?: string;
  inlineScriptUrl?: string;
  merchantCode?: string;
  payItemId?: string;
  txn_ref: string;
};

type GatewayMessage = {
  message?: string;
  payload?: Record<string, unknown> | null;
  type: 'cancelled' | 'completed' | 'error';
};

type PaymentPhase = 'cancelled' | 'checkout' | 'failed' | 'preparing' | 'success' | 'verifying';

type VerificationResponse = {
  message: string;
  raw: unknown;
  success: boolean;
};

function resolveApiBaseUrl(): string | null {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  if (!envUrl) {
    return null;
  }

  return envUrl.replace(/\/+$/, '');
}

function formatCurrencyFromKobo(amountInKobo: number) {
  return new Intl.NumberFormat('en-NG', {
    currency: 'NGN',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(amountInKobo / 100);
}

function extractErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError(error)) {
    return (
      (typeof error.response?.data?.message === 'string' && error.response.data.message) ||
      error.message ||
      fallbackMessage
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

function withAlpha(hex: string, alpha: number) {
  const sanitizedHex = hex.replace('#', '');
  const normalizedHex =
    sanitizedHex.length === 3
      ? sanitizedHex
          .split('')
          .map((character) => `${character}${character}`)
          .join('')
      : sanitizedHex;
  const alphaHex = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');

  return `#${normalizedHex}${alphaHex}`;
}

function buildCheckoutHtml({
  amount,
  currency,
  customerEmail,
  customerName,
  inlineScriptUrl,
  merchantCode,
  payItemId,
  title,
  txnRef,
}: {
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  inlineScriptUrl: string;
  merchantCode: string;
  payItemId: string;
  title: string;
  txnRef: string;
}) {
  const serialized = {
    currency: JSON.stringify(currency),
    customerEmail: JSON.stringify(customerEmail),
    customerName: JSON.stringify(customerName),
    inlineScriptUrl: JSON.stringify(inlineScriptUrl),
    merchantCode: JSON.stringify(merchantCode),
    payItemId: JSON.stringify(payItemId),
    title: JSON.stringify(title),
    txnRef: JSON.stringify(txnRef),
  };

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Easyhome Payment</title>
    <script src=${serialized.inlineScriptUrl}></script>
    <style>
      :root {
        color-scheme: light;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      body {
        align-items: center;
        background: linear-gradient(160deg, #f6efe6 0%, #fffdf8 100%);
        color: #0f172a;
        display: flex;
        justify-content: center;
        margin: 0;
        min-height: 100vh;
        padding: 24px;
      }

      .shell {
        background: rgba(255, 255, 255, 0.94);
        border: 1px solid rgba(15, 118, 110, 0.16);
        border-radius: 24px;
        box-shadow: 0 18px 55px rgba(15, 23, 42, 0.12);
        max-width: 360px;
        padding: 28px 24px;
        text-align: center;
        width: 100%;
      }

      .spinner {
        animation: spin 0.95s linear infinite;
        border: 4px solid rgba(15, 118, 110, 0.14);
        border-top-color: #0f766e;
        border-radius: 999px;
        height: 40px;
        margin: 0 auto 18px;
        width: 40px;
      }

      h1 {
        font-size: 1.15rem;
        margin: 0 0 10px;
      }

      p {
        color: #475569;
        font-size: 0.95rem;
        line-height: 1.5;
        margin: 0;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }

        to {
          transform: rotate(360deg);
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <div class="spinner"></div>
      <h1>Opening secure payment popup</h1>
      <p>Stay in Easyhome while we load your Interswitch checkout.</p>
    </div>

    <script>
      const request = {
        merchant_code: ${serialized.merchantCode},
        pay_item_id: ${serialized.payItemId},
        txn_ref: ${serialized.txnRef},
        amount: ${amount},
        currency: ${serialized.currency},
        cust_email: ${serialized.customerEmail},
        customer_email: ${serialized.customerEmail},
        cust_name: ${serialized.customerName},
        customer_name: ${serialized.customerName},
        pay_item_name: ${serialized.title},
        pay_item_description: ${serialized.title},
      };

      let launched = false;

      function postToApp(payload) {
        if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      }

      function isCancelled(response) {
        const code = String(response?.resp || response?.responseCode || '').toUpperCase();
        const description = String(response?.desc || response?.responseDescription || '').toLowerCase();

        return code === 'Z6' || description.includes('cancel');
      }

      function handleCancel(response) {
        postToApp({
          type: 'cancelled',
          payload: response || { desc: 'Customer cancelled payment.' },
        });
      }

      function handleComplete(response) {
        if (isCancelled(response)) {
          handleCancel(response);
          return;
        }

        postToApp({
          type: 'completed',
          payload: response || null,
        });
      }

      request.callback = handleComplete;
      request.onComplete = handleComplete;
      request.onCancel = handleCancel;

      function launchCheckout() {
        if (launched) {
          return;
        }

        if (typeof window.webpayCheckout !== 'function') {
          postToApp({
            type: 'error',
            message: 'Unable to load the Interswitch inline checkout script.',
          });
          return;
        }

        launched = true;

        try {
          window.webpayCheckout(request);
        } catch (error) {
          postToApp({
            type: 'error',
            message: error?.message || 'Unable to start Interswitch checkout.',
          });
        }
      }

      if (document.readyState === 'complete') {
        setTimeout(launchCheckout, 150);
      } else {
        window.addEventListener('load', () => setTimeout(launchCheckout, 150));
      }
    </script>
  </body>
</html>`;
}

export default function PaymentScreen() {
  const params = useLocalSearchParams<{ homeId?: string | string[] }>();
  const homeId = Array.isArray(params.homeId) ? params.homeId[0] : params.homeId;
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];
  const styles = createStyles(palette);
  const router = useRouter();
  const { profile } = useAuth();

  const verificationInFlightRef = useRef(false);
  const apiBaseUrl = useMemo(resolveApiBaseUrl, []);
  const selectedHome = useMemo(() => HOME_LISTINGS.find((home) => home.id === homeId) || null, [homeId]);

  const [checkoutHtml, setCheckoutHtml] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gatewayPayload, setGatewayPayload] = useState<Record<string, unknown> | null>(null);
  const [phase, setPhase] = useState<PaymentPhase>('preparing');
  const [sessionNonce, setSessionNonce] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Preparing your secure payment popup...');
  const [txnRef, setTxnRef] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResponse | null>(null);
  const [webViewLoading, setWebViewLoading] = useState(true);

  useEffect(() => {
    if (!selectedHome) {
      setPhase('failed');
      setStatusMessage('The selected house could not be found.');
      setErrorMessage('Close this popup and choose a house again.');
      return;
    }

    if (!apiBaseUrl) {
      setPhase('failed');
      setStatusMessage('Payment backend is not configured.');
      setErrorMessage('Set EXPO_PUBLIC_API_BASE_URL in the root .env to your deployed backend URL, then restart Expo.');
      return;
    }

    let isActive = true;

    const prepareCheckout = async () => {
      verificationInFlightRef.current = false;
      setPhase('preparing');
      setStatusMessage('Generating a secure transaction reference...');
      setErrorMessage(null);
      setGatewayPayload(null);
      setVerificationResult(null);
      setCheckoutHtml('');
      setTxnRef(null);
      setWebViewLoading(true);

      try {
        const { data } = await axios.post<CheckoutBootstrapResponse>(
          `${apiBaseUrl}/generate-txn-ref`,
          { homeId: selectedHome.id },
          { timeout: 15000 }
        );

        if (!isActive) {
          return;
        }

        if (!data?.txn_ref) {
          throw new Error('Backend did not return a transaction reference.');
        }

        const nextHtml = buildCheckoutHtml({
          amount: selectedHome.annualRentKobo,
          currency: data.currency || DEFAULT_CURRENCY,
          customerEmail: profile?.email || 'customer@example.com',
          customerName: profile?.name || 'Easyhome Customer',
          inlineScriptUrl: data.inlineScriptUrl || FALLBACK_INLINE_SCRIPT_URL,
          merchantCode: data.merchantCode || DEFAULT_MERCHANT_CODE,
          payItemId: data.payItemId || DEFAULT_PAY_ITEM_ID,
          title: selectedHome.title,
          txnRef: data.txn_ref,
        });

        startTransition(() => {
          setCheckoutHtml(nextHtml);
          setPhase('checkout');
          setStatusMessage('Complete your Interswitch payment inside this popup.');
          setTxnRef(data.txn_ref);
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        const nextMessage = extractErrorMessage(error, 'Unable to prepare your Interswitch checkout.');
        setPhase('failed');
        setStatusMessage(nextMessage);
        setErrorMessage(nextMessage);
      }
    };

    void prepareCheckout();

    return () => {
      isActive = false;
    };
  }, [apiBaseUrl, profile?.email, profile?.name, selectedHome, sessionNonce]);

  const handleRetry = () => {
    if (!selectedHome) {
      return;
    }

    setSessionNonce((currentValue) => currentValue + 1);
  };

  const verifyPayment = async (reference: string, payload: Record<string, unknown> | null) => {
    verificationInFlightRef.current = true;
    setPhase('verifying');
    setStatusMessage('Payment received. Verifying with Interswitch...');
    setGatewayPayload(payload);
    setErrorMessage(null);

    try {
      const { data } = await axios.post<VerificationResponse>(
        `${apiBaseUrl}/verify-payment`,
        { txn_ref: reference },
        { timeout: 30000 }
      );

      setVerificationResult(data);
      setStatusMessage(data.message);

      if (data.success) {
        setPhase('success');
      } else {
        setPhase('failed');
        setErrorMessage(data.message);
      }
    } catch (error) {
      const nextMessage = extractErrorMessage(error, 'Unable to verify payment with the backend.');
      setPhase('failed');
      setStatusMessage(nextMessage);
      setErrorMessage(nextMessage);
    } finally {
      verificationInFlightRef.current = false;
    }
  };

  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    let message: GatewayMessage;

    try {
      message = JSON.parse(event.nativeEvent.data) as GatewayMessage;
    } catch (_error) {
      setPhase('failed');
      setStatusMessage('The checkout returned an unreadable response.');
      setErrorMessage('Unable to parse the Interswitch response payload.');
      return;
    }

    if (message.type === 'cancelled') {
      setGatewayPayload(message.payload || null);
      setPhase('cancelled');
      setStatusMessage('Payment cancelled. You can retry whenever you are ready.');
      setErrorMessage(null);
      Alert.alert('Payment cancelled', 'You cancelled the Interswitch checkout before payment was completed.');
      return;
    }

    if (message.type === 'error') {
      const nextMessage = message.message || 'The Interswitch checkout failed to launch.';
      setPhase('failed');
      setStatusMessage(nextMessage);
      setErrorMessage(nextMessage);
      return;
    }

    if (!txnRef) {
      setPhase('failed');
      setStatusMessage('Missing transaction reference for verification.');
      setErrorMessage('Restart the payment flow and try again.');
      return;
    }

    if (verificationInFlightRef.current) {
      return;
    }

    void verifyPayment(txnRef, message.payload || null);
  };

  const handleOpenWindow = (event: WebViewOpenWindowEvent) => {
    const targetUrl = event.nativeEvent.targetUrl;

    if (targetUrl) {
      console.log('[payment] Interswitch popup target: ' + targetUrl);
    }

    setStatusMessage('Interswitch opened its secure checkout layer inside Easyhome. Complete the payment here.');
  };

  const canShowWebView = phase === 'checkout' || phase === 'verifying';
  const formattedAmount = selectedHome ? formatCurrencyFromKobo(selectedHome.annualRentKobo) : 'NGN 0';
  const statusTone =
    phase === 'success'
      ? styles.statusSuccess
      : phase === 'failed'
        ? styles.statusError
        : phase === 'cancelled'
          ? styles.statusWarning
          : styles.statusNeutral;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.overlay}>
        <Pressable onPress={() => router.back()} style={styles.backdrop} />

        <View pointerEvents="box-none" style={styles.centerLayer}>
          <View style={styles.modalCard}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>Interswitch popup</Text>
                <Text style={styles.title}>Secure payment</Text>
                <Text style={styles.subtitle}>
                  Complete checkout without leaving the app or opening a browser tab.
                </Text>
              </View>

              <Pressable onPress={() => router.back()} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>

            {!selectedHome ? (
              <View style={styles.emptyState}>
                <Text style={styles.statusTitle}>House not found</Text>
                <Text style={styles.statusBody}>
                  Close this popup and select the house again to regenerate the payment session.
                </Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.summaryCard}>
                  <Text style={styles.cardEyebrow}>Selected house</Text>
                  <Text style={styles.homeTitle}>{selectedHome.title}</Text>
                  <Text style={styles.homeMeta}>{selectedHome.area}</Text>

                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Annual rent</Text>
                    <Text style={styles.amountValue}>{formattedAmount}</Text>
                  </View>

                  <Text style={styles.cardFootnote}>{selectedHome.price}</Text>
                  {txnRef ? <Text style={styles.cardMeta}>Transaction reference: {txnRef}</Text> : null}
                </View>

                <View style={[styles.statusCard, statusTone]}>
                  <Text style={styles.statusTitle}>Payment status</Text>
                  <Text style={styles.statusBody}>{statusMessage}</Text>
                  {errorMessage ? <Text style={styles.statusErrorText}>{errorMessage}</Text> : null}
                  <Text style={styles.statusMeta}>
                    This popup only calls the deployed backend in EXPO_PUBLIC_API_BASE_URL. Switch that backend to LIVE before production release.
                  </Text>
                </View>

                {canShowWebView ? (
                  <View style={styles.webViewCard}>
                    {Platform.OS === 'web' ? (
                      <View style={styles.webFallback}>
                        <Text style={styles.webFallbackTitle}>Use Android or iOS for payment testing.</Text>
                        <Text style={styles.webFallbackBody}>
                          The embedded Interswitch popup depends on `react-native-webview`.
                        </Text>
                      </View>
                    ) : checkoutHtml ? (
                      <>
                        <WebView
                          domStorageEnabled
                          javaScriptCanOpenWindowsAutomatically
                          javaScriptEnabled
                          key={txnRef || selectedHome.id}
                          onLoadEnd={() => setWebViewLoading(false)}
                          onLoadStart={() => setWebViewLoading(true)}
                          onMessage={handleWebViewMessage}
                          onOpenWindow={handleOpenWindow}
                          originWhitelist={['*']}
                          setSupportMultipleWindows={false}
                          sharedCookiesEnabled
                          source={{ html: checkoutHtml }}
                          style={styles.webView}
                          thirdPartyCookiesEnabled
                        />
                        {(webViewLoading || phase === 'verifying') ? (
                          <View style={styles.webViewOverlay}>
                            <ActivityIndicator color={palette.accent} size="large" />
                            <Text style={styles.overlayText}>
                              {phase === 'verifying' ? 'Verifying payment...' : 'Loading secure checkout...'}
                            </Text>
                          </View>
                        ) : null}
                      </>
                    ) : (
                      <View style={styles.webFallback}>
                        <ActivityIndicator color={palette.accent} size="large" />
                        <Text style={styles.webFallbackBody}>Preparing your checkout popup...</Text>
                      </View>
                    )}
                  </View>
                ) : null}

                {gatewayPayload ? (
                  <View style={styles.responseCard}>
                    <Text style={styles.responseTitle}>Gateway response</Text>
                    <Text style={styles.responseBody}>{JSON.stringify(gatewayPayload, null, 2)}</Text>
                  </View>
                ) : null}

                {verificationResult?.raw ? (
                  <View style={styles.responseCard}>
                    <Text style={styles.responseTitle}>Backend verification</Text>
                    <Text style={styles.responseBody}>{JSON.stringify(verificationResult.raw, null, 2)}</Text>
                  </View>
                ) : null}

                <View style={styles.actionsRow}>
                  {(phase === 'cancelled' || phase === 'failed') ? (
                    <Pressable onPress={handleRetry} style={styles.primaryButton}>
                      <Text style={styles.primaryButtonText}>Retry payment</Text>
                    </Pressable>
                  ) : null}

                  <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>{phase === 'success' ? 'Done' : 'Close popup'}</Text>
                  </Pressable>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(palette: typeof Colors.light) {
  return StyleSheet.create({
    actionsRow: {
      gap: 12,
      marginTop: 2,
    },
    amountLabel: {
      color: palette.muted,
      fontSize: 13,
    },
    amountRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 18,
    },
    amountValue: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 24,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: withAlpha('#0f172a', 0.64),
    },
    cardEyebrow: {
      color: palette.accent,
      fontFamily: Fonts.rounded,
      fontSize: 12,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    cardFootnote: {
      color: palette.muted,
      fontSize: 13,
      marginTop: 12,
    },
    cardMeta: {
      color: palette.muted,
      fontSize: 12,
      marginTop: 10,
    },
    centerLayer: {
      flex: 1,
      justifyContent: 'center',
      padding: 18,
    },
    closeButton: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      justifyContent: 'center',
      minWidth: 78,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    closeButtonText: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 13,
    },
    content: {
      padding: 18,
      paddingTop: 0,
    },
    emptyState: {
      padding: 24,
    },
    eyebrow: {
      color: palette.accent,
      fontFamily: Fonts.rounded,
      fontSize: 12,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    header: {
      alignItems: 'flex-start',
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 16,
      justifyContent: 'space-between',
      padding: 18,
    },
    headerCopy: {
      flex: 1,
    },
    homeMeta: {
      color: palette.muted,
      fontSize: 14,
      marginTop: 6,
    },
    homeTitle: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 24,
      marginTop: 10,
    },
    modalCard: {
      alignSelf: 'center',
      backgroundColor: palette.background,
      borderColor: palette.border,
      borderRadius: 30,
      borderWidth: 1,
      maxHeight: '92%',
      maxWidth: 560,
      overflow: 'hidden',
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.24,
      shadowRadius: 28,
      width: '100%',
    },
    overlay: {
      flex: 1,
    },
    overlayText: {
      color: palette.text,
      marginTop: 10,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: palette.accent,
      borderRadius: 18,
      paddingHorizontal: 18,
      paddingVertical: 15,
    },
    primaryButtonText: {
      color: palette.background,
      fontFamily: Fonts.rounded,
      fontSize: 15,
    },
    responseBody: {
      color: palette.muted,
      fontFamily: Fonts.mono,
      fontSize: 12,
      lineHeight: 20,
      marginTop: 10,
    },
    responseCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 24,
      borderWidth: 1,
      marginBottom: 16,
      padding: 18,
    },
    responseTitle: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 16,
    },
    safeArea: {
      backgroundColor: 'transparent',
      flex: 1,
    },
    secondaryButton: {
      alignItems: 'center',
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      paddingHorizontal: 18,
      paddingVertical: 15,
    },
    secondaryButtonText: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 15,
    },
    statusBody: {
      color: palette.text,
      fontSize: 14,
      lineHeight: 22,
      marginTop: 8,
    },
    statusCard: {
      borderRadius: 24,
      marginBottom: 16,
      padding: 18,
    },
    statusError: {
      backgroundColor: withAlpha('#ef4444', 0.08),
      borderColor: '#fca5a5',
      borderWidth: 1,
    },
    statusErrorText: {
      color: '#b91c1c',
      fontSize: 13,
      marginTop: 10,
    },
    statusMeta: {
      color: palette.muted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 10,
    },
    statusNeutral: {
      backgroundColor: withAlpha(palette.surface, 0.88),
      borderColor: palette.border,
      borderWidth: 1,
    },
    statusSuccess: {
      backgroundColor: withAlpha('#10b981', 0.08),
      borderColor: '#6ee7b7',
      borderWidth: 1,
    },
    statusTitle: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 17,
    },
    statusWarning: {
      backgroundColor: withAlpha('#f59e0b', 0.08),
      borderColor: '#fcd34d',
      borderWidth: 1,
    },
    subtitle: {
      color: palette.muted,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 8,
    },
    summaryCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 28,
      borderWidth: 1,
      marginBottom: 16,
      padding: 22,
    },
    title: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 28,
      marginTop: 8,
    },
    webFallback: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 260,
      padding: 24,
    },
    webFallbackBody: {
      color: palette.muted,
      fontSize: 14,
      lineHeight: 21,
      marginTop: 10,
      textAlign: 'center',
    },
    webFallbackTitle: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 18,
      textAlign: 'center',
    },
    webView: {
      backgroundColor: palette.surface,
      flex: 1,
    },
    webViewCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 28,
      borderWidth: 1,
      height: 500,
      marginBottom: 16,
      overflow: 'hidden',
      position: 'relative',
    },
    webViewOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      backgroundColor: withAlpha(palette.background, 0.82),
      justifyContent: 'center',
    },
  });
}