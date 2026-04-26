import { Routes, Route } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Rooms from "./Rooms";
import UserBookings from "./UserRoom";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Rooms />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} /> 
      <Route path="/user-profile" element={<UserBookings />} />
    </Routes>
  );
}

export default App;