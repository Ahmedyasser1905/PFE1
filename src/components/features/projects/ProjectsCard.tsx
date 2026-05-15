import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable
} from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle, Building2, Calendar } from 'lucide-react-native';
import type { Project } from '~/api/types';
import { theme } from '~/constants/theme';
import { resolveImageUrl, FALLBACK_IMAGE } from '~/utils/imageResolver';
import { useLanguage } from '~/context/LanguageContext';

interface CardProps {
  project: Project;
}

export const ProjectCard: React.FC<CardProps> = ({ project }) => {
  const router = useRouter();
  const { t } = useLanguage();
  const [imageError, setImageError] = useState(false);
  const isActive = project.status === 'active';

  // resolveImageUrl now always returns a valid URL (absolute or FALLBACK_IMAGE)
  const finalUri = resolveImageUrl(project.imageUrl);
  
  if (__DEV__) {
    console.log(`[ProjectCard] "${project.name}" | imageUrl=${project.imageUrl} | resolved=${finalUri}`);
  }

  const clientName = t('common.apex_client') || 'Apex Client';
  const displayDate = new Date(project.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/projects/${project.projectId}`)}
    >
      {/* IMAGE */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: imageError ? FALLBACK_IMAGE : finalUri }} 
          style={styles.image} 
          resizeMode="cover"
          onError={() => {
            if (__DEV__) console.log("[ProjectCard] IMAGE LOAD ERROR:", finalUri);
            setImageError(true);
          }}
        />

        {/* STATUS BADGE */}
        <View
          style={[
            styles.badge,
            { backgroundColor: isActive ? theme.colors.primary : theme.colors.success }
          ]}
        >
          {isActive ? (
            <>
              <View style={styles.dot} />
              <Text style={styles.badgeText}>{t('projects.status_active').toUpperCase()}</Text>
            </>
          ) : (
            <>
              <CheckCircle size={12} color="#fff" />
              <Text style={styles.badgeText}>{t('projects.status_completed').toUpperCase()}</Text>
            </>
          )}
        </View>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{project.name}</Text>
          <View style={styles.idBadge}>
            <Text style={styles.uuid}>{project.projectId.slice(0, 8)}</Text>
          </View>
        </View>

        {/* DESCRIPTION */}
        <Text style={styles.description} numberOfLines={2}>
          {project.description || t('common.no_description')}
        </Text>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.row}>
            <Building2 size={13} color={theme.colors.textMuted} />
            <Text style={styles.footerText}>{clientName}</Text>
          </View>

          <View style={styles.row}>
            <Calendar size={13} color={theme.colors.textMuted} />
            <Text style={styles.footerText}>{displayDate}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.roundness.xl,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  imageContainer: {
    height: 160,
    position: 'relative',
    backgroundColor: theme.colors.surfaceSecondary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.roundness.full,
    gap: 5,
    ...theme.shadows.xs,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dot: {
    width: 6,
    height: 6,
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.typography.h4,
    color: theme.colors.text,
    flex: 1,
  },
  idBadge: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  uuid: {
    ...theme.typography.caption,
    fontSize: 10,
    color: theme.colors.textMuted,
    fontWeight: '700',
  },
  description: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingTop: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
});
