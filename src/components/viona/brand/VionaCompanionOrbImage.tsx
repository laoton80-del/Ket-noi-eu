import { Asset } from 'expo-asset';
import { Image, Platform, StyleSheet, View, type ViewStyle } from 'react-native';

const ORB = require('../../../../assets/brand/viona/viona-orb-clean.png');

/** Sphere bitmap with a thin rim on the upper half. */
export function VionaCompanionOrbImage({
  size,
}: Readonly<{ size: number; reducedMotion?: boolean }>) {
  const inset = Math.max(1, Math.round(size * 0.012));
  const rimWidth = size - inset * 2;
  const rimHeight = rimWidth / 2;

  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      {Platform.OS === 'web' ? (
        <View
          accessibilityIgnoresInvertColors
          style={[
            styles.image,
            {
              backgroundImage: `url("${Asset.fromModule(ORB).uri}")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundSize: 'contain',
            } as ViewStyle,
          ]}
        />
      ) : (
        <Image
          source={ORB}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          style={styles.image}
        />
      )}
      <View
        pointerEvents="none"
        style={[
          styles.upperRim,
          {
            width: rimWidth,
            height: rimHeight,
            left: inset,
            top: inset,
            borderTopLeftRadius: rimWidth / 2,
            borderTopRightRadius: rimWidth / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'visible',
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  upperRim: {
    position: 'absolute',
    zIndex: 2,
    backgroundColor: 'transparent',
    borderTopWidth: 1.5,
    borderLeftWidth: 1.25,
    borderRightWidth: 1.25,
    borderBottomWidth: 0,
    borderColor: 'rgba(244, 251, 255, 0.92)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: 'none',
          filter: 'none',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 58%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, #000 58%, transparent 100%)',
        } as ViewStyle)
      : {
          shadowOpacity: 0,
          elevation: 0,
        }),
  },
  image: {
    width: '100%',
    height: '100%',
    zIndex: 1,
    overflow: 'visible',
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
});
