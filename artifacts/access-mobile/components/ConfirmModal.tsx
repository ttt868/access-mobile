import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
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
          <View style={[styles.iconCircle, destructive && styles.iconCircleDestructive]}>
            <Feather name={icon} size={22} color={destructive ? C.destructive : C.primary} />
          </View>
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
    backgroundColor: 'rgba(2,6,14,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 22,
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconCircleDestructive: { backgroundColor: C.destructive + '1A' },
  title: { fontSize: 17, color: C.foreground, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  message: {
    fontSize: 13, color: C.mutedForeground, fontFamily: 'Inter_400Regular',
    textAlign: 'center', lineHeight: 19, marginBottom: 20,
  },
  actions: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: C.secondary, borderWidth: 1, borderColor: C.border,
  },
  cancelText: { fontSize: 14, color: C.foreground, fontFamily: 'Inter_600SemiBold' },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  confirmBtnDestructive: { backgroundColor: C.destructive },
  confirmBtnPrimary: { backgroundColor: C.primary },
  confirmText: { fontSize: 14, color: '#080C14', fontFamily: 'Inter_700Bold' },
});
