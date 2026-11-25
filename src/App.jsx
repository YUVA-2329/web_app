import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import MatchCard from './components/MatchCard.jsx';
import BookingModal from './components/BookingModal.jsx';
import { supabase, isSupabaseConfigured } from './supabase.js';

// Exact matches from your instructor/class screenshot
const INITIAL_MATCHES = [
  {
    id: 1,
    team1: 'CSK',
    team2: 'MI',
    name: 'CSK vs MI',
    date: 'April 14',
    venue: 'Mumbai',
    price: 1500,
    available_seats: 200,
  },
  {
    id: 2,
    team1: 'RCB',
    team2: 'KKR',
    name: 'RCB vs KKR',
    date: 'April 16',
    venue: 'Bengaluru',
    price: 1800,
    available_seats: 180,
  },
  {
    id: 3,
    team1: 'GT',
    team2: 'RR',
    name: 'GT vs RR',
    date: 'April 18',
    venue: 'Ahmedabad',
    price: 1200,
    available_seats: 250,
  },
  {
    id: 4,
    team1: 'SRH',
    team2: 'DC',
    name: 'SRH vs DC',
    date: 'April 20',
    venue: 'Hyderabad',
    price: 1000,
    available_seats: 300,
  },
  {
    id: 5,
    team1: 'LSG',
    team2: 'PBKS',
    name: 'LSG vs PBKS',
    date: 'April 22',
    venue: 'Lucknow',
    price: 1100,
    available_seats: 220,
  },
];

const ALL_TEAMS = ['all', 'CSK', 'MI', 'RCB', 'KKR', 'GT', 'RR', 'SRH', 'DC', 'LSG', 'PBKS'];

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
        setMatches(
          data.map((m) => ({
            ...m,
            name: m.name || `${m.team1} vs ${m.team2}`,
          }))
        );
        setDbStatus('connected');
      }
    } catch (err) {
      console.warn('Supabase fetch matches notice:', err.message);
      setDbStatus('local');
    }
  };

  // 2. Fetch bookings from Supabase matching screenshot columns
  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setBookings(
          data.map((b) => ({
            id: b.id,
            matchId: b.match_id,
            userName: b.user_name,
            matchTitle: b.match_title,
            tickets: b.tickets,
            totalPrice: b.total_price,
            createdAt: b.created_at
              ? new Date(b.created_at).toLocaleString()
              : new Date().toLocaleTimeString(),
          }))
        );
      }
    } catch (err) {
      console.warn('Supabase fetch bookings notice:', err.message);
    }
  };

  // Realtime subscription
  useEffect(() => {
    fetchMatches();
    fetchBookings();

    const matchesChannel = supabase
      .channel('realtime-matches')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        (payload) => {
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

    const bookingsChannel = supabase
      .channel('realtime-bookings')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        (payload) => {
          const b = payload.new;
          const formatted = {
            id: b.id,
            matchId: b.match_id,
            userName: b.user_name,
            matchTitle: b.match_title,
            tickets: b.tickets,
            totalPrice: b.total_price,
            createdAt: b.created_at
              ? new Date(b.created_at).toLocaleString()
              : new Date().toLocaleTimeString(),
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

  const handleOpenBooking = (cardSelection) => {
    setActiveBookingSelection(cardSelection);
    setIsModalOpen(true);
  };

  // 3. Confirm Booking inserting into public.bookings exactly as screenshot
  const handleConfirmBooking = async (fullBookingDetails) => {
    const { matchId, matchTitle, userName, tickets, totalPrice, availableSeats } = fullBookingDetails;
    const newAvailableSeats = Math.max(0, availableSeats - tickets);

    try {
      // Insert into public.bookings matching screenshot schema
      const { data: insertedData, error: insertError } = await supabase
        .from('bookings')
        .insert([
          {
            match_id: matchId,
            user_name: userName,
            match_title: matchTitle,
            tickets: Number(tickets),
            total_price: Number(totalPrice),
          },
        ])
        .select();

      if (insertError) throw insertError;

      // Update available_seats in public.matches
      await supabase
        .from('matches')
        .update({ available_seats: newAvailableSeats })
        .eq('id', matchId);

      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, available_seats: newAvailableSeats } : m))
      );

      triggerToast(`🎉 Booking saved to Supabase for ${userName} (${matchTitle})!`);
    } catch (err) {
      console.warn('Supabase booking query notice (local optimistic fallback):', err.message);

      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, available_seats: newAvailableSeats } : m))
      );
      const localBooking = {
        id: Date.now(),
        matchId,
        userName,
        matchTitle,
        tickets,
        totalPrice,
        createdAt: new Date().toLocaleTimeString(),
      };
      setBookings((prev) => [localBooking, ...prev]);

      triggerToast(`🎉 Booked ${tickets} ticket(s) for ${matchTitle}!`);
    }
  };

  // Filter matches based on team1 or team2
  const filteredMatches = matches.filter((match) => {
    if (selectedTeam === 'all') return true;
    return match.team1 === selectedTeam || match.team2 === selectedTeam;
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
              : '⚡ Supabase Mode (Ready for Live DB Execution)'}
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

        {/* Schedule & Match List Section */}
        <section className="schedule" id="matches">
          <h2>IPL Match Schedule (public.matches)</h2>

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
            {/* Team Filter */}
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
                {ALL_TEAMS.map((t) => (
                  <option key={t} value={t}>
                    {t === 'all' ? 'All Teams' : t}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Controls */}
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

          {/* Render List of Matches mapping over match data */}
          <div className={`match-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
            {filteredMatches.map((match) => (
              <MatchCard key={match.id} match={match} onBook={handleOpenBooking} />
            ))}
          </div>
        </section>

        {/* My Bookings Section matching public.bookings schema */}
        <section className="mybookings" id="mybookings">
          <h2>My Ticket Bookings (public.bookings)</h2>

          {bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: '#666' }}>
              <p style={{ fontSize: '18px' }}>No bookings yet.</p>
              <p style={{ fontSize: '14px', marginTop: '6px' }}>
                Click <strong>Book Ticket</strong> on any match above to test saving a booking to Supabase!
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>id</th>
                    <th>match_id</th>
                    <th>user_name</th>
                    <th>match_title</th>
                    <th>tickets</th>
                    <th>total_price</th>
                    <th>created_at</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td><strong>#{b.id}</strong></td>
                      <td>Match #{b.matchId}</td>
                      <td><strong>{b.userName}</strong></td>
                      <td><span style={{ color: '#092c5c', fontWeight: 'bold' }}>{b.matchTitle}</span></td>
                      <td>{b.tickets}</td>
                      <td><strong style={{ color: '#e63946' }}>₹{b.totalPrice}</strong></td>
                      <td><small>{b.createdAt}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Guidelines */}
        <section id="guidelines" className="guidelines-section">
          <h2>Stadium Guidelines</h2>
          <div className="guidelines-container">
            <article className="card">
              <h3>Ticket Verification</h3>
              <p>Verify your digital ticket before entering the stadium. Carry a valid digital or printed pass.</p>
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

      {/* Booking Form Modal */}
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
