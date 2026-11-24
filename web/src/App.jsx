import { Navigate, Route, Routes } from "react-router-dom";
import { TabLayout } from "./components/BottomNav";
import { OfflineBanner } from "./components/OfflineBanner";
import { useAuth } from "./context/AuthContext";
import ForgotPassword from "./pages/ForgotPassword";
import Favorites from "./pages/Favorites";
import Home from "./pages/Home";
import KontrakanDetail from "./pages/KontrakanDetail";
import KontrakanList from "./pages/KontrakanList";
import KosDetail from "./pages/KosDetail";
import KosList from "./pages/KosList";
import MyListings from "./pages/MyListings";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import PropertyForm from "./pages/PropertyForm";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";

/** Halaman yang wajib login. Belum login -> ke halaman Login. */
function Private({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

/** Halaman khusus pemilik kos. */
function PemilikOnly({ children }) {
  const { isPemilik } = useAuth();
  return isPemilik ? children : <Navigate to="/" replace />;
}

/** Halaman Login/Daftar. Sudah login -> ke Beranda. */
function GuestOnly({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <>
    <OfflineBanner />
    <Routes>
      {/* Belum login */}
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/daftar" element={<GuestOnly><Register /></GuestOnly>} />
      <Route path="/verifikasi" element={<GuestOnly><VerifyOtp /></GuestOnly>} />
      <Route path="/lupa-password" element={<GuestOnly><ForgotPassword /></GuestOnly>} />

      {/* 5 tab dengan Bottom Navigation */}
      <Route element={<Private><TabLayout /></Private>}>
        <Route path="/" element={<Home />} />
        <Route path="/kos" element={<KosList />} />
        <Route path="/kontrakan" element={<KontrakanList />} />
        <Route path="/favorit" element={<Favorites />} />
        <Route path="/profil" element={<Profile />} />
      </Route>

      {/* Detail dan form (tanpa Bottom Navigation) */}
      <Route path="/iklan-saya" element={<Private><PemilikOnly><MyListings /></PemilikOnly></Private>} />
      <Route path="/kos/baru" element={<Private><PemilikOnly><PropertyForm key="kos-new" kind="kos" /></PemilikOnly></Private>} />
      <Route path="/kos/:id/ubah" element={<Private><PemilikOnly><PropertyForm key="kos-edit" kind="kos" /></PemilikOnly></Private>} />
      <Route path="/kos/:id" element={<Private><KosDetail /></Private>} />
      <Route path="/kontrakan/baru" element={<Private><PemilikOnly><PropertyForm key="kon-new" kind="kontrakan" /></PemilikOnly></Private>} />
      <Route path="/kontrakan/:id/ubah" element={<Private><PemilikOnly><PropertyForm key="kon-edit" kind="kontrakan" /></PemilikOnly></Private>} />
      <Route path="/kontrakan/:id" element={<Private><KontrakanDetail /></Private>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
