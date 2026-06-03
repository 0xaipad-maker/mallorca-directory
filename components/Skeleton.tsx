import { View, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

export default function Skeleton({ width, height, borderRadius = 8, style }: {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={[{ width, height, borderRadius, backgroundColor: '#e2e8f0', opacity }, style]} />
  );
}

export function SkeletonCard({ style }: { style?: any }) {
  return (
    <View style={[ss.card, style]}>
      <Skeleton width={44} height={44} borderRadius={22} />
      <View style={ss.cardBody}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="50%" height={12} style={{ marginTop: 6 }} />
        <Skeleton width="40%" height={12} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View style={ss.list}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const ss = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    marginHorizontal: 16, marginBottom: 8, gap: 12,
  },
  cardBody: { flex: 1 },
  list: { paddingTop: 16 },
});
