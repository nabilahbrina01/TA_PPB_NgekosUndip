import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Crosshair, List, LoaderCircle, Map as MapIcon, Navigation, Plus, Search, SlidersHorizontal, Store, X } from "lucide-react";
import { FilterSheet } from "../components/FilterSheet";
import { ListingMap } from "../components/ListingMap";
import { PageHeader } from "../components/PageHeader";
import { PropertyCard } from "../components/PropertyCard";
import { SortMenu } from "../components/SortMenu";
import { EmptyView, ErrorView, Loading } from "../components/StateViews";
import { useAuth } from "../context/AuthContext";
import { useUserLocation } from "../context/LocationContext";
import { useToast } from "../context/ToastContext";
import { distanceFrom } from "../utils/geo";

/**
 * Halaman list yang dipakai bersama oleh Kos dan Kontrakan.
 * - useList(sort): custom hook yang memanggil API dengan urutan (?sort=)
 * - filters: chip filter (tipe kos / hanya yang tersedia)
 * - priceOf(item): harga untuk filter harga & label peta
 */
export default function ListingPage({ type, title, useList, filters, applyFilter, toCard, addLabel, priceOf, priceSuffix, priceStep, priceMax }) {
  const { user, isPemilik } = useAuth();
  const { location, status, requestLocation } = useUserLocation();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [keyword, setKeyword] = useState(params.get("q") || "");
  const [sort, setSort] = useState("termurah");
  const [chip, setChip] = useState(filters?.[0]?.value ?? null);
  const [onlyMine, setOnlyMine] = useState(false);
  const [view, setView] = useState("list"); // list | map
  const [sheetOpen, setSheetOpen] = useState(false);
  const [advanced, setAdvanced] = useState({ maxPrice: null, facilities: [] });
  const areaId = params.get("area");

  // "dari-saya" diurutkan di aplikasi, data diambil dengan urutan default
  const { data, loading, error, reload } = useList(sort === "dari-saya" ? "termurah" : sort);

  async function askLocation() {
    try {
      await requestLocation();
      toast("Lokasi ditemukan", "success");
      return true;
    } catch (err) {
      toast(err.message, "error");
      return false;
    }
  }

  async function changeSort(value) {
    if (value === "dari-saya" && !location && !(await askLocation())) return;
    setSort(value);
  }

  const allFacilities = useMemo(
    () => [...new Set((data || []).flatMap((i) => i.facilities || []))].sort(),
    [data],
  );

  const items = useMemo(() => {
    if (!data) return [];
    const q = keyword.trim().toLowerCase();
    const list = data.filter(
      (item) =>
        (!q || item.name.toLowerCase().includes(q) || (item.area?.name || "").toLowerCase().includes(q) || (item.address || "").toLowerCase().includes(q)) &&
        (!areaId || item.area_id === areaId) &&
        (!onlyMine || item.owner_id === user?.id) &&
        (!advanced.maxPrice || priceOf(item) <= advanced.maxPrice) &&
        advanced.facilities.every((f) => (item.facilities || []).includes(f)) &&
        applyFilter(item, chip),
    );
    if (sort === "dari-saya" && location) {
      return [...list].sort((a, b) => (distanceFrom(location, a) ?? 1e9) - (distanceFrom(location, b) ?? 1e9));
    }
    return list;
  }, [data, keyword, areaId, onlyMine, chip, user, applyFilter, advanced, priceOf, sort, location]);

  const areaName = data?.find((i) => i.area_id === areaId)?.area?.name;
  const advancedCount = (advanced.maxPrice ? 1 : 0) + advanced.facilities.length;

  return (
    <div>
      <PageHeader title={title} actions={<SortMenu value={sort} onChange={changeSort} />} />
      <div className="list-tools">
        <div className="search-row">
          <label className="search-box light">
            <Search size={18} />
            <input placeholder="Cari nama, area, atau alamat..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </label>
          <button className={"square-btn" + (advancedCount ? " active" : "")} onClick={() => setSheetOpen(true)} aria-label="Filter">
            <SlidersHorizontal size={20} />
            {advancedCount > 0 && <span className="dot-count">{advancedCount}</span>}
          </button>
        </div>
        <div className="chip-row">
          {areaId && (
            <button className="chip active" onClick={() => setParams({})}>
              Area: {areaName || "..."} <X size={14} />
            </button>
          )}
          {filters?.map((f) => (
            <button key={f.value} className={"chip" + (chip === f.value ? " active" : "")} onClick={() => setChip(f.value)}>
              {f.label}
            </button>
          ))}
          {isPemilik && (
            <button className={"chip" + (onlyMine ? " active" : "")} onClick={() => setOnlyMine(!onlyMine)}>
              <Store size={14} /> Iklan saya
            </button>
          )}
        </div>
        <div className="view-row">
          <div className="view-toggle">
            <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}><List size={16} /> Daftar</button>
            <button className={view === "map" ? "active" : ""} onClick={() => setView("map")}><MapIcon size={16} /> Peta</button>
          </div>
          <button className={"location-btn" + (location ? " on" : "")} onClick={askLocation} disabled={status === "loading"}>
            {status === "loading" ? <LoaderCircle size={15} className="spin" /> : location ? <Navigation size={15} /> : <Crosshair size={15} />}
            {location ? "Lokasi aktif" : "Lokasi saya"}
          </button>
        </div>
      </div>

      {loading && <Loading />}
      {error && <ErrorView error={error} onRetry={reload} />}
      {data && <p className="result-count">{items.length} {type === "kos" ? "kos" : "kontrakan"} ditemukan</p>}
      {data && items.length === 0 && (
        <EmptyView icon={Search} title="Tidak ada hasil" text="Coba kata kunci atau filter lain." />
      )}

      {data && view === "map" && items.length > 0 && (
        <ListingMap items={items} type={type} priceOf={priceOf} priceSuffix={priceSuffix} userLocation={location} />
      )}
      {view === "list" && (
        <div className="card-list">
          {items.map((item) => {
            const fromMe = distanceFrom(location, item);
            return (
              <PropertyCard key={item.id} type={type} id={item.id} to={`/${type}/${item.id}`}
                mine={isPemilik && item.owner_id === user?.id} fromMe={fromMe} {...toCard(item)} />
            );
          })}
        </div>
      )}

      {/* Tombol Pasang Iklan (Create) hanya untuk akun pemilik kos */}
      {isPemilik && view === "list" && (
        <Link to={`/${type}/baru`} className="fab">
          <Plus size={20} /> {addLabel}
        </Link>
      )}

      <FilterSheet key={sheetOpen ? "open" : "closed"} open={sheetOpen} onClose={() => setSheetOpen(false)} value={advanced}
        onApply={setAdvanced} maxLimit={priceMax} step={priceStep} facilities={allFacilities} priceSuffix={priceSuffix} />
    </div>
  );
}
