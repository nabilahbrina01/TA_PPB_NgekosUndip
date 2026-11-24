import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Bath, BedDouble, Check, DoorOpen, Footprints, House, MapPin, Phone,
  Sparkles, UserRound, Users, Venus, Mars, X,
} from "lucide-react";
import { Field } from "../components/FormFields";
import { GalleryUploader } from "../components/GalleryUploader";
import { LocationPicker } from "../components/LocationPicker";
import { ErrorView, Loading } from "../components/StateViews";
import { Counter, FacilityPicker, OptionCards, PriceInput, StepProgress } from "../components/WizardParts";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import areaService from "../services/areaService";
import kontrakanService from "../services/kontrakanService";
import kosService from "../services/kosService";
import { capitalize, formatDistance, formatRupiah } from "../utils/format";
import { CAMPUS, distanceKm } from "../utils/geo";

// Titik tengah tiap area (untuk memusatkan peta saat area dipilih)
const AREA_CENTERS = {
  Tembalang: [-7.0555, 110.4395],
  Sumurboto: [-7.0475, 110.431],
  Meteseh: [-7.07, 110.4525],
  Jatimulyo: [-7.0565, 110.4245],
  Banyumanik: [-7.065, 110.4175],
};

const STEPS = ["Foto & nama", "Lokasi", "Harga & kamar", "Fasilitas", "Kontak & tinjau"];

const FACILITIES = {
  kos: ["WiFi", "AC", "Kasur", "Lemari", "Meja belajar", "Kamar mandi dalam", "Kamar mandi luar", "Dapur bersama", "Parkir motor", "Laundry", "CCTV", "Water heater"],
  kontrakan: ["WiFi", "Ruang tamu", "Ruang keluarga", "Dapur", "Kamar mandi dalam", "Carport", "Parkir motor", "Halaman", "Teras", "Air PDAM", "CCTV"],
};

const KOS_TYPES = [
  { value: "putra", label: "Putra", icon: Mars, hint: "Khusus laki-laki" },
  { value: "putri", label: "Putri", icon: Venus, hint: "Khusus perempuan" },
  { value: "campur", label: "Campur", icon: Users, hint: "Laki-laki & perempuan" },
];

/**
 * Form tambah (URL .../baru) atau ubah (URL .../:id/ubah) iklan,
 * dibagi menjadi 5 langkah agar mudah diisi.
 * kind: "kos" atau "kontrakan"
 */
