import { type ReactElement } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';

import { FontFamily } from '../../theme/typography';
import { VIONA_GLOBAL_LIGHT_NETWORK_TYPOGRAPHY, VIONA_IDENTITY_SETUP_NEON } from '../viona/globalLightNetworkTokens';

const GLN = VIONA_GLOBAL_LIGHT_NETWORK_TYPOGRAPHY;

export type IdentityGlassTextFieldProps = Readonly<{
  value: string;
  onChangeText: TextInputProps['onChangeText'];
  placeholder: string;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  testID?: string;
  accessibilityLabel?: string;
}>;

export function IdentityGlassTextField({
  value,
  onChangeText,
  placeholder,
  focused,
  onFocus,
  onBlur,
  testID,
  accessibilityLabel,
}: IdentityGlassTextFieldProps): ReactElement {
  return (
    <View style={styles.wrap}>
      <TextInput
        testID={testID}
        accessibilityLabel={accessibilityLabel ?? placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={VIONA_IDENTITY_SETUP_NEON.placeholder}
        onFocus={onFocus}
        onBlur={onBlur}
        style={[
          styles.input,
          {
            borderColor: focused ? VIONA_IDENTITY_SETUP_NEON.inputBorderFocus : VIONA_IDENTITY_SETUP_NEON.inputBorder,
            backgroundColor: focused ? VIONA_IDENTITY_SETUP_NEON.inputGlassFocus : VIONA_IDENTITY_SETUP_NEON.inputGlass,
            color: GLN.titleIvory,
            shadowColor: 'rgba(35, 183, 255, 0.35)',
            shadowOpacity: focused ? 0.35 : 0,
            shadowRadius: focused ? 12 : 0,
            shadowOffset: { width: 0, height: 0 },
          },
          Platform.OS === 'web' &&
            ({
              outlineWidth: 0,
              transitionProperty: 'border-color, box-shadow, background-color',
              transitionDuration: `${VIONA_IDENTITY_SETUP_NEON.transitionMs}ms`,
              transitionTimingFunction: 'ease-out',
            } as unknown as ViewStyle),
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    width: '100%',
  },
  input: {
    minHeight: VIONA_IDENTITY_SETUP_NEON.inputMinHeight,
    borderRadius: 12,
    borderWidth: 1.15,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: FontFamily.medium,
  },
});
