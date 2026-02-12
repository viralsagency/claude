import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '../theme';
import { saveProfile, getProfile } from '../storage/MeasurementStorage';
import type { UserProfile } from '../types';

export function ProfileScreen() {
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const profile = await getProfile();
    if (profile) {
      setHeight(profile.height.toString());
      setAge(profile.age.toString());
      setGender(profile.gender);
    }
  }

  async function handleSave() {
    const h = parseInt(height, 10);
    const a = parseInt(age, 10);

    if (!h || h < 50 || h > 250) {
      Alert.alert('Errore', 'Inserisci un\'altezza valida (50-250 cm)');
      return;
    }
    if (!a || a < 1 || a > 150) {
      Alert.alert('Errore', 'Inserisci un\'età valida');
      return;
    }

    const profile: UserProfile = { height: h, age: a, gender };
    await saveProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profilo</Text>
      <Text style={styles.subtitle}>
        I dati del profilo vengono utilizzati per calcoli più accurati di BMI e
        composizione corporea.
      </Text>

      <View style={styles.field}>
        <Text style={styles.label}>Altezza (cm)</Text>
        <TextInput
          style={styles.input}
          value={height}
          onChangeText={setHeight}
          keyboardType="numeric"
          placeholder="175"
          placeholderTextColor={colors.textLight}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Età</Text>
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
          placeholder="30"
          placeholderTextColor={colors.textLight}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Sesso</Text>
        <View style={styles.genderRow}>
          <TouchableOpacity
            style={[
              styles.genderButton,
              gender === 'male' && styles.genderActive,
            ]}
            onPress={() => setGender('male')}
          >
            <Text
              style={[
                styles.genderText,
                gender === 'male' && styles.genderTextActive,
              ]}
            >
              Maschio
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.genderButton,
              gender === 'female' && styles.genderActive,
            ]}
            onPress={() => setGender('female')}
          >
            <Text
              style={[
                styles.genderText,
                gender === 'female' && styles.genderTextActive,
              ]}
            >
              Femmina
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saved && styles.saveButtonSuccess]}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>
          {saved ? 'Salvato!' : 'Salva Profilo'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  genderButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  genderActive: {
    borderColor: colors.primary,
    backgroundColor: '#EBF4FD',
  },
  genderText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  genderTextActive: {
    color: colors.primary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveButtonSuccess: {
    backgroundColor: colors.secondary,
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
});
