import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Lock, ShieldCheck, Mail } from 'lucide-react-native';
import { theme } from '~/constants/theme';
import { BaseButton } from '~/components/ui/BaseButton';
import { useAuth } from '~/context/AuthContext';
import { authApi } from '~/api/authApi';

export default function ChangePassword() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSendResetEmail = async () => {
        if (!user?.email) {
            Alert.alert('Error', 'No email found for your account. Please log in again.');
            return;
        }

        setLoading(true);
        try {
            await authApi.forgotPassword(user.email);
            setEmailSent(true);
            Alert.alert(
                'Email Sent',
                'A password reset link has been sent to your email. Please check your inbox and follow the instructions.',
            );
        } catch (error: any) {
            const msg = error?.message || error?.data?.error?.message || 'Failed to send reset email';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backBtnAction}
                    activeOpacity={0.7}
                >
                    <View style={styles.backBtnIconBox}>
                        <ArrowLeft size={24} color={theme.colors.text} />
                    </View>
                </TouchableOpacity>
                <Text style={styles.titleText}>Security</Text>
                <View style={{ width: 80 }} />
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.iconHeader}>
                    <View style={styles.iconCircle}>
                        <ShieldCheck size={32} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.infoTitle}>Change Password</Text>
                    <Text style={styles.infoSubtitle}>
                        For your security, password changes are verified via email.
                        We'll send a reset link to your registered email address.
                    </Text>
                </View>

                {user?.email && (
                    <View style={styles.emailBox}>
                        <Mail size={18} color={theme.colors.textSecondary} />
                        <Text style={styles.emailText}>{user.email}</Text>
                    </View>
                )}

                {emailSent ? (
                    <View style={styles.successBox}>
                        <Text style={styles.successTitle}>✓ Email Sent</Text>
                        <Text style={styles.successText}>
                            Check your inbox for the password reset link.
                            The link expires in 15 minutes.
                        </Text>
                        <BaseButton
                            title="Send Again"
                            onPress={handleSendResetEmail}
                            style={[styles.btn, { opacity: loading ? 0.7 : 1 }] as any}
                            disabled={loading}
                        />
                    </View>
                ) : (
                    <BaseButton
                        title={loading ? "Sending..." : "Send Reset Link"}
                        onPress={handleSendResetEmail}
                        style={[styles.btn, loading && { opacity: 0.7 }] as any}
                        disabled={loading}
                    />
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    backBtnAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.border + '50',
    },
    backBtnIconBox: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleText: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.text,
        flex: 1,
        textAlign: 'center',
        marginRight: -20,
    },
    content: { padding: theme.spacing.xl },
    iconHeader: { alignItems: 'center', marginBottom: 32 },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoTitle: { fontSize: 22, fontWeight: '800', color: theme.colors.text },
    infoSubtitle: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 22 },
    emailBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 24,
    },
    emailText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text,
    },
    successBox: {
        backgroundColor: '#f0fdf4',
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#bbf7d0',
        alignItems: 'center',
        gap: 8,
    },
    successTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#16a34a',
    },
    successText: {
        fontSize: 14,
        color: '#15803d',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 8,
    },
    btn: { marginTop: 24 },
});
