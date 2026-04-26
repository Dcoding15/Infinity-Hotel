import { useEffect, useState } from "react";
import axiosInstance from "../AxiosInstance";
import { useNavigate } from "react-router-dom";
import "./Rooms.css";

const ROOM_TYPES = ["", "single", "double", "suite"];

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [filters, setFilters] = useState({ room_type: "", min_price: "", max_price: "", capacity: "", available: "" });
  const [bookingRoomId, setBookingRoomId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, [page, filters]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page });
      Object.entries(filters).forEach(([k, v]) => { if (v !== "") params.set(k, v); });
      const res = await axiosInstance.get(`rooms/?${params}`);
      setRooms(res.data.results ?? res.data);
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

  const handleFilterChange = (key, value) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const bookRoom = async (room) => {
    const token = localStorage.getItem("access");
    if (!token) {
      navigate("/login");
      return;
    }
    if (!checkIn || !checkOut) {
      alert("Please select check-in and check-out dates before booking.");
      return;
    }
    setBookingRoomId(room.id);
    try {
      await axiosInstance.post("bookings/", {
        room: room.id,
        check_in_date: checkIn,
        check_out_date: checkOut,
      });
      alert(`Room ${room.room_number} booked! View it in My Bookings.`);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        const msg = err.response?.data;
        const text = msg && typeof msg === "object"
          ? Object.values(msg).flat().join(" ")
          : "Booking failed. Please try again.";
        alert(text);
      }
    } finally {
      setBookingRoomId(null);
    }
  };

  return (
    <>
      <div className="rooms-hero">
        <h1>Find your perfect <em>room</em></h1>
        <p>Browse our curated selection and book in seconds.</p>

        <div className="date-filter">
          <div className="date-group">
            <label className="date-label">Check-in</label>
            <input type="date" className="date-input" value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)} min={new Date().toISOString().split("T")[0]} />
          </div>
          <div className="date-group">
            <label className="date-label">Check-out</label>
            <input type="date" className="date-input" value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)} min={checkIn || new Date().toISOString().split("T")[0]} />
          </div>
        </div>
      </div>

      <main className="rooms-body">
        <div className="filters-bar">
          <select className="filter-select" value={filters.room_type}
            onChange={(e) => handleFilterChange("room_type", e.target.value)}>
            <option value="">All Types</option>
            {ROOM_TYPES.filter(Boolean).map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>

          <input type="number" className="filter-input" placeholder="Min price"
            value={filters.min_price} onChange={(e) => handleFilterChange("min_price", e.target.value)} />
          <input type="number" className="filter-input" placeholder="Max price"
            value={filters.max_price} onChange={(e) => handleFilterChange("max_price", e.target.value)} />
          <input type="number" className="filter-input" placeholder="Min guests"
            value={filters.capacity} onChange={(e) => handleFilterChange("capacity", e.target.value)} />

          <select className="filter-select" value={filters.available}
            onChange={(e) => handleFilterChange("available", e.target.value)}>
            <option value="">All Availability</option>
            <option value="true">Available</option>
            <option value="false">Booked</option>
          </select>

          <button className="filter-reset" onClick={() => {
            setFilters({ room_type: "", min_price: "", max_price: "", capacity: "", available: "" });
            setPage(1);
          }}>Reset</button>
        </div>

        <div className="section-header">
          <h2 className="section-title">Available Rooms</h2>
          {totalCount > 0 && <span className="room-count">{totalCount} rooms</span>}
        </div>

        {loading ? (
          <div className="loading-screen">Finding available rooms…</div>
        ) : rooms.length === 0 ? (
          <div className="empty-state"><p>No rooms match your filters.</p></div>
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
                    {room.amenities && (
                      <div className="meta-item meta-full">
                        <span className="meta-label">Amenities</span>
                        <span className="meta-value amenities">{room.amenities}</span>
                      </div>
                    )}
                  </div>

                  {room.description && (
                    <p className="room-description">{room.description}</p>
                  )}

                  <div className="room-divider" />

                  <button
                    className="book-btn"
                    onClick={() => bookRoom(room)}
                    disabled={!room.is_available || bookingRoomId === room.id}
                  >
                    {bookingRoomId === room.id ? "Booking…" : room.is_available ? "Book Now" : "Unavailable"}
                  </button>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button className="pagination-btn" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                  ← Previous
                </button>
                <span className="pagination-info">Page {page} of {totalPages}</span>
                <button className="pagination-btn" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}

export default Rooms;