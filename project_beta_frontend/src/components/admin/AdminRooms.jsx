import { useEffect, useState } from "react";
import axiosInstance from "../../AxiosInstance";
import { useNavigate } from "react-router-dom";
import "./AdminRooms.css";

const ROOM_TYPES = ["single", "double", "suite"];

function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    room_number: "",
    room_type: "single",
    price: "",
    capacity: "",
    description: "",
    amenities: "",
    is_active: true,
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("admin/rooms/");
      setRooms(res.data.results ?? res.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const resetForm = () => {
    setEditingRoom(null);
    setFormData({
      room_number: "",
      room_type: "single",
      price: "",
      capacity: "",
      description: "",
      amenities: "",
      is_active: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        await axiosInstance.patch(`admin/rooms/${editingRoom.id}/`, formData);
        alert("Room updated successfully.");
      } else {
        await axiosInstance.post("admin/rooms/", formData);
        alert("Room created successfully.");
      }
      resetForm();
      fetchRooms();
    } catch (err) {
      const msg = err.response?.data;
      alert(typeof msg === "object" ? Object.values(msg).flat().join(" ") : "Operation failed.");
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      room_number: room.room_number,
      room_type: room.room_type,
      price: room.price,
      capacity: room.capacity,
      description: room.description || "",
      amenities: room.amenities || "",
      is_active: room.is_active,
    });
  };

  const handleDelete = async (room) => {
    if (!window.confirm(`Deactivate room ${room.room_number}? It will be hidden from listings.`)) return;
    try {
      await axiosInstance.delete(`admin/rooms/${room.id}/`);
      alert("Room deactivated.");
      fetchRooms();
    } catch (err) {
      alert("Failed to deactivate room.");
    }
  };

  const handleActivate = async (room) => {
    try {
      await axiosInstance.patch(`admin/rooms/${room.id}/`, { is_active: true });
      alert("Room activated.");
      fetchRooms();
    } catch (err) {
      alert("Failed to activate.");
    }
  };

  if (loading) return <div className="admin-loading">Loading rooms…</div>;

  return (
    <div className="admin-rooms">
      <div className="admin-header">
        <h1>Manage <em>Rooms</em></h1>
        <p>Add, edit, or deactivate hotel rooms.</p>
      </div>

      <div className="rooms-layout">
        {/* Form */}
        <div className="rooms-form-card">
          <h2>{editingRoom ? "Edit Room" : "Add New Room"}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Room Number *</label>
                <input type="text" name="room_number" value={formData.room_number} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Room Type *</label>
                <select name="room_type" value={formData.room_type} onChange={handleInputChange} required>
                  {ROOM_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Price per night (₹) *</label>
                <input type="number" step="0.01" name="price" value={formData.price} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Capacity (guests) *</label>
                <input type="number" name="capacity" value={formData.capacity} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" rows="2" value={formData.description} onChange={handleInputChange}></textarea>
            </div>
            <div className="form-group">
              <label>Amenities (comma separated)</label>
              <input type="text" name="amenities" value={formData.amenities} onChange={handleInputChange} placeholder="WiFi, AC, TV, Mini bar" />
            </div>
            <div className="form-group checkbox">
              <label>
                <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} />
                Active (visible to customers)
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">{editingRoom ? "Update Room" : "Create Room"}</button>
              {editingRoom && <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>}
            </div>
          </form>
        </div>

        {/* Rooms List */}
        <div className="rooms-list">
          <h2>All Rooms</h2>
          {rooms.length === 0 ? (
            <p>No rooms found.</p>
          ) : (
            <div className="rooms-table-container">
              <table className="rooms-table">
                <thead>
                  <tr><th>Number</th><th>Type</th><th>Price</th><th>Capacity</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {rooms.map(room => (
                    <tr key={room.id}>
                      <td>{room.room_number}</td>
                      <td>{room.room_type}</td>
                      <td>₹{room.price}</td>
                      <td>{room.capacity}</td>
                      <td><span className={`active-badge ${room.is_active ? "active" : "inactive"}`}>{room.is_active ? "Active" : "Inactive"}</span></td>
                      <td className="actions">
                        <button className="edit-btn" onClick={() => handleEdit(room)}>Edit</button>
                        {room.is_active ? (
                          <button className="deactivate-btn" onClick={() => handleDelete(room)}>Deactivate</button>
                        ) : (
                          <button className="activate-btn" onClick={() => handleActivate(room)}>Activate</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminRooms;