import { WebView } from 'react-native-webview';
import React from 'react';

export default function PaymentScreen() {
  const html = `
  <html>
  <body>
  <button onclick="pay()" style="background-color: #007bff; color: white; border: none; padding: 10px 20px; font-size: 16px;margin: 100px;">Pay Now</button>

  <script src="https://newwebpay.qa.interswitchng.com/inline-checkout.js"></script>

  <script>
    function pay() {
      var paymentRequest = {
        merchant_code: "MX153376",
        pay_item_id: "5558761",
        txn_ref: "MX-" + Date.now(),
        amount: "3000",
        currency: 566,
        site_redirect_url: "https://example.com",
        mode: "TEST",
        onComplete: function(response) {
          window.ReactNativeWebView.postMessage(JSON.stringify(response));
        }
      };

      window.webpayCheckout(paymentRequest);
    }
  </script>
  </body>
  </html>
  `;

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html }}
      onMessage={(event) => {
        const data = JSON.parse(event.nativeEvent.data);
        console.log("Payment response:", data);
      }}
    />
  );
}