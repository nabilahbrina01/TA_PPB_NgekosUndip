import { Link } from "react-router-dom";
import { MapPin, Navigation } from "lucide-react";
import { ImageBox } from "./ImageBox";
import { FavoriteButton } from "./FavoriteButton";

/** Kartu di list Kos dan list Kontrakan. meta = [{ icon, text }] */
export function PropertyCard({ to, type, id, imageUrl, title, subtitle, price, priceSuffix, badge, badgeColor, meta = [], mine, fromMe }) {
  return (
    <Link to={to} className="property-card">
      <div className="card-image">
        <ImageBox src={imageUrl} alt={title} />
        <span className="badge" style={{ background: badgeColor }}>{badge}</span>
        {mine && <span className="badge mine">Iklan saya</span>}
        <div className="card-fav"><FavoriteButton type={type} id={id} /></div>
      </div>
      <div className="card-body">
        <h3>{title}</h3>
        <p className="muted card-loc"><MapPin size={14} /> {subtitle}</p>
        <div className="card-meta">
          {meta.map(({ icon: Icon, text }) => (
            <span key={text}><Icon size={14} /> {text}</span>
          ))}
          {fromMe != null && (
            <span className="from-me"><Navigation size={13} /> {fromMe.toLocaleString("id-ID", { maximumFractionDigits: 1 })} km dari kamu</span>
          )}
        </div>
        <p className="card-price"><strong>{price}</strong><span>{priceSuffix}</span></p>
      </div>
    </Link>
  );
}
