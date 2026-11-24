import React, { useState, useEffect } from 'react';

function BookingModal({ isOpen, onClose, selectedMatch, allMatches = [], onConfirmBooking }) {
  if (!isOpen || !selectedMatch) return null;

  // Form State
  const [matchId, setMatchId] = useState(selectedMatch.id || '01');
  const [stand, setStand] = useState(selectedMatch.stand || 'General');
  const [tickets, setTickets] = useState(selectedMatch.tickets || 1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preference, setPreference] = useState('Regular');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when selectedMatch prop changes
  useEffect(() => {
    if (selectedMatch) {
      setMatchId(selectedMatch.id || '01');
      setStand(selectedMatch.stand || 'General');
      setTickets(selectedMatch.tickets || 1);
    }
  }, [selectedMatch]);

  // Find currently active match details
  const activeMatch =
    allMatches.find((m) => m.id === matchId) || selectedMatch;

  const pricePerTicket =
    activeMatch && activeMatch.prices ? activeMatch.prices[stand] || 0 : 0;
  const totalPrice = pricePerTicket * Number(tickets);
  const availableSeats =
    activeMatch && activeMatch.available_seats !== undefined
      ? activeMatch.available_seats
      : 250;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agreeTerms) {
      alert('Please agree to the booking terms and conditions.');
      return;
    }

    if (tickets > availableSeats) {
      alert(`Only ${availableSeats} seat(s) remaining for this match!`);
      return;
    }

    setIsSubmitting(true);

    try {
      await onConfirmBooking({
        matchId: activeMatch.id,
        matchName: activeMatch.name,
        date: `${activeMatch.date} ${activeMatch.time || ''}`.trim(),
        venue: activeMatch.venue,
        stand,
        tickets: Number(tickets),
        total: totalPrice,
        availableSeats,
        userName: name.trim(),
        userEmail: email.trim(),
        userPhone: phone.trim(),
        preference,
      });

      onClose();
    } catch (err) {
      console.error('Error in booking modal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        padding: '15px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#f4f6f9',
          borderRadius: '12px',
          maxWidth: '960px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            background: '#092c5c',
            color: 'white',
            padding: '16px 24px',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, color: 'white', fontSize: '20px' }}>
            🎟️ IPL 2026 Ticket Booking Form
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '22px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body - Booking Container mirroring booking.html */}
        <div
          className="booking-container"
          style={{ margin: 0, padding: '20px', gap: '20px' }}
        >
          {/* Left Side: Ticket Booking Form */}
          <section className="booking-form" style={{ margin: 0 }}>
            <h3 style={{ color: '#092c5c', marginBottom: '15px' }}>
              Enter Personal &amp; Booking Details
            </h3>

            <form onSubmit={handleSubmit}>
              {/* Full Name with Constraints */}
              <div className="form-group">
                <label htmlFor="modal-name">Full Name (3 to 50 letters):</label>
                <input
                  type="text"
                  id="modal-name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  minLength={3}
                  maxLength={50}
                  pattern="[A-Za-z ]{3,50}"
                  title="Enter a name containing 3 to 50 letters."
                  required
                />
              </div>

              {/* Email Address with Constraints */}
              <div className="form-group">
                <label htmlFor="modal-email">Email Address:</label>
                <input
                  type="email"
                  id="modal-email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>

              {/* Phone Number with Constraints */}
              <div className="form-group">
                <label htmlFor="modal-phone">Phone Number (10 digits):</label>
                <input
                  type="tel"
                  id="modal-phone"
                  placeholder="Enter 10-digit phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  pattern="[0-9]{10}"
                  minLength={10}
                  maxLength={10}
                  title="Enter exactly 10 digits."
                  required
                />
              </div>

              {/* Auto-selected Match Dropdown */}
              <div className="form-group">
                <label htmlFor="modal-match">Selected Match:</label>
                <select
                  id="modal-match"
                  value={matchId}
                  onChange={(e) => setMatchId(e.target.value)}
                  required
                >
                  {allMatches.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} - {m.venue}
                    </option>
                  ))}
                </select>
              </div>

              {/* Auto-selected Stand Category */}
              <div className="form-group">
                <label htmlFor="modal-stand">Stand Category:</label>
                <select
                  id="modal-stand"
                  value={stand}
                  onChange={(e) => setStand(e.target.value)}
                  required
                >
                  <option value="General">General (₹{activeMatch.prices ? activeMatch.prices.General : 1200})</option>
                  <option value="Premium">Premium (₹{activeMatch.prices ? activeMatch.prices.Premium : 2500})</option>
                  <option value="VIP">VIP (₹{activeMatch.prices ? activeMatch.prices.VIP : 5000})</option>
                </select>
              </div>

              {/* Auto-selected Tickets Quantity */}
              <div className="form-group">
                <label htmlFor="modal-tickets">
                  Number of Tickets (1 to 10, Max {availableSeats} left):
                </label>
                <input
                  type="number"
                  id="modal-tickets"
                  min="1"
                  max={Math.min(10, availableSeats)}
                  step="1"
                  value={tickets}
                  onChange={(e) => setTickets(e.target.value)}
                  required
                />
              </div>

              {/* Booking Preference Radios */}
              <div className="form-group">
                <label>Booking Preference:</label>
                <div style={{ display: 'flex', gap: '20px', marginTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'normal', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="modal-preference"
                      value="Regular"
                      checked={preference === 'Regular'}
                      onChange={() => setPreference('Regular')}
                      style={{ width: 'auto' }}
                      required
                    />
                    Regular Booking
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'normal', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="modal-preference"
                      value="Priority"
                      checked={preference === 'Priority'}
                      onChange={() => setPreference('Priority')}
                      style={{ width: 'auto' }}
                    />
                    Priority Booking
                  </label>
                </div>
              </div>

              {/* Terms and Conditions Checkbox */}
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="modal-terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  style={{ width: 'auto', marginTop: '4px' }}
                  required
                />
                <label htmlFor="modal-terms" style={{ fontWeight: 'normal', cursor: 'pointer' }}>
                  I agree to the IPL stadium guidelines and ticket booking terms.
                </label>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSubmitting || availableSeats <= 0}
                  style={{
                    flex: 2,
                    background: availableSeats <= 0 ? '#999' : '#092c5c',
                    cursor: availableSeats <= 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSubmitting ? 'Saving to Database...' : `Confirm Booking • ₹${totalPrice}`}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '5px',
                    border: '1px solid #ccc',
                    background: '#e0e0e0',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>

          {/* Right Side: Live Booking Summary */}
          <aside className="summary" style={{ margin: 0 }}>
            <h3 style={{ color: '#092c5c', borderBottom: '2px solid #ffcc00', paddingBottom: '8px' }}>
              Live Booking Summary
            </h3>

            <p>
              Selected Match: <strong style={{ color: '#092c5c' }}>{activeMatch.name}</strong>
            </p>
            <p>
              Match Date: <strong>{activeMatch.date} ({activeMatch.time || '7:30 PM'})</strong>
            </p>
            <p>
              📍 Location / Venue: <strong>{activeMatch.venue}</strong>
            </p>
            <p>
              Stand Category: <strong style={{ color: '#e63946' }}>{stand}</strong>
            </p>
            <p>
              Price per Ticket: <strong>₹{pricePerTicket}</strong>
            </p>
            <p>
              Ticket Quantity: <strong>{tickets}</strong>
            </p>
            <p>
              Available Seats: <strong style={{ color: availableSeats < 50 ? '#c62828' : '#2e7d32' }}>{availableSeats} seats</strong>
            </p>

            <div style={{ marginTop: '20px', padding: '12px', background: '#eef4fc', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', color: '#666' }}>Total Amount to Pay:</div>
              <div className="total" style={{ fontSize: '24px', color: '#092c5c' }}>
                ₹{totalPrice.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ marginTop: '15px', fontSize: '13px', color: '#666' }}>
              Database: <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>PostgreSQL (Supabase)</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default BookingModal;
