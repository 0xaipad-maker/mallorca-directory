import { View, Text, ScrollView, TouchableOpacity, Image, Modal, FlatList, Dimensions, StyleSheet, Platform } from 'react-native';
import { useState } from 'react';
import { categories } from '../utils/categories';
import { colors, spacing, borderRadius, shadows } from '../utils/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GalleryProps {
  photos?: string[];
  businessName: string;
  category: string;
}

export default function Gallery({ photos, businessName, category }: GalleryProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const categoryData = categories.find(c => c.id === category);
  const emoji = categoryData?.emoji || '📸';
  const hasPhotos = photos && photos.length > 0;

  const openModal = (index: number) => {
    setSelectedIndex(index);
    setModalVisible(true);
  };

  const renderPhoto = (uri: string, index: number) => (
    <TouchableOpacity key={index} onPress={() => openModal(index)} activeOpacity={0.8}>
      <Image source={{ uri }} style={styles.photo} />
    </TouchableOpacity>
  );

  const renderModalItem = ({ item }: { item: string }) => (
    <View style={styles.modalPage}>
      <Image source={{ uri: item }} style={styles.modalImage} resizeMode="contain" />
    </View>
  );

  const renderShowAll = () => (
    <TouchableOpacity
      style={styles.showAllOverlay}
      onPress={() => openModal(0)}
      activeOpacity={0.8}
    >
      <Text style={styles.showAllText}>Show all{'\n'}{photos!.length} photos</Text>
    </TouchableOpacity>
  );

  const onViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setSelectedIndex(viewableItems[0].index ?? 0);
    }
  };

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

  if (!hasPhotos) {
    return (
      <View style={[styles.placeholder, { backgroundColor: colors.primaryLight }]}>
        <View style={styles.gradientOverlay} />
        <Text style={styles.placeholderEmoji}>{emoji}</Text>
        <Text style={styles.placeholderText}>No photos yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={192}
      >
        {photos.map((uri, index) => renderPhoto(uri, index))}
        {renderShowAll()}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.pageIndicator}>
            {selectedIndex + 1}/{photos.length}
          </Text>

          <FlatList
            data={photos}
            renderItem={renderModalItem}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={selectedIndex}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            style={styles.flatList}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  scrollContent: {
    paddingLeft: spacing.lg,
    paddingVertical: spacing.sm,
    paddingRight: spacing.xs,
  },
  photo: {
    height: 240,
    width: 180,
    borderRadius: borderRadius.md,
    backgroundColor: colors.border,
    marginRight: spacing.sm,
  },
  showAllOverlay: {
    width: 140,
    height: 240,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  showAllText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
  placeholder: {
    height: 220,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...shadows.md,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    opacity: 0.12,
    transform: [{ rotate: '45deg' }, { scale: 1.5 }],
  },
  placeholderEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
    opacity: 0.9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  pageIndicator: {
    position: 'absolute',
    bottom: 50,
    zIndex: 10,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
  flatList: {
    flex: 1,
  },
  modalPage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
  },
});
