import React, { useState, useEffect } from 'react';

function BookingModal({ isOpen, onClose, selectedMatch, allMatches = [], onConfirmBooking }) {
  if (!isOpen || !selectedMatch) return null;

  const [matchId, setMatchId] = useState(selectedMatch.id || 1);
  const [userName, setUserName] = useState('');
  const [tickets, setTickets] = useState(selectedMatch.tickets || 1);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedMatch) {
      setMatchId(selectedMatch.id || 1);
      setTickets(selectedMatch.tickets || 1);
    }
  }, [selectedMatch]);

  const activeMatch =
    allMatches.find((m) => Number(m.id) === Number(matchId)) || selectedMatch;

  const matchTitle =
    activeMatch.match_title ||
    activeMatch.name ||
    `${activeMatch.team1} vs ${activeMatch.team2}`;

  const pricePerTicket = Number(activeMatch.price) || 1500;
  const totalPrice = pricePerTicket * Number(tickets);
  const availableSeats =
    activeMatch.available_seats !== undefined ? activeMatch.available_seats : 200;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agreeTerms) {
      alert('Please agree to the booking terms.');
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
        matchTitle,
        userName: userName.trim(),
        tickets: Number(tickets),
        totalPrice: Number(totalPrice),
        availableSeats,
        date: activeMatch.date,
        venue: activeMatch.venue,
      });

      onClose();
    } catch (err) {
      console.error('Error submitting booking:', err);
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
          maxWidth: '900px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
            🎟️ IPL Ticket Booking Form
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

        {/* Form Body matching Supabase schema */}
        <div
          className="booking-container"
          style={{ margin: 0, padding: '20px', gap: '20px' }}
        >
          {/* Left Side: Inputs */}
          <section className="booking-form" style={{ margin: 0 }}>
            <h3 style={{ color: '#092c5c', marginBottom: '15px' }}>
              Enter Booking Details
            </h3>

            <form onSubmit={handleSubmit}>
              {/* user_name */}
              <div className="form-group">
                <label htmlFor="modal-username">Your Name (user_name):</label>
                <input
                  type="text"
                  id="modal-username"
                  placeholder="Enter your name (e.g. testname)"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  minLength={2}
                  maxLength={50}
                  required
                />
              </div>

              {/* match selection */}
              <div className="form-group">
                <label htmlFor="modal-match-select">Select Match (match_id):</label>
                <select
                  id="modal-match-select"
                  value={matchId}
                  onChange={(e) => setMatchId(Number(e.target.value))}
                  required
                >
                  {allMatches.map((m) => (
                    <option key={m.id} value={m.id}>
                      #{m.id} - {m.team1} vs {m.team2} ({m.venue})
                    </option>
                  ))}
                </select>
              </div>

              {/* tickets */}
              <div className="form-group">
                <label htmlFor="modal-tickets-count">
                  Number of Tickets (1 to 10, Max {availableSeats} left):
                </label>
                <input
                  type="number"
                  id="modal-tickets-count"
                  min="1"
                  max={Math.min(10, availableSeats)}
                  step="1"
                  value={tickets}
                  onChange={(e) => setTickets(Number(e.target.value))}
                  required
                />
              </div>

              {/* Terms Checkbox */}
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="modal-agree"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  style={{ width: 'auto', marginTop: '4px' }}
                  required
                />
                <label htmlFor="modal-agree" style={{ fontWeight: 'normal', cursor: 'pointer' }}>
                  I agree to stadium entry guidelines and ticket policy.
                </label>
              </div>

              {/* Submit Buttons */}
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
                  {isSubmitting ? 'Saving to Supabase...' : `Confirm Booking • ₹${totalPrice.toLocaleString('en-IN')}`}
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

          {/* Right Side: Live Summary matching Screenshot Columns */}
          <aside className="summary" style={{ margin: 0 }}>
            <h3 style={{ color: '#092c5c', borderBottom: '2px solid #ffcc00', paddingBottom: '8px' }}>
              Live Booking Summary
            </h3>

            <p>
              Match Title (match_title):<br />
              <strong style={{ color: '#092c5c', fontSize: '16px' }}>{matchTitle}</strong>
            </p>
            <p>
              Match ID (match_id): <strong>#{activeMatch.id}</strong>
            </p>
            <p>
              Match Date: <strong>{activeMatch.date}</strong>
            </p>
            <p>
              📍 Location / Venue: <strong>{activeMatch.venue}</strong>
            </p>
            <p>
              Price per Ticket: <strong>₹{pricePerTicket}</strong>
            </p>
            <p>
              Tickets (tickets): <strong>{tickets}</strong>
            </p>
            <p>
              Available Seats: <strong style={{ color: availableSeats < 50 ? '#c62828' : '#2e7d32' }}>{availableSeats} seats</strong>
            </p>

            <div style={{ marginTop: '20px', padding: '12px', background: '#eef4fc', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', color: '#666' }}>Total Price (total_price):</div>
              <div className="total" style={{ fontSize: '24px', color: '#092c5c' }}>
                ₹{totalPrice.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ marginTop: '12px', fontSize: '12px', color: '#2e7d32', fontWeight: 'bold' }}>
              ✓ Saved to table: public.bookings
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default BookingModal;
