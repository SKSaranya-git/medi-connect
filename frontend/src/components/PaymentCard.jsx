import React, { useEffect, useState, useRef } from 'react';
import md5 from 'crypto-js/md5';

// PayHere Sandbox credentials — replace with real values in production
const PAYHERE_MERCHANT_ID = import.meta.env.VITE_PAYHERE_MERCHANT_ID;
const PAYHERE_MERCHANT_SECRET = import.meta.env.VITE_PAYHERE_MERCHANT_SECRET;
const PAYHERE_SANDBOX_URL = import.meta.env.VITE_PAYHERE_SANDBOX_URL;

const PaymentCard = ({
  payment,
  customerInfo,
  orderId,
  onBeforeSubmit,
  onError,
  returnUrl,
  cancelUrl,
  notifyUrl,
  autoSubmit = false,
}) => {
  const formRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const autoSubmitTriggeredRef = useRef(false);

  const {
    doctorFee = 0.00,
    hospitalFee = 0.00,
    eChannellingFee = 399.00,
    discount = 0.00,
    noShowFee = 0.00,
    totalFee: providedTotalFee,
  } = payment || {};

  const {
    firstName = 'John',
    lastName = 'Doe',
    email = 'john@example.com',
    phone = '0771234567',
    address = 'No.1, Galle Road',
    city = 'Colombo',
    country = 'Sri Lanka',
  } = customerInfo || {};

  const totalFee =
    typeof providedTotalFee === 'number'
      ? providedTotalFee
      : doctorFee + hospitalFee + eChannellingFee - discount + noShowFee;

  const formatAmount = (amount) => {
    return amount.toLocaleString('en-us', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Generate PayHere hash
  const generateHash = () => {
    const generatedOrderId = orderId || 'APPT-' + Date.now();
    const amountFormatted = parseFloat(totalFee)
      .toLocaleString('en-us', { minimumFractionDigits: 2 })
      .replaceAll(',', '');
    const currency = 'LKR';
    const hashedSecret = md5(PAYHERE_MERCHANT_SECRET).toString().toUpperCase();
    const hash = md5(PAYHERE_MERCHANT_ID + generatedOrderId + amountFormatted + currency + hashedSecret)
      .toString()
      .toUpperCase();
    return { generatedOrderId, amountFormatted, currency, hash };
  };

  const handlePay = async () => {
    try {
      setSubmitting(true);

      if (!PAYHERE_MERCHANT_ID || !PAYHERE_MERCHANT_SECRET || !PAYHERE_SANDBOX_URL) {
        throw new Error('Payment gateway configuration is incomplete.');
      }

      const { generatedOrderId, amountFormatted, currency, hash } = generateHash();

      if (onBeforeSubmit) {
        await onBeforeSubmit({
          orderId: generatedOrderId,
          amount: Number(amountFormatted),
          currency,
        });
      }

      // Update hidden form fields dynamically
      const form = formRef.current;
      form.querySelector('[name="order_id"]').value = generatedOrderId;
      form.querySelector('[name="amount"]').value = amountFormatted;
      form.querySelector('[name="hash"]').value = hash;
      form.querySelector('[name="first_name"]').value = firstName;
      form.querySelector('[name="last_name"]').value = lastName;
      form.querySelector('[name="email"]').value = email;
      form.querySelector('[name="phone"]').value = phone;
      form.querySelector('[name="address"]').value = address;
      form.querySelector('[name="city"]').value = city;

      // Submit to PayHere sandbox
      form.submit();
    } catch (error) {
      if (onError) {
        onError(error.message || 'Failed to continue to payment gateway.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!autoSubmit || autoSubmitTriggeredRef.current || submitting) return;

    autoSubmitTriggeredRef.current = true;
    handlePay();
  }, [autoSubmit, submitting]);

  return (
    <div className="w-[300px] bg-white rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl">

      {/* Payment details section */}
      <div className="p-6">
        <h3 className="text-[16px] font-bold text-[#1e2a3a] m-0">Payment Details</h3>
        <p className="text-[13px] text-[#6b7b8d] mt-1 mb-5 leading-relaxed">
          Detailed payment breakdown on your transaction
        </p>

        {/* Fee rows */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[13.5px] text-[#4a5568]">Hos fee + Doc fee</span>
            <span className="text-[14px] font-bold text-[#1e2a3a]">Rs {formatAmount(doctorFee + hospitalFee)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[13.5px] text-[#4a5568]">eChannelling fee</span>
            <span className="text-[14px] font-bold text-[#1e2a3a]">Rs {formatAmount(eChannellingFee)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[13.5px] text-[#4a5568]">Discount</span>
            <span className="text-[14px] font-bold text-[#dc2626]">- Rs {formatAmount(discount)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[13.5px] text-[#4a5568]">No show fee</span>
            <span className="text-[14px] font-bold text-[#1e2a3a]">Rs {formatAmount(noShowFee)}</span>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-[#e8edf2]" />

          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-bold text-[#1e2a3a]">Total fee</span>
            <span className="text-[16px] font-bold text-[#1e2a3a]">Rs {formatAmount(totalFee)}</span>
          </div>
        </div>
      </div>

      {/* Pay button section */}
      <div className="px-6 pb-5 pt-2">
        <button
          onClick={handlePay}
          disabled={submitting}
          className="w-full py-3 bg-[#1e3068] text-white text-[15px] font-semibold rounded-xl border-none cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 hover:bg-[#162452] hover:shadow-lg active:scale-[0.98]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          {submitting ? 'Redirecting...' : 'Pay'}
        </button>
        <p className="text-[11.5px] text-[#6b7b8d] mt-3 leading-relaxed">
          {autoSubmit ? 'Redirecting you to the payment portal to confirm your appointment.' : 'Please click "Pay" button to confirm your appointment.'}
        </p>
      </div>

      {/* Hidden PayHere form */}
      <form
        ref={formRef}
        method="post"
        action={PAYHERE_SANDBOX_URL}
        className="hidden"
      >
        <input type="hidden" name="merchant_id" value={PAYHERE_MERCHANT_ID} />
        <input type="hidden" name="return_url" value={returnUrl || (window.location.origin + '/payments/checkout?status=success')} />
        <input type="hidden" name="cancel_url" value={cancelUrl || (window.location.origin + '/payments/checkout?status=cancelled')} />
        <input type="hidden" name="notify_url" value={notifyUrl || (window.location.origin + '/api/payments/notify')} />
        <input type="hidden" name="order_id" value="" />
        <input type="hidden" name="items" value="Doctor Appointment" />
        <input type="hidden" name="currency" value="LKR" />
        <input type="hidden" name="amount" value="" />
        <input type="hidden" name="first_name" value="" />
        <input type="hidden" name="last_name" value="" />
        <input type="hidden" name="email" value="" />
        <input type="hidden" name="phone" value="" />
        <input type="hidden" name="address" value="" />
        <input type="hidden" name="city" value="" />
        <input type="hidden" name="country" value="Sri Lanka" />
        <input type="hidden" name="hash" value="" />
      </form>
    </div>
  );
};

export default PaymentCard;
