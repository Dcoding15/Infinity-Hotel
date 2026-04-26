import { useEffect, useState } from "react";
import axiosInstance from "./AxiosInstance";
import { useNavigate } from "react-router-dom";
import "./Rooms.css";

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const navigate = useNavigate();

  const isLoggedIn = Boolean(localStorage.getItem("access"));

  useEffect(() => {
    fetchRooms();
  }, [page]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/?page=${page}`);
      setRooms(res.data.results ?? []);
      if (res.data.count) {
        setTotalCount(res.data.count);
        setTotalPages(Math.ceil(res.data.count / 10));
      }
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  const bookRoom = async (roomId) => {
    if (!checkIn || !checkOut) {
      alert("Please select check-in and check-out dates before booking.");
      return;
    }

    try {
      const room = rooms.find((r) => r.id === roomId);
      await axiosInstance.post(
        "user-rooms/book/",
        {
          room: roomId,
          check_in_date: checkIn,
          check_out_date: checkOut,
          total_price: room?.price ?? 0,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
        }
      );
      alert("Booking confirmed! Check your profile for details.");
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        alert("Please sign in to book a room.");
        navigate("/login");
      } else {
        alert(err.response?.data?.error || "Booking failed. Please try again.");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login");
  };

  if (loading) {
    return <div className="loading-screen">Finding available rooms…</div>;
  }

  return (
    <>
      {/* Sticky header nav */}
      <header className="rooms-header">
        <div className="header-brand">∞ Hotel <span>Infinity</span></div>
        <div className="header-actions">
          <button className="btn-outline" onClick={() => navigate("/user-profile")}>
            My Bookings
          </button>
          {isLoggedIn ? (
            <button className="btn-amber" onClick={handleLogout}>
              Sign Out
            </button>
          ) : (
            <button className="btn-amber" onClick={() => navigate("/login")}>
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Hero band with date filters */}
      <div className="rooms-hero">
        <h1>Find your perfect <em>room</em></h1>
        <p>Browse our curated selection and book in seconds.</p>

        <div className="date-filter">
          <div className="date-group">
            <label className="date-label">Check-in</label>
            <input
              type="date"
              className="date-input"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>
          <div className="date-group">
            <label className="date-label">Check-out</label>
            <input
              type="date"
              className="date-input"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Room listing */}
      <main className="rooms-body">
        <div className="section-header">
          <h2 className="section-title">Available Rooms</h2>
          {totalCount > 0 && (
            <span className="room-count">{totalCount} rooms found</span>
          )}
        </div>

        {rooms.length === 0 ? (
          <div className="empty-state">
            <p>No rooms available at the moment. Check back soon.</p>
          </div>
        ) : (
          <>
            <div className="rooms-grid">
              {rooms.map((room) => (
                <div key={room.id} className="room-card">
                  <div className="room-card-head">
                    <span className="room-number">Room {room.room_number}</span>
                    <span className={`room-badge ${room.is_available ? "available" : "booked"}`}>
                      {room.is_available ? "Available" : "Booked"}
                    </span>
                  </div>

                  <div className="room-meta">
                    <div className="meta-item">
                      <span className="meta-label">Price / night</span>
                      <span className="meta-value price">₹{room.price}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Type</span>
                      <span className="meta-value">{room.room_type}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Capacity</span>
                      <span className="meta-value">{room.capacity} guests</span>
                    </div>
                  </div>

                  <div className="room-divider" />

                  <button
                    className="book-btn"
                    onClick={() => bookRoom(room.id)}
                    disabled={!room.is_available}
                  >
                    {room.is_available ? "Book Now" : "Unavailable"}
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >
                ← Previous
              </button>
              <span className="pagination-info">
                Page {page} of {totalPages}
              </span>
              <button
                className="pagination-btn"
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </main>
    </>
  );
}

export default Rooms;
