import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Input } from '../components/Input.js';
import { Button } from '../components/Button.js';
import { useAuthStore } from '../store/authStore.js';

export const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { register, isLoading } = useAuthStore();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.name) newErrors.name = 'Nome é obrigatório';
    if (form.name.length < 2) newErrors.name = 'Nome deve ter pelo menos 2 caracteres';

    if (!form.email) newErrors.email = 'E-mail é obrigatório';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) newErrors.email = 'E-mail inválido';

    if (!form.password) newErrors.password = 'Senha é obrigatória';
    if (form.password.length < 8) newErrors.password = 'Senha deve ter pelo menos 8 caracteres';

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    try {
      await register(form.name, form.email, form.password, form.phone || undefined);
      Alert.alert('Sucesso', 'Conta criada com sucesso!');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao criar conta');
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Criar Conta</Text>
          <Text style={styles.subtitle}>Junte-se a Match!</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Nome"
            placeholder="Seu nome completo"
            value={form.name}
            onChangeText={(value) => handleChange('name', value)}
            error={errors.name}
            required
          />

          <Input
            label="E-mail"
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(value) => handleChange('email', value)}
            error={errors.email}
            required
          />

          <Input
            label="Telefone"
            placeholder="(11) 98765-4321"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(value) => handleChange('phone', value)}
          />

          <Input
            label="Senha"
            placeholder="••••••••"
            secureTextEntry
            value={form.password}
            onChangeText={(value) => handleChange('password', value)}
            error={errors.password}
            required
          />

          <Input
            label="Confirmar Senha"
            placeholder="••••••••"
            secureTextEntry
            value={form.confirmPassword}
            onChangeText={(value) => handleChange('confirmPassword', value)}
            error={errors.confirmPassword}
            required
          />

          <Button
            label="Criar Conta"
            onPress={handleRegister}
            loading={isLoading}
            style={styles.button}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem uma conta? </Text>
            <Button
              label="Entrar"
              onPress={() => navigation.navigate('Login')}
              variant="secondary"
              style={styles.loginLink}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginTop: 20,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    flex: 1,
  },
  button: {
    marginTop: 24,
  },
  footer: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    paddingHorizontal: 0,
  },
});
