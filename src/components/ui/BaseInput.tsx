import React, { useState, useCallback } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable, TextInputProps, ViewStyle, TextStyle } from 'react-native';
import { Eye, EyeOff, LucideIcon } from 'lucide-react-native';
import { theme } from '~/constants/theme';
interface BaseInputProps extends TextInputProps {
    label: string;
    icon?: LucideIcon;
    error?: string;
}
export const BaseInput = React.memo<BaseInputProps>(({
    label,
    icon: Icon,
    error,
    style: customStyle,
    onFocus,
    onBlur,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = props.secureTextEntry;
    const inputRef = React.useRef<TextInput>(null);

    const handleFocus = useCallback((e: any) => {
        setIsFocused(true);
        onFocus?.(e);
    }, [onFocus]);

    const handleBlur = useCallback((e: any) => {
        setIsFocused(false);
        onBlur?.(e);
    }, [onBlur]);

    const togglePassword = useCallback(() => {
        setShowPassword(prev => !prev);
    }, []);

    const focusInput = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <Pressable
                onPress={focusInput}
                style={[
                    styles.inputWrapper,
                    isFocused && styles.inputWrapperFocused,
                    error ? styles.inputWrapperError : null,
                ]}
            >
                {Icon && <Icon size={20} color={theme.colors.textSecondary} style={styles.icon} />}
                <TextInput
                    ref={inputRef}
                    style={[styles.input, customStyle]}
                    placeholderTextColor={theme.colors.placeholder}
                    {...props}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    secureTextEntry={isPassword && !showPassword}
                    autoCapitalize={props.autoCapitalize || "none"}
                />
                {isPassword && (
                    <Pressable onPress={togglePassword} style={styles.eyeIcon} hitSlop={8}>
                        {showPassword ? (
                            <EyeOff size={20} color={theme.colors.textSecondary} />
                        ) : (
                            <Eye size={20} color={theme.colors.textSecondary} />
                        )}
                    </Pressable>
                )}
            </Pressable>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
});
const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.lg,
        width: '100%',
    } as ViewStyle,
    label: {
        ...theme.typography.caption,
        fontWeight: '800',
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    } as TextStyle,
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderWidth: 1.5,
        borderColor: theme.colors.divider,
        borderRadius: theme.roundness.lg,
        paddingHorizontal: theme.spacing.lg,
        height: 54,
    } as ViewStyle,
    inputWrapperFocused: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.white,
        ...theme.shadows.xs,
    } as ViewStyle,
    inputWrapperError: {
        borderColor: theme.colors.error,
        backgroundColor: theme.colors.errorLight,
    } as ViewStyle,
    icon: {
        marginRight: theme.spacing.sm,
    } as ViewStyle,
    input: {
        flex: 1,
        color: theme.colors.text,
        ...theme.typography.body,
        height: '100%',
    } as TextStyle,
    eyeIcon: {
        padding: theme.spacing.xs,
    } as ViewStyle,
    errorText: {
        ...theme.typography.caption,
        color: theme.colors.error,
        marginTop: 6,
        marginLeft: 4,
    } as TextStyle,
});