export default function PropertyForm({ kind }) {
  const isKos = kind === "kos";
  const label = isKos ? "Kos" : "Kontrakan";
  const service = isKos ? kosService : kontrakanService;
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    images: [], name: "", type: "campur", area_id: "", address: "", point: null, distance_km: "",
    price: "", available_rooms: 1, bedrooms: 2, bathrooms: 1, is_available: true,
    facilities: [], description: "", owner_name: user?.name || "", owner_phone: "",
  });
  const [areas, setAreas] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Ubah isian form, sekaligus hapus pesan error kolom yang diubah
  const update = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      Object.keys(patch).forEach((k) => delete next[k]);
      return next;
    });
  };

  // Ambil daftar area (dan data lama jika mode ubah)
  useEffect(() => {
    Promise.all([areaService.getAll(), isEdit ? service.getById(id) : Promise.resolve(null)])
      .then(([areaList, item]) => {
        setAreas(areaList);
        if (!item) return;
        if (item.owner_id !== user?.id) {
          throw new Error("Kamu hanya bisa mengubah iklan milikmu sendiri");
        }
        setForm({
          images: item.image_urls?.length ? item.image_urls : item.image_url ? [item.image_url] : [],
          point: item.latitude != null ? { lat: item.latitude, lng: item.longitude } : null,
          name: item.name || "",
          type: item.type || "campur",
          area_id: item.area_id || "",
          address: item.address || "",
          distance_km: item.distance_km ?? "",
          price: String((isKos ? item.price_per_month : item.price_per_year) ?? ""),
          available_rooms: item.available_rooms ?? 0,
          bedrooms: item.bedrooms ?? 1,
          bathrooms: item.bathrooms ?? 1,
          is_available: item.is_available ?? true,
          facilities: item.facilities || [],
          description: item.description || "",
          owner_name: item.owner_name || "",
          owner_phone: item.owner_phone || "",
        });
      })
      .catch(setLoadError)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Validasi per langkah sebelum lanjut
  function validateStep(s) {
    const e = {};
    if (s === 0 && !form.name.trim()) e.name = `Nama ${label.toLowerCase()} wajib diisi`;
    if (s === 1) {
      if (!form.area_id) e.area_id = "Pilih salah satu area";
      if (!form.point && String(form.distance_km).trim() && Number.isNaN(Number(String(form.distance_km).replace(",", ".")))) {
        e.distance_km = "Isi angka, contoh 1.5";
      }
    }
    if (s === 2 && !Number(form.price)) e.price = "Harga wajib diisi";
    if (s === 4 && form.owner_phone && form.owner_phone.replace(/\D/g, "").length < 9) {
      e.owner_phone = "Nomor WhatsApp belum lengkap";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    if (step === 0) navigate(-1);
    else {
      setErrors({});
      setStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function save() {
    for (let s = 0; s < STEPS.length; s++) {
      if (!validateStep(s)) {
        setStep(s);
        toast("Lengkapi data yang ditandai merah");
        return;
      }
    }
    // Nama kolom harus sama dengan kolom tabel di Supabase
    const distance = String(form.distance_km).trim();
    const common = {
      name: form.name.trim(),
      area_id: form.area_id,
      address: form.address.trim() || null,
      // Jika titik peta diisi, API menghitung ulang distance_km secara otomatis
      latitude: form.point?.lat ?? null,
      longitude: form.point?.lng ?? null,
      distance_km: form.point
        ? Math.round(distanceKm(form.point.lat, form.point.lng, CAMPUS.lat, CAMPUS.lng) * 10) / 10
        : distance ? Number(distance.replace(",", ".")) : null,
      facilities: form.facilities,
      description: form.description.trim() || null,
      image_urls: form.images,
      image_url: form.images[0] || null, // foto pertama = sampul
      owner_name: form.owner_name.trim() || null,
      owner_phone: form.owner_phone.trim() || null,
    };
    const payload = isKos
      ? { ...common, type: form.type, price_per_month: Number(form.price), available_rooms: Number(form.available_rooms) }
      : { ...common, price_per_year: Number(form.price), bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms), is_available: form.is_available };

    setSaving(true);
    try {
      if (isEdit) {
        await service.update(id, payload); // PUT
        toast(`Perubahan ${label.toLowerCase()} disimpan`);
        navigate(`/${kind}/${id}`, { replace: true });
      } else {
        const created = await service.create(payload); // POST
        toast(`Iklan ${label.toLowerCase()} berhasil dipasang 🎉`);
        navigate(`/${kind}/${created.id}`, { replace: true });
      }
    } catch (err) {
      toast(err.message);
    } finally {
      setSaving(false);
    }
  }

  const title = `${isEdit ? "Ubah" : "Pasang"} Iklan ${label}`;
  const header = (
    <header className="wizard-header">
      <button className="icon-btn light" onClick={() => navigate(-1)} aria-label="Tutup">
        <X size={22} />
      </button>
      <h1>{title}</h1>
    </header>
  );
  if (loading) return (<>{header}<Loading /></>);
  if (loadError) return (<>{header}<ErrorView error={loadError} /></>);

  const areaName = areas.find((a) => a.id === form.area_id)?.name;

  return (
    <div className="wizard">
      {header}
      <StepProgress steps={STEPS} current={step} />

      <div className="wizard-body">
        {step === 0 && (
          <section>
            <h2 className="wizard-title">Tampilkan properti terbaikmu</h2>
            <p className="wizard-sub">Foto yang terang dan rapi membuat iklan lebih menarik.</p>
            <GalleryUploader value={form.images} onChange={(images) => update({ images })} onError={toast} />
            <Field label={`Nama ${label.toLowerCase()} *`} icon={House} placeholder={isKos ? "Contoh: Kos Melati Tembalang" : "Contoh: Rumah Sewa Banjarsari"}
              value={form.name} onChange={(e) => update({ name: e.target.value })} error={errors.name} />
            {isKos && (
              <>
                <span className="field-label">Tipe kos *</span>
                <OptionCards options={KOS_TYPES} value={form.type} onChange={(type) => update({ type })} />
              </>
            )}
          </section>
        )}

        {step === 1 && (
          <section>
            <h2 className="wizard-title">Di mana lokasinya?</h2>
            <p className="wizard-sub">Pilih area, lalu tandai titik propertinya di peta. Jarak ke Undip dihitung otomatis.</p>
            <span className="field-label">Area *</span>
            <div className="area-grid">
              {areas.map((a) => (
                <button type="button" key={a.id} className={"area-option" + (form.area_id === a.id ? " active" : "")}
                  onClick={() => update({ area_id: a.id })}>
                  <MapPin size={16} /> {a.name}
                </button>
              ))}
            </div>
            {errors.area_id && <p className="field-error">{errors.area_id}</p>}
            <Field label="Alamat lengkap" icon={MapPin} textarea rows={2} placeholder="Nama jalan, nomor, RT/RW"
              value={form.address} onChange={(e) => update({ address: e.target.value })} />
            <span className="field-label">Titik lokasi di peta</span>
            <LocationPicker value={form.point} onChange={(point) => update({ point })} onError={toast}
              fallbackCenter={AREA_CENTERS[areaName]} />
            {!form.point && (
              <Field label="Belum bisa menandai peta? Isi jarak perkiraan (km)" icon={Footprints} inputMode="decimal" placeholder="Contoh: 1.5"
                value={form.distance_km} onChange={(e) => update({ distance_km: e.target.value.replace(/[^0-9.,]/g, "") })}
                error={errors.distance_km} />
            )}
          </section>
        )}

        {step === 2 && (
          <section>
            <h2 className="wizard-title">Harga & ketersediaan</h2>
            <p className="wizard-sub">{isKos ? "Harga sewa per bulan." : "Harga sewa per tahun."}</p>
            <span className="field-label">Harga sewa *</span>
            <PriceInput value={form.price} onChange={(price) => update({ price })} placeholder={isKos ? "950.000" : "20.000.000"}
              suffix={isKos ? "/bulan" : "/tahun"} error={errors.price} />
            <div className="counter-card">
              {isKos ? (
                <Counter label="Kamar kosong" icon={DoorOpen} value={form.available_rooms} onChange={(n) => update({ available_rooms: n })} />
              ) : (
                <>
                  <Counter label="Kamar tidur" icon={BedDouble} min={1} value={form.bedrooms} onChange={(n) => update({ bedrooms: n })} />
                  <Counter label="Kamar mandi" icon={Bath} min={1} value={form.bathrooms} onChange={(n) => update({ bathrooms: n })} />
                </>
              )}
            </div>
            {!isKos && (
              <label className="switch-row">
                <span>
                  <strong>Masih tersedia</strong>
                  <small className="muted">{form.is_available ? "Tampil sebagai \"Tersedia\"" : "Tampil sebagai \"Sudah penuh\""}</small>
                </span>
                <input type="checkbox" className="toggle" checked={form.is_available} onChange={(e) => update({ is_available: e.target.checked })} />
              </label>
            )}
          </section>
        )}

        {step === 3 && (
          <section>
            <h2 className="wizard-title">Fasilitas apa saja?</h2>
            <p className="wizard-sub">Ketuk untuk memilih. {form.facilities.length} dipilih.</p>
            <FacilityPicker presets={FACILITIES[kind]} value={form.facilities} onChange={(facilities) => update({ facilities })} />
            <label className="field">
              <span className="field-label">Deskripsi</span>
              <textarea className="textarea" rows={4} maxLength={500}
                placeholder="Ceritakan suasana, aturan, atau kelebihan properti ini"
                value={form.description} onChange={(e) => update({ description: e.target.value })} />
              <span className="char-count">{form.description.length}/500</span>
            </label>
          </section>
        )}

        {step === 4 && (
          <section>
            <h2 className="wizard-title">Kontak & tinjau</h2>
            <p className="wizard-sub">Calon penyewa akan menghubungi nomor ini lewat WhatsApp.</p>
            <Field label="Nama pemilik" icon={UserRound} value={form.owner_name} onChange={(e) => update({ owner_name: e.target.value })} />
            <Field label="Nomor WhatsApp" icon={Phone} type="tel" placeholder="081234567890" value={form.owner_phone}
              onChange={(e) => update({ owner_phone: e.target.value.replace(/[^0-9+]/g, "") })} error={errors.owner_phone} />

            <span className="field-label">Pratinjau iklan</span>
            <div className="review-card">
              <div className="review-image">
                {form.images[0] ? <img src={form.images[0]} alt="" /> : <div className="image-box placeholder"><House size={36} /></div>}
                {isKos && <span className="badge">{`Kos ${capitalize(form.type)}`}</span>}
              </div>
              <div className="review-body">
                <h3>{form.name || "-"}</h3>
                <p className="muted with-icon"><MapPin size={14} /> {areaName || "-"} · {formatDistance(form.point ? distanceKm(form.point.lat, form.point.lng, CAMPUS.lat, CAMPUS.lng) : form.distance_km ? Number(String(form.distance_km).replace(",", ".")) : null)} ke kampus</p>
                <p className="price">{formatRupiah(form.price)}<small>{isKos ? "/bulan" : "/tahun"}</small></p>
                <div className="chip-row wrap">
                  {form.facilities.slice(0, 5).map((f) => <span key={f} className="chip static small-chip">{f}</span>)}
                  {form.facilities.length > 5 && <span className="chip static small-chip">+{form.facilities.length - 5}</span>}
                </div>
              </div>
              <ul className="review-checks">
                <li className={form.images.length ? "ok" : ""}><Check size={14} /> {form.images.length ? `${form.images.length} foto terpasang` : "Belum ada foto (boleh dilewati)"}</li>
                <li className={form.point ? "ok" : ""}><Check size={14} /> {form.point ? "Titik lokasi di peta sudah ditandai" : "Titik lokasi belum ditandai"}</li>
                <li className={form.facilities.length ? "ok" : ""}><Check size={14} /> {form.facilities.length} fasilitas</li>
                <li className={form.owner_phone ? "ok" : ""}><Check size={14} /> WhatsApp {form.owner_phone ? "terisi" : "belum diisi"}</li>
              </ul>
            </div>
          </section>
        )}
      </div>

      <div className="wizard-footer">
        <button type="button" className="btn btn-light" onClick={back}>
          <ArrowLeft size={18} /> {step === 0 ? "Batal" : "Kembali"}
        </button>
        {step < STEPS.length - 1 ? (
          <button type="button" className="btn btn-primary" onClick={next}>
            Lanjut <ArrowRight size={18} />
          </button>
        ) : (
          <button type="button" className="btn btn-gold" onClick={save} disabled={saving}>
            <Sparkles size={18} /> {saving ? "Menyimpan..." : isEdit ? "Simpan perubahan" : "Pasang iklan"}
          </button>
        )}
      </div>
    </div>
  );
}
