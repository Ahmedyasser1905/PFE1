import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { Crown, X, ArrowRight } from 'lucide-react-native';
import { useLanguage } from '~/context/LanguageContext';

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  title?: string;
  description?: string;
}

const { width } = Dimensions.get('window');

export function PremiumModal({
  visible,
  onClose,
  onUpgrade,
  title,
  description,
}: PremiumModalProps) {
  const { t } = useLanguage();
  
  const displayTitle = title || t('premium.limit_reached');
  const displayDescription = description || t('premium.limit_desc');
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.modalContent}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <X size={24} color="#64748b" />
          </Pressable>
          
          <View style={styles.iconContainer}>
            <Crown size={40} color="#eab308" />
          </View>
          
          <Text style={styles.title}>{displayTitle}</Text>
          <Text style={styles.description}>{displayDescription}</Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureRow}>
              <Text style={styles.check}>✓</Text>
              <Text style={styles.featureText}>{t('premium.unlimited_projects')}</Text>
            </View>
            <View style={styles.featureRow}>
              <Text style={styles.check}>✓</Text>
              <Text style={styles.featureText}>{t('premium.advanced_pdf')}</Text>
            </View>
            <View style={styles.featureRow}>
              <Text style={styles.check}>✓</Text>
              <Text style={styles.featureText}>{t('premium.premium_materials')}</Text>
            </View>
          </View>

          <Pressable style={styles.upgradeBtn} onPress={onUpgrade}>
            <Text style={styles.upgradeBtnText}>{t('premium.upgrade_plan')}</Text>
            <ArrowRight size={20} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: '#fff',
    width: width * 0.85,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef08a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  featuresList: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  check: {
    color: '#2563eb',
    fontWeight: '800',
    fontSize: 16,
  },
  featureText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  upgradeBtn: {
    width: '100%',
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  upgradeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
