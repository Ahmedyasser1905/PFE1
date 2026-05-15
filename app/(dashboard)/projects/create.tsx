import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  ScrollView,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, ArrowLeft } from 'lucide-react-native';
import { theme } from '~/constants/theme';
import { estimationApi } from '~/api/api';
import { BUDGET_OPTIONS } from '~/constants/config';
import { useSubscriptionContext } from '~/context/SubscriptionContext';
import { NativeSelect } from '~/components/ui/NativeSelect';
import { useFeedback } from '~/context/FeedbackContext';
import { useLanguage } from '~/context/LanguageContext';

interface Budget {
  id: string;
  label: string;
  value: number;
}

const PROJECT_TYPES = [
  'Résidentiel',
  'Commercial',
  'Industriel',
  'Infrastructure',
  'Rénovation',
  'Autre',
];

const budgets: Budget[] = [...BUDGET_OPTIONS];

export default function CreateProject() {
  const router = useRouter();
  const { canCreateProject } = useSubscriptionContext();
  const { showSuccess, showError, showWarning, showSubscription } = useFeedback();
  const { t, isRTL } = useLanguage();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(budgets[1]);
  const [loading, setLoading] = useState(false);

  // 📸 IMAGE PICKER
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        showError(t('common.error'), t('projects.gallery_permission_required'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        console.log('[IMAGE PICKER] Image selected:', result.assets[0].uri);
        setImage(result.assets[0].uri);
        setUploadedImageUrl(null);
      }
    } catch (error) {
      console.log('[IMAGE PICKER] Error:', error);
      showError(t('common.error'), t('projects.failed_pick_image'));
    }
  };

  // 🚀 CREATE PROJECT
  const handleCreate = async () => {
    if (!name.trim()) {
      showError(t('projects.missing_field'), t('projects.name_required'));
      return;
    }

    if (!type) {
      showError(t('projects.missing_field'), t('projects.select_type'));
      return;
    }

    if (!canCreateProject) {
      showSubscription(t('premium.limit_desc'), () => {
        router.push('/(dashboard)/settings/subscription');
      });
      return;
    }

    setLoading(true);

    try {
      const combinedDescription = [
        `Type: ${type}`,
        location ? `Location: ${location}` : '',
        description ? `\n---\n${description}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const budgetType = selectedBudget?.id || 'MEDIUM';

      console.log('[CREATE PROJECT] Sending payload');

      let response;

      const isLocalImage = image && (image.startsWith('file://') || image.startsWith('content://') || image.startsWith('ph://') || !image.startsWith('http'));

      if (isLocalImage && !uploadedImageUrl?.startsWith('http')) {
        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('description', combinedDescription);
        formData.append('budget_type', budgetType);

        const uri = image as string;
        const filename = uri.split('/').pop() || `project-${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const mimeType = match ? `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}` : 'image/jpeg';

        formData.append('image', {
          uri: uri,
          name: filename,
          type: mimeType,
        } as any);

        response = await estimationApi.createProject(formData);
      } else {
        const payload: any = {
          name: name.trim(),
          description: combinedDescription,
          budget_type: budgetType,
        };

        if (uploadedImageUrl?.startsWith('http')) {
          payload.image_url = uploadedImageUrl;
        }

        response = await estimationApi.createProject(payload);
      }

      showSuccess(t('projects.created_title'), t('projects.created_msg'));
      router.replace('/(dashboard)/projects');

    } catch (error: any) {
      console.log('[CREATE PROJECT] Error:', error);
      // Errors are already handled globally by the API interceptor, 
      // but we can add specific handling here if needed.
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>

      <Pressable
        style={styles.imagePicker}
        onPress={pickImage}
        disabled={loading}
      >
        {image ? (
          <>
            <Image
              source={{ uri: image }}
              style={styles.image}
              onError={(e) => {
                console.error('[Image] Render Error:', e.nativeEvent.error);
                setImage(null);
              }}
            />
            {uploadedImageUrl && (
              <View style={styles.uploadedBadge}>
                <Text style={styles.uploadedBadgeText}>✓ {t('projects.ready')}</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.placeholder}>
            <Camera size={32} color={theme.colors.textMuted} />
            <Text style={styles.placeholderText}>{t('projects.add_image')}</Text>
          </View>
        )}
      </Pressable>

      <View style={styles.form}>
        <TextInput
          style={[styles.input, isRTL && styles.rtlInput]}
          placeholder={t('projects.project_name')}
          placeholderTextColor={theme.colors.textMuted}
          value={name}
          onChangeText={setName}
          editable={!loading}
        />

        <NativeSelect
          label={t('projects.type')}
          value={type}
          options={PROJECT_TYPES}
          keyExtractor={(i) => i}
          labelExtractor={(i) => t(`projects.type_${i.toLowerCase()}`, { defaultValue: i })}
          onSelect={setType}
        />

        <TextInput
          style={[styles.input, isRTL && styles.rtlInput]}
          placeholder={t('projects.location')}
          placeholderTextColor={theme.colors.textMuted}
          value={location}
          onChangeText={setLocation}
          editable={!loading}
        />

        <NativeSelect
          label={t('projects.budget')}
          value={selectedBudget}
          options={budgets}
          keyExtractor={(i) => i.id}
          labelExtractor={(i) => t(`projects.budget_${i.id.toLowerCase()}`, { defaultValue: i.label })}
          onSelect={setSelectedBudget}
        />

        <TextInput
          style={[styles.descriptionInput, isRTL && styles.rtlInput]}
          placeholder={t('projects.description')}
          placeholderTextColor={theme.colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          editable={!loading}
        />

        <Pressable
          style={[styles.button, (loading) && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.btnText}>{t('home.create')}</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  } as ViewStyle,
  scrollContent: {
    paddingBottom: 40,
  } as ViewStyle,
  imagePicker: {
    height: 200,
    margin: theme.spacing.lg,
    borderRadius: theme.roundness.xl,
    borderWidth: 2,
    borderColor: theme.colors.surfaceSecondary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  } as ViewStyle,
  image: {
    width: '100%',
    height: '100%',
  } as any, // Image style
  uploadedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: theme.colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.roundness.full,
    ...theme.shadows.sm,
  } as ViewStyle,
  uploadedBadgeText: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: 12,
  } as TextStyle,
  placeholder: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  } as ViewStyle,
  placeholderText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textMuted,
  } as TextStyle,
  form: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  } as ViewStyle,
  input: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    ...theme.typography.body,
    textAlign: 'left',
  } as TextStyle,
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    borderRadius: theme.roundness.xl,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadows.md,
  } as ViewStyle,
  buttonDisabled: {
    opacity: 0.6,
  } as ViewStyle,
  btnText: {
    color: theme.colors.white,
    ...theme.typography.h4,
    fontWeight: '700',
  } as TextStyle,
  descriptionInput: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    ...theme.typography.body,
    height: 100, 
    textAlignVertical: 'top',
    textAlign: 'left',
  } as TextStyle,
  rtlInput: {
    textAlign: 'right',
  } as TextStyle,
});