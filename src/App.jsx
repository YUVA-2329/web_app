import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import MatchCard from './components/MatchCard.jsx';
import BookingModal from './components/BookingModal.jsx';
import { supabase, isSupabaseConfigured } from './supabase.js';

const INITIAL_MATCHES = [
  {
    id: "01",
    name: "CSK vs MI",
    teams: ["CSK", "MI"],
    date: "10 Apr 2026",
    time: "7:30 PM",
    venue: "M. A. Chidambaram Stadium, Chennai",
    prices: {
      General: 1200,
      Premium: 2500,
      VIP: 5000
    },
    available_seats: 250
  },
  {
    id: "02",
    name: "RCB vs MI",
    teams: ["RCB", "MI"],
    date: "14 Apr 2026",
    time: "7:30 PM",
    venue: "M. Chinnaswamy Stadium, Bengaluru",
    prices: {
      General: 1500,
      Premium: 3000,
      VIP: 6000
    },
    available_seats: 180
  },
  {
    id: "03",
    name: "DC vs CSK",
    teams: ["DC", "CSK"],
    date: "18 Apr 2026",
    time: "7:30 PM",
    venue: "Arun Jaitley Stadium, Delhi",
    prices: {
      General: 1400,
      Premium: 3200,
      VIP: 6500
    },
    available_seats: 300
  },
  {
    id: "04",
    name: "RR vs RCB",
    teams: ["RR", "RCB"],
    date: "22 Apr 2026",
    time: "7:30 PM",
    venue: "Sawai Mansingh Stadium, Jaipur",
    prices: {
      General: 1800,
      Premium: 3500,
      VIP: 7000
    },
    available_seats: 220
  }
];

function App() {
  const [matches, setMatches] = useState(INITIAL_MATCHES);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [bookings, setBookings] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const [dbStatus, setDbStatus] = useState(isSupabaseConfigured ? 'connecting' : 'local');

  // Booking Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeBookingSelection, setActiveBookingSelection] = useState(null);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4500);
  };

  // 1. Fetch matches from Supabase using .from('matches').select('*') inside useEffect
  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setMatches(data);
        setDbStatus('connected');
      }
    } catch (err) {
      console.warn('Supabase fetch matches notice:', err.message);
      setDbStatus('local');
    }
  };

  // Fetch bookings from Supabase
  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;

      if (data) {
        setBookings(
          data.map((b) => ({
            id: b.id,
            matchId: b.match_id,
            matchName: b.match_name,
            date: b.date,
            venue: b.venue,
            stand: b.stand,
            tickets: b.tickets,
            total: b.total,
            userName: b.user_name || 'Fan',
            preference: b.preference || 'Regular',
            bookedAt: b.booked_at ? new Date(b.booked_at).toLocaleTimeString() : new Date().toLocaleTimeString(),
          }))
        );
      }
    } catch (err) {
      console.warn('Supabase fetch bookings notice:', err.message);
    }
  };

  // 2. Realtime subscription to auto-update when database changes occur
  useEffect(() => {
    fetchMatches();
    fetchBookings();

    // Subscribe to realtime changes on 'matches' table
    const matchesChannel = supabase
      .channel('realtime-matches')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        (payload) => {
          console.log('Realtime match change detected:', payload);
          if (payload.eventType === 'UPDATE' && payload.new) {
            setMatches((prev) =>
              prev.map((m) => (m.id === payload.new.id ? { ...m, ...payload.new } : m))
            );
          } else {
            fetchMatches();
          }
        }
      )
      .subscribe();

    // Subscribe to realtime changes on 'bookings' table
    const bookingsChannel = supabase
      .channel('realtime-bookings')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('Realtime booking detected:', payload);
          const b = payload.new;
          const formatted = {
            id: b.id,
            matchId: b.match_id,
            matchName: b.match_name,
            date: b.date,
            venue: b.venue,
            stand: b.stand,
            tickets: b.tickets,
            total: b.total,
            userName: b.user_name || 'Fan',
            preference: b.preference || 'Regular',
            bookedAt: b.booked_at ? new Date(b.booked_at).toLocaleTimeString() : new Date().toLocaleTimeString(),
          };
          setBookings((prev) => {
            if (prev.some((item) => item.id === formatted.id)) return prev;
            return [formatted, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(bookingsChannel);
    };
  }, []);

  // 3. Open Booking Form with Auto-Selected Points
  const handleOpenBooking = (cardSelection) => {
    setActiveBookingSelection(cardSelection);
    setIsModalOpen(true);
  };

  // 4. Implement booking by inserting into bookings and updating available_seats using .insert() and .update().eq()
  const handleConfirmBooking = async (fullBookingDetails) => {
    const {
      matchId,
      matchName,
      date,
      venue,
      stand,
      tickets,
      total,
      availableSeats,
      userName,
      userEmail,
      userPhone,
      preference,
    } = fullBookingDetails;

    const newAvailableSeats = Math.max(0, availableSeats - tickets);

    try {
      // Step A: Insert into bookings table in PostgreSQL
      const { data: insertedData, error: insertError } = await supabase
        .from('bookings')
        .insert([
          {
            match_id: matchId,
            match_name: matchName,
            date,
            venue,
            stand,
            tickets,
            total,
            user_name: userName,
            user_email: userEmail,
            user_phone: userPhone,
            preference,
          },
        ])
        .select();

      if (insertError) throw insertError;

      // Step B: Update available_seats in matches table in PostgreSQL
      const { error: updateError } = await supabase
        .from('matches')
        .update({ available_seats: newAvailableSeats })
        .eq('id', matchId);

      if (updateError) throw updateError;

      // Optimistic state updates
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, available_seats: newAvailableSeats } : m))
      );

      triggerToast(`🎉 Database Updated! Booked for ${userName} (${matchName})!`);
    } catch (err) {
      console.warn('Supabase booking query notice (local fallback active):', err.message);

      // Local state fallback if keys/tables pending
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, available_seats: newAvailableSeats } : m))
      );
      const localBooking = {
        id: Date.now(),
        ...fullBookingDetails,
        bookedAt: new Date().toLocaleTimeString(),
      };
      setBookings((prev) => [localBooking, ...prev]);

      triggerToast(`🎉 Booked ${tickets} ticket(s) for ${matchName}!`);
    }
  };

  // Filter matches based on team selection
  const filteredMatches = matches.filter((match) => {
    if (selectedTeam === 'all') return true;
    return match.teams && match.teams.includes(selectedTeam);
  });

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="toast"
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            background: '#092c5c',
            color: 'white',
            padding: '14px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            zIndex: 10001,
            fontWeight: 'bold',
            borderLeft: '5px solid #ffcc00',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Main Header */}
      <header className="main-header" style={{ position: 'relative' }}>
        <h1>IPL Ticket Booking 2026</h1>
        <div style={{ marginTop: '6px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              padding: '4px 12px',
              borderRadius: '20px',
              background: dbStatus === 'connected' ? '#2e7d32' : '#f57c00',
              color: 'white',
              fontWeight: 'bold',
            }}
          >
            {dbStatus === 'connected'
              ? '🟢 Supabase PostgreSQL Connected (Live Realtime)'
              : '⚡ Supabase Mode (Ready for Live DB Credentials)'}
          </span>
        </div>
      </header>

      {/* Reusable Navbar Component */}
      <Navbar bookingCount={bookings.length} />

      <main>
        {/* Reusable Hero Component */}
        <Hero
          onExploreClick={() => {
            const el = document.getElementById('matches');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* About Section */}
        <section className="about">
          <h2>About IPL 2026</h2>
          <p>
            IPL 2026 is an exciting cricket tournament featuring popular teams competing against
            each other. Experience thrilling matches with live PostgreSQL database inventory and
            realtime seat updates!
          </p>
        </section>

        {/* Schedule & Match List Section */}
        <section className="schedule" id="matches">
          <h2>IPL Match Schedule</h2>

          <div
            className="match-controls"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '15px',
              marginBottom: '20px',
            }}
          >
            {/* Team Filter (State Controlled) */}
            <div className="filter" style={{ margin: 0 }}>
              <label htmlFor="team-filter" style={{ marginRight: '8px', display: 'inline-block' }}>
                Filter By Team:
              </label>
              <select
                id="team-filter"
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                style={{ padding: '8px 12px', minWidth: '160px', display: 'inline-block', width: 'auto' }}
              >
                <option value="all">All Teams</option>
                <option value="CSK">CSK</option>
                <option value="MI">MI</option>
                <option value="RCB">RCB</option>
                <option value="DC">DC</option>
                <option value="RR">RR</option>
              </select>
            </div>

            {/* View Mode Controls (State Controlled) */}
            <div className="view-controls" style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                style={{
                  margin: 0,
                  padding: '8px 16px',
                  background: viewMode === 'grid' ? '#092c5c' : '#e0e0e0',
                  color: viewMode === 'grid' ? 'white' : '#333',
                  cursor: 'pointer',
                }}
              >
                Grid View
              </button>
              <button
                type="button"
                className={`btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                style={{
                  margin: 0,
                  padding: '8px 16px',
                  background: viewMode === 'list' ? '#092c5c' : '#e0e0e0',
                  color: viewMode === 'list' ? 'white' : '#333',
                  cursor: 'pointer',
                }}
              >
                List View
              </button>
            </div>
          </div>

          {/* Render List of Matches mapping over match data & Reusing MatchCard */}
          <div className={`match-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
            {filteredMatches.length > 0 ? (
              filteredMatches.map((match) => (
                <MatchCard key={match.id} match={match} onBook={handleOpenBooking} />
              ))
            ) : (
              <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '30px' }}>
                No matches found for the selected team filter.
              </p>
            )}
          </div>
        </section>

        {/* My Bookings Section */}
        <section className="mybookings" id="mybookings">
          <h2>My Ticket Bookings</h2>

          {bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: '#666' }}>
              <p style={{ fontSize: '18px' }}>No bookings yet.</p>
              <p style={{ fontSize: '14px', marginTop: '6px' }}>
                Click <strong>Book Ticket</strong> on any match above to fill your details and save your booking to the database!
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Match</th>
                    <th>Date &amp; Time</th>
                    <th>📍 Location / Stadium</th>
                    <th>Stand Category</th>
                    <th>Tickets</th>
                    <th>Total Amount</th>
                    <th>Booked At</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.userName || 'Fan'}</strong>
                        <br />
                        <small style={{ color: '#777' }}>{b.preference || 'Regular'}</small>
                      </td>
                      <td>
                        <strong>{b.matchName}</strong>
                      </td>
                      <td>{b.date}</td>
                      <td>
                        <strong>📍 {b.venue}</strong>
                      </td>
                      <td>
                        <span style={{ background: '#ffcc00', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                          {b.stand}
                        </span>
                      </td>
                      <td>{b.tickets}</td>
                      <td>
                        <strong style={{ color: '#092c5c' }}>₹{b.total}</strong>
                      </td>
                      <td>{b.bookedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Stadium Guidelines Section */}
        <section id="guidelines" className="guidelines-section">
          <h2>Stadium Guidelines</h2>
          <div className="guidelines-container">
            <article className="card">
              <h3>Ticket Verification</h3>
              <p>Verify your ticket before entering the stadium. Carry a valid digital or printed pass.</p>
            </article>

            <article className="card">
              <h3>ID Proof Requirement</h3>
              <p>Carry a valid government-issued ID proof along with your ticket for seamless entry.</p>
            </article>

            <article className="card">
              <h3>Prohibited Items</h3>
              <p>Outside food, hazardous objects, and restricted items are strictly prohibited inside.</p>
            </article>
          </div>
        </section>
      </main>

      {/* Booking Form Modal with Auto-selected Points & Constraints */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedMatch={activeBookingSelection}
        allMatches={matches}
        onConfirmBooking={handleConfirmBooking}
      />

      {/* Footer */}
      <footer>
        <p>&copy; 2026 IPL Ticket Booking. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

export default App;
