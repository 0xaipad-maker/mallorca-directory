import { useState } from 'react';
import { Image, View, StyleSheet, ActivityIndicator } from 'react-native';

export default function LazyImage({ uri, style, resizeMode = 'cover' }: {
  uri: string;
  style?: any;
  resizeMode?: 'cover' | 'contain';
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <View style={[style, ss.wrap]}>
      {!loaded && (
        <View style={[ss.placeholder, style]}>
          <ActivityIndicator size="small" color="#94a3b8" />
        </View>
      )}
      <Image
        source={{ uri }}
        style={[style, !loaded && ss.hidden]}
        resizeMode={resizeMode}
        onLoad={() => setLoaded(true)}
      />
    </View>
  );
}

const ss = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  placeholder: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
  hidden: { opacity: 0 },
});
