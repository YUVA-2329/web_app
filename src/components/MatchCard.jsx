import React, { useState } from 'react';

function MatchCard({ match, onBook }) {
  const { id, team1, team2, date, venue, price } = match;
  const matchTitle = match.name || `${team1} vs ${team2}`;
  const availableSeats = match.available_seats !== undefined ? match.available_seats : 200;
  const isSoldOut = availableSeats <= 0;

  const [ticketCount, setTicketCount] = useState(1);
  const totalPrice = Number(price) * Number(ticketCount);

  const handleBooking = () => {
    if (isSoldOut) {
      alert('This match is sold out!');
      return;
    }
    if (ticketCount > availableSeats) {
      alert(`Only ${availableSeats} seat(s) available for this match!`);
      return;
    }

    if (onBook) {
      onBook({
        id,
        matchId: id,
        team1,
        team2,
        name: matchTitle,
        matchTitle,
        date,
        venue,
        price,
        tickets: ticketCount,
        totalPrice,
        availableSeats,
      });
    }
  };

  return (
    <article className="match-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold', background: '#092c5c', color: 'white', padding: '3px 8px', borderRadius: '4px' }}>
          Match #{id}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 'bold',
              background: isSoldOut ? '#ffebee' : availableSeats < 50 ? '#fff3e0' : '#e8f5e9',
              color: isSoldOut ? '#c62828' : availableSeats < 50 ? '#e65100' : '#2e7d32',
              padding: '3px 8px',
              borderRadius: '4px',
            }}
          >
            💺 {isSoldOut ? 'Sold Out' : `${availableSeats} Seats`}
          </span>
          <span style={{ fontSize: '13px', color: '#666', fontWeight: 'bold' }}>
            📅 {date}
          </span>
        </div>
      </div>

      <h3 style={{ fontSize: '22px', margin: '8px 0 4px', color: '#092c5c' }}>
        {matchTitle}
      </h3>

      {/* Prominent Match Location & Venue */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: '#e8f0fe',
          color: '#123f78',
          border: '1px solid #c2d7fa',
          padding: '6px 12px',
          borderRadius: '6px',
          margin: '8px 0 12px',
          fontSize: '13.5px',
          fontWeight: 'bold',
          width: '100%',
        }}
      >
        <span>📍</span>
        <span>
          <strong>Location / Venue:</strong> {venue}
        </span>
      </div>

      {/* Price & Quantity Details */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8f9fa',
          padding: '12px',
          borderRadius: '8px',
          margin: '12px 0',
          border: '1px solid #eee',
        }}
      >
        <div>
          <span style={{ fontSize: '13px', color: '#666' }}>Price per Ticket: </span>
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#e63946' }}>
            ₹{price}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor={`tickets-${id}`} style={{ fontSize: '14px', margin: 0 }}>
            Qty:
          </label>
          <select
            id={`tickets-${id}`}
            value={ticketCount}
            disabled={isSoldOut}
            onChange={(e) => setTicketCount(Number(e.target.value))}
            style={{ width: '65px', padding: '6px' }}
          >
            {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0 16px' }}>
        <span style={{ fontSize: '14px', color: '#666' }}>Total Amount:</span>
        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#092c5c' }}>
          ₹{totalPrice.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Action Button */}
      <button
        type="button"
        className="book-btn"
        disabled={isSoldOut}
        onClick={handleBooking}
        style={{
          width: '100%',
          backgroundColor: isSoldOut ? '#888' : '#092c5c',
          cursor: isSoldOut ? 'not-allowed' : 'pointer',
          padding: '12px',
          fontSize: '15px',
          transition: 'background-color 0.3s ease',
        }}
      >
        {isSoldOut ? 'Sold Out' : `Book Ticket • ₹${totalPrice.toLocaleString('en-IN')}`}
      </button>
    </article>
  );
}

export default MatchCard;
