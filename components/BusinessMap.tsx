import LeafletMap from './LeafletMap';

export default function BusinessMap({ lat, lng, height = 480 }: { lat: number; lng: number; height?: number }) {
  return <LeafletMap mode="single" height={height} lat={lat} lng={lng} />;
}
