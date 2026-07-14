import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/constants/colors';

const C = colors.light;

export function ConfirmModal({
  visible,
  icon = 'log-out',
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  icon?: React.ComponentProps<typeof Feather>['name'];
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <LinearGradient
            colors={destructive ? [C.destructive, '#FF8A9B'] : [C.primary, C.accent]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.iconCircle}
          >
            <Feather name={icon} size={24} color="#FFF" />
          </LinearGradient>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmBtn, destructive ? styles.confirmBtnDestructive : styles.confirmBtnPrimary]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: C.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  title: { fontSize: 18, color: C.foreground, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  message: {
    fontSize: 14, color: C.mutedForeground, fontFamily: 'Inter_400Regular',
    textAlign: 'center', lineHeight: 20, marginBottom: 24,
  },
  actions: { flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center',
    backgroundColor: C.secondary, borderWidth: 1, borderColor: C.border,
  },
  cancelText: { fontSize: 15, color: C.foreground, fontFamily: 'Inter_600SemiBold' },
  confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  confirmBtnDestructive: { backgroundColor: C.destructive, shadowColor: C.destructive },
  confirmBtnPrimary: { backgroundColor: C.primary },
  confirmText: { fontSize: 15, color: '#FFFFFF', fontFamily: 'Inter_700Bold' },
});