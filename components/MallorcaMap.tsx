import LeafletMap from './LeafletMap';

export default function MallorcaMap({ height = 300, style }: { height?: number; style?: any }) {
  return <LeafletMap mode="overview" height={height} style={style} />;
}
