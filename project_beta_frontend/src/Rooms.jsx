import { useEffect, useState } from "react";
import axiosInstance from "./AxiosInstance";

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  useEffect(() => {
    fetchRooms();
  }, [page]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`rooms/?page=${page}`);

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
      "/book-a-room/",
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
    <div style={{ maxWidth: "1000px", margin: "auto", padding: "20px" }}>
      <h2 style={{ textAlign: "center" }}>🏨 Available Rooms</h2>

      {rooms.length === 0 ? (
        <p style={{ textAlign: "center" }}>No rooms available</p>
      ) : (
        <>
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            style={{ marginRight: "10px", padding: "8px" }}
          />

          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            style={{ padding: "8px" }}
          />
        </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "20px",
              marginTop: "20px",
            }}
          >
            {rooms.map((room) => (
              <div
                key={room.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  padding: "15px",
                  background: "#fff",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                  transition: "0.2s",
                }}
              >
                <h3>Room {room.room_number}</h3>

                <p><strong>Type:</strong> {room.room_type}</p>
                <p><strong>Price:</strong> ₹{room.price}</p>
                <p><strong>Capacity:</strong> {room.capacity}</p>
                <p><strong>Status:</strong> {room.is_available ? "Available" : "Booked"}</p>

                <button
                  onClick={() => bookRoom(room.id)}
                  style={{
                    marginTop: "10px",
                    width: "100%",
                    padding: "10px",
                    border: "none",
                    borderRadius: "6px",
                    background: "#28a745",
                    color: "#fff",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  Book Now
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div
            style={{
              marginTop: "30px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              style={{ padding: "8px 12px" }}
            >
              ⬅ Prev
            </button>

            <span>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
              style={{ padding: "8px 12px" }}
            >
              Next ➡
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Rooms;