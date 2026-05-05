import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  View,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Metrics, Radius, Shadow, Spacing } from '../theme';

function SkeletonBlock({ style, shimmerStyle }) {
  const { Colors } = useTheme();
  const styles = makeStyles(Colors);
  return (
    <View style={[styles.skeletonBlock, style]}>
      <Animated.View style={[styles.skeletonShimmer, shimmerStyle]} />
    </View>
  );
}

export default function SyncLoader() {
  const { Colors, isDark } = useTheme();
  const { state } = useApp();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!state.isLoading) return undefined;

    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1150,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );

    shimmer.setValue(0);
    loop.start();

    return () => loop.stop();
  }, [state.isLoading, shimmer]);

  if (!state.isLoading) return null;

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-220, 220],
  });

  const shimmerStyle = {
    transform: [{ translateX: shimmerTranslate }],
  };

  const styles = makeStyles(Colors);
  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.canvas}>
          <View style={styles.headerRow}>
            <SkeletonBlock style={styles.headerTitle} shimmerStyle={shimmerStyle} />
            <SkeletonBlock style={styles.headerAction} shimmerStyle={shimmerStyle} />
          </View>

          <View style={styles.heroCard}>
            <SkeletonBlock style={styles.heroChip} shimmerStyle={shimmerStyle} />
            <SkeletonBlock style={styles.heroLineLg} shimmerStyle={shimmerStyle} />
            <SkeletonBlock style={styles.heroLineSm} shimmerStyle={shimmerStyle} />
          </View>

          <View style={styles.metricWrap}>
            <SkeletonBlock style={styles.metricLabel} shimmerStyle={shimmerStyle} />
            <SkeletonBlock style={styles.metricValue} shimmerStyle={shimmerStyle} />
            <SkeletonBlock style={styles.metricHint} shimmerStyle={shimmerStyle} />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <SkeletonBlock style={styles.sectionTitle} shimmerStyle={shimmerStyle} />
              <SkeletonBlock style={styles.sectionMeta} shimmerStyle={shimmerStyle} />
            </View>
            <SkeletonBlock style={styles.rowCard} shimmerStyle={shimmerStyle} />
            <SkeletonBlock style={styles.rowCard} shimmerStyle={shimmerStyle} />
            <SkeletonBlock style={styles.rowCardShort} shimmerStyle={shimmerStyle} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(Colors) { return StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  canvas: {
    flex: 1,
    paddingTop: Metrics.headerTop + 10,
    paddingHorizontal: Metrics.screenPadding,
  },
  skeletonBlock: {
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
  },
  skeletonShimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 140,
    backgroundColor: Colors.shimmer,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    width: 104,
    height: 28,
    borderRadius: Radius.sm,
  },
  headerAction: {
    width: 92,
    height: 38,
    borderRadius: Radius.pill,
  },
  heroCard: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    marginBottom: Spacing.lg,
    ...Shadow.soft,
  },
  heroChip: {
    width: 92,
    height: 24,
    borderRadius: Radius.pill,
    marginBottom: 12,
  },
  heroLineLg: {
    width: '88%',
    height: 22,
    marginBottom: 10,
  },
  heroLineSm: {
    width: '64%',
    height: 15,
  },
  metricWrap: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  metricLabel: {
    width: 96,
    height: 12,
    marginBottom: 14,
  },
  metricValue: {
    width: 180,
    height: 44,
    borderRadius: Radius.lg,
    marginBottom: 14,
  },
  metricHint: {
    width: 126,
    height: 12,
    borderRadius: Radius.sm,
  },
  section: {
    marginTop: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    width: 94,
    height: 18,
  },
  sectionMeta: {
    width: 70,
    height: 12,
    borderRadius: Radius.sm,
  },
  rowCard: {
    height: 76,
    borderRadius: Radius.lg,
    marginBottom: 10,
  },
  rowCardShort: {
    height: 76,
    width: '82%',
    borderRadius: Radius.lg,
  },
}); }
