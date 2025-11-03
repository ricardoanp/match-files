import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuthStore } from '../store/authStore.js';
import { Button } from '../components/Button.js';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, logout, updateConsents } = useAuthStore();
  const [consents, setConsents] = useState({
    marketing: user?.consent.marketing || false,
    sms: user?.consent.sms || false,
    push: user?.consent.push || true,
  });
  const [saving, setSaving] = useState(false);

  const handleConsentChange = async (type: 'marketing' | 'sms' | 'push', value: boolean) => {
    try {
      setSaving(true);
      const newConsents = { ...consents, [type]: value };
      await updateConsents(newConsents.marketing, newConsents.sms, newConsents.push);
      setConsents(newConsents);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao atualizar preferências');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.navigate('Auth');
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Usuário não autenticado</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        {user.phone && <Text style={styles.phone}>{user.phone}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Papéis</Text>
        <View style={styles.roleContainer}>
          {user.roles.map((role) => (
            <View key={role} style={styles.roleTag}>
              <Text style={styles.roleTagText}>{role}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferências de Notificações</Text>

        <View style={styles.consentItem}>
          <View style={styles.consentLabel}>
            <Text style={styles.consentTitle}>Notificações Push</Text>
            <Text style={styles.consentDescription}>Receba alertas na app</Text>
          </View>
          <Switch
            value={consents.push}
            onValueChange={(value) => handleConsentChange('push', value)}
            disabled={saving}
          />
        </View>

        <View style={styles.consentItem}>
          <View style={styles.consentLabel}>
            <Text style={styles.consentTitle}>E-mails</Text>
            <Text style={styles.consentDescription}>Receba e-mails promocionais</Text>
          </View>
          <Switch
            value={consents.marketing}
            onValueChange={(value) => handleConsentChange('marketing', value)}
            disabled={saving}
          />
        </View>

        <View style={styles.consentItem}>
          <View style={styles.consentLabel}>
            <Text style={styles.consentTitle}>SMS</Text>
            <Text style={styles.consentDescription}>Receba mensagens de texto</Text>
          </View>
          <Switch
            value={consents.sms}
            onValueChange={(value) => handleConsentChange('sms', value)}
            disabled={saving}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Button
          label="Sair"
          onPress={handleLogout}
          variant="danger"
          style={styles.logoutButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleTag: {
    backgroundColor: '#E8F4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleTagText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  consentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  consentLabel: {
    flex: 1,
  },
  consentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  consentDescription: {
    fontSize: 12,
    color: '#999',
  },
  logoutButton: {
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});
