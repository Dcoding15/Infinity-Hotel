import { useEffect, useState } from "react";
import axiosInstance from "./AxiosInstance";
import { useNavigate } from "react-router-dom";
import "./Rooms.css";

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, [page]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/?page=${page}`);

      setRooms(res.data.results);

      // Django pagination support
      if (res.data.count) {
        setTotalPages(Math.ceil(res.data.count / 10));
      }
    } catch (err) {
      console.error("Failed to fetch rooms:", err);

      if (err.response?.status === 401) {
        alert("Unauthorized! Please login again.");
      }
    } finally {
      setLoading(false);
    }
  };

const bookRoom = async (roomId) => {
  if (!checkIn || !checkOut) {
    alert("Please select check-in and check-out dates");
    return;
  }

  try {
    await axiosInstance.post(
      "user-rooms/book/",
      {
        room: roomId,
        check_in_date: checkIn,
        check_out_date: checkOut,
        total_price:
          rooms.find((r) => r.id === roomId)?.price || 0,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      }
    );

    alert("✅ Booking successful!");
  } catch (err) {
    console.error(err);

    if (err.response?.status === 401) {
      alert("Session expired. Please login again.");
    } else {
      alert(err.response?.data?.error || "Booking failed");
    }
  }
};

  if (loading)
    return <h3 style={{ textAlign: "center" }}>Loading rooms...</h3>;

  return (
    <>
{/* Header */}
      <div className="home-header">
        <div className="header-top">
          <button className="login-btn" onClick={() => navigate("/login")}>
            Login
          </button>
        </div>

        <h1>🏨 Hotel Management System</h1>
        <p>Book rooms easily and manage your stays</p>
      </div>

      {/* Main Content */}
      <div className="home-container">
        <h2 className="section-title">🏨 Available Rooms</h2>

        {rooms.length === 0 ? (
          <p className="empty-text">No rooms available</p>
        ) : (
          <>
            {/* Date Filters */}
            <div className="date-filter">
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />

              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>

            {/* Rooms Grid */}
            <div className="rooms-grid">
              {rooms.map((room) => (
                <div key={room.id} className="room-card">
                  <h3>Room {room.room_number}</h3>

                  <p><strong>Type:</strong> {room.room_type}</p>
                  <p><strong>Price:</strong> ₹{room.price}</p>
                  <p><strong>Capacity:</strong> {room.capacity}</p>
                  <p>
                    <strong>Status:</strong>{" "}
                    {room.is_available ? "Available" : "Booked"}
                  </p>

                  <button
                    onClick={() => bookRoom(room.id)}
                    className="book-btn"
                  >
                    Book Now
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >
                ⬅ Prev
              </button>

              <span>
                Page <strong>{page}</strong> of{" "}
                <strong>{totalPages}</strong>
              </span>

              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
              >
                Next ➡
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default Rooms;