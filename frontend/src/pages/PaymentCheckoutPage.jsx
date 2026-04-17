import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import PaymentCard from '../components/PaymentCard';
import { appointmentApi, paymentApi, telemedicineApi } from '../services/api';

const toMoney = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const PaymentCheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const status = searchParams.get('status');
  const orderIdFromQuery = searchParams.get('orderId') || '';

  const appointmentFromState = location.state?.appointment || null;
  const customerInfoFromState = location.state?.customerInfo || null;
  const bookingNotice = location.state?.bookingNotice || '';
  const telemedicineNotice = location.state?.telemedicineNotice || '';
  const telemedicineSessionIdFromState = location.state?.telemedicineSessionId || '';

  const telemedicineSessionId = telemedicineSessionIdFromState || searchParams.get('sessionId') || '';

  const [fetchedAppointment, setFetchedAppointment] = useState(null);

  const appointment = useMemo(() => {
    if (fetchedAppointment) return fetchedAppointment;
    if (appointmentFromState) return appointmentFromState;

    return {
      _id: searchParams.get('appointmentId') || '',
      doctorId: searchParams.get('doctorId') || '',
      patientId: searchParams.get('patientId') || '',
      doctorName: searchParams.get('doctorName') || 'Doctor not specified',
      appointmentDate: searchParams.get('appointmentDate') || '',
      appointmentTime: searchParams.get('appointmentTime') || '',
      totalFee: toMoney(searchParams.get('totalFee'), 0),
      doctorFee: toMoney(searchParams.get('doctorFee'), 0),
      hospitalFee: toMoney(searchParams.get('hospitalFee'), 0),
      eChannellingFee: toMoney(searchParams.get('eChannellingFee'), 399),
    };
  }, [appointmentFromState, searchParams, fetchedAppointment]);

  const appointmentType = appointment?.appointmentType || searchParams.get('appointmentType') || 'in-person';

  const customerInfo = useMemo(() => {
    if (customerInfoFromState) return customerInfoFromState;

    return {
      firstName: 'Patient',
      lastName: '',
      email: '',
      phone: '',
      address: 'N/A',
      city: 'N/A',
      country: 'Sri Lanka',
    };
  }, [customerInfoFromState]);

  const [error, setError] = useState('');
  const [linkedTelemedicineSessionId, setLinkedTelemedicineSessionId] = useState(telemedicineSessionId);
  const paymentInitializedRef = useRef(false);
  const confirmationProcessedRef = useRef(false);

  const hasAppointmentId = Boolean(appointment?._id || appointment?.id || searchParams.get('appointmentId'));
  const appointmentId = appointment?._id || appointment?.id || searchParams.get('appointmentId') || '';

  const orderId = useMemo(() => {
    if (orderIdFromQuery) return orderIdFromQuery;
    const base = appointmentId || `TEMP-${Date.now()}`;
    const suffix = Date.now().toString().slice(-6);
    return `APPT-${base}-${suffix}`;
  }, [appointmentId, orderIdFromQuery]);

  const totalFee = toMoney(appointment?.totalFee, 0);
  const doctorFee = toMoney(appointment?.doctorFee, 0);
  const hospitalFee = toMoney(appointment?.hospitalFee, 0);
  const eChannellingFee = toMoney(appointment?.eChannellingFee, 399);

  const returnUrl = `${window.location.origin}/payments/checkout?status=success&appointmentId=${encodeURIComponent(appointmentId)}&orderId=${encodeURIComponent(orderId)}`;
  const cancelUrl = `${window.location.origin}/payments/checkout?status=cancelled&appointmentId=${encodeURIComponent(appointmentId)}&orderId=${encodeURIComponent(orderId)}`;
  const notifyUrl = `${window.location.origin}/api/payments/notify`;
  const autoSubmitPayment = !status;
  const showTelemedicineLink = status === 'success' && Boolean(linkedTelemedicineSessionId);

  useEffect(() => {
    if (status !== 'success' || !appointmentId || confirmationProcessedRef.current) return;

    confirmationProcessedRef.current = true;

    const finalizeAppointment = async () => {
      try {
        if (orderId) {
          await paymentApi.updateByOrder(orderId, 'completed');
        }

        const confirmedAppointment = await appointmentApi.confirm(appointmentId);
        setFetchedAppointment(confirmedAppointment);

        if (appointmentType === 'telemedicine' && !linkedTelemedicineSessionId) {
          const appointmentDate = confirmedAppointment?.appointmentDate || appointment.appointmentDate;
          const appointmentTime = confirmedAppointment?.appointmentTime || appointment.appointmentTime;
          const scheduledAt = appointmentDate && appointmentTime
            ? new Date(`${appointmentDate}T${appointmentTime}:00`).toISOString()
            : new Date().toISOString();

          try {
            const telemedicineResponse = await telemedicineApi.createSession({
              appointmentId,
              doctorId: confirmedAppointment?.doctorId || appointment?.doctorId || '',
              patientId: confirmedAppointment?.patientId || appointment?.patientId || '',
              scheduledAt,
            });
            const sessionId = telemedicineResponse?.session?._id || '';
            if (sessionId) {
              setLinkedTelemedicineSessionId(sessionId);
            }
          } catch (sessionErr) {
            if (sessionErr?.status === 409 && sessionErr?.data?.session?._id) {
              setLinkedTelemedicineSessionId(sessionErr.data.session._id);
            } else {
              throw sessionErr;
            }
          }
        }
      } catch (err) {
        setError(err.message || 'Payment completed, but appointment confirmation failed. Please contact support.');
      }
    };

    finalizeAppointment();
  }, [status, appointmentId, appointmentType, appointment, linkedTelemedicineSessionId, orderId]);

  useEffect(() => {
    if (status !== 'cancelled' || !orderId) return;

    paymentApi.updateByOrder(orderId, 'failed').catch(() => {
      // Ignore cancellation sync failures; UI already reflects cancel path.
    });
  }, [status, orderId]);

  useEffect(() => {
    if (!appointmentFromState && !fetchedAppointment && appointmentId && status !== 'success') {
      appointmentApi.getById(appointmentId)
        .then(data => {
          if (data) setFetchedAppointment(data);
        })
        .catch(err => console.error("Failed to fetch appointment backup", err));
    }
  }, [appointmentId, appointmentFromState, fetchedAppointment, status]);

  const initializePayment = async ({ orderId: incomingOrderId, amount, currency }) => {
    if (paymentInitializedRef.current) return true;

    setError('');

    try {
      await paymentApi.process({
        appointment_id: appointmentId,
        patient_id: appointment?.patientId || '',
        order_id: incomingOrderId,
        amount,
        currency,
        payment_method: 'PAYHERE',
        payer_name: `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim() || 'Patient',
        payer_email: customerInfo.email || '',
        payer_phone: customerInfo.phone || '',
      });

      paymentInitializedRef.current = true;
      return true;
    } catch (err) {
      setError(err.message || 'Unable to initialize payment. Please try again.');
      throw err;
    }
  };

  if (!hasAppointmentId) {
    return (
      <div className="flex-1 bg-[#f4f7f9] min-h-screen py-12 px-6">
        <div className="max-w-3xl mx-auto bg-white border border-[#e8edf2] rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-[#1a3a4a]">No appointment found</h1>
          <p className="text-[#6b7b8d] mt-3">Please complete booking details before moving to payment.</p>
          <button
            onClick={() => navigate('/appointments')}
            className="mt-6 px-6 h-11 rounded-lg bg-[#0b5d94] text-white font-semibold border-none cursor-pointer hover:bg-[#094d7c]"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f4f7f9] min-h-screen pb-12">
      <div className="bg-[#1a3a4a] text-white py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold">Payment Gateway</h1>
          <p className="mt-2 text-[#a0d8ef] text-[14px]">Finalize payment to confirm your appointment</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {autoSubmitPayment && (
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg text-blue-800 text-[13.5px]">
            Your appointment is confirmed. We are opening the payment portal now.
          </div>
        )}

        {bookingNotice && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg text-green-700 text-[13.5px]">
            {bookingNotice}
          </div>
        )}

        {showTelemedicineLink && (
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg text-blue-800 text-[13.5px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-semibold">Telemedicine session is linked to this appointment.</p>
              <p className="text-[12.5px] text-blue-700 mt-0.5">{telemedicineNotice || 'You can open the video consultation room using the link below.'}</p>
            </div>
            <Link
              to={`/telemedicine/${linkedTelemedicineSessionId}`}
              className="px-4 h-9 inline-flex items-center justify-center bg-[#1a6fa0] text-white rounded-lg no-underline font-medium text-[13px] hover:bg-[#155f8a] transition-colors"
            >
              Open Telemedicine
            </Link>
          </div>
        )}

        {status === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg text-green-700 text-[13.5px]">
            Payment completed successfully. Your booking is now confirmed.
          </div>
        )}

        {status === 'cancelled' && (
          <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg text-amber-700 text-[13.5px]">
            Payment was cancelled. You can retry from this page.
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-700 text-[13.5px]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8edf2] p-8">
            <h2 className="text-[18px] font-bold text-[#1a3a4a] mb-5">Appointment Summary</h2>
            <div className="space-y-3 text-[14px]">
              <div className="flex justify-between"><span className="text-[#6b7b8d]">Appointment ID</span><strong className="text-[#1a3a4a]">{appointmentId}</strong></div>
              {showTelemedicineLink && <div className="flex justify-between"><span className="text-[#6b7b8d]">Telemedicine Session</span><strong className="text-[#1a3a4a]">{linkedTelemedicineSessionId}</strong></div>}
              <div className="flex justify-between"><span className="text-[#6b7b8d]">Doctor</span><strong className="text-[#1a3a4a]">{appointment.doctorName || 'N/A'}</strong></div>
              <div className="flex justify-between"><span className="text-[#6b7b8d]">Date</span><strong className="text-[#1a3a4a]">{appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</strong></div>
              <div className="flex justify-between"><span className="text-[#6b7b8d]">Time</span><strong className="text-[#1a3a4a]">{appointment.appointmentTime || 'N/A'}</strong></div>
              <div className="flex justify-between border-t border-[#e8edf2] pt-3"><span className="text-[#6b7b8d]">Order Ref</span><strong className="text-[#0b5d94]">{orderId}</strong></div>
            </div>
          </div>

          <PaymentCard
            payment={{
              doctorFee,
              hospitalFee,
              eChannellingFee,
              totalFee,
            }}
            customerInfo={customerInfo}
            orderId={orderId}
            returnUrl={returnUrl}
            cancelUrl={cancelUrl}
            notifyUrl={notifyUrl}
            onBeforeSubmit={initializePayment}
            onError={(message) => setError(message)}
            autoSubmit={autoSubmitPayment}
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentCheckoutPage;
