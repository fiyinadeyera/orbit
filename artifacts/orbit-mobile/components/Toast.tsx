import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type ToastVariant = 'success' | 'error';
type ToastState = { id: number; message: string; variant: ToastVariant } | null;

const ToastContext = createContext<{
  showToast: (message: string, variant?: ToastVariant) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const opacity = useSharedValue(0);
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setToast({ id: Date.now(), message, variant });
      opacity.value = withTiming(1, { duration: 180 });
      timeoutRef.current = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 220 });
      }, 2200);
    },
    [opacity],
  );

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            animatedStyle,
            {
              top: insets.top + 8,
              backgroundColor: toast.variant === 'error' ? colors.destructive : colors.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.text,
              {
                color:
                  toast.variant === 'error' ? colors.destructiveForeground : colors.primaryForeground,
              },
            ]}
          >
            {toast.message}
          </Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    zIndex: 999,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  text: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    textAlign: 'center',
  },
});
