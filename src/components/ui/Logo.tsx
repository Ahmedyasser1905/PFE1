import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Image } from 'react-native';
import { theme } from '~/constants/theme';

// ✅ مهم: require خارج الكومبوننت (أفضل للأداء)
const ICON = require('../../../assets/icon.png');

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  style?: ViewStyle;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  style,
}) => {
  const boxSize = size === 'sm' ? 32 : size === 'md' ? 48 : 80;
  const fontSize = size === 'sm' ? 18 : size === 'md' ? 24 : 32;

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.box,
          {
            width: boxSize,
            height: boxSize,
            borderRadius: boxSize / 4,
          },
        ]}
      >
        <Image
          source={ICON}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: boxSize / 4,
          }}
          resizeMode="contain"
        />
      </View>

      {showText && (
        <Text
          style={[
            styles.text,
            {
              fontSize,
              color: size === 'lg' ? 'white' : theme.colors.text,
            },
          ]}
        >
          Apex
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  box: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',

    // Shadow iOS
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,

    // Shadow Android
    elevation: 5,
  },
  text: {
    fontWeight: '900',
    letterSpacing: -1,
  },
});