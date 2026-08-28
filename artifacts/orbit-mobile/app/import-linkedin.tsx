import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { EmptyState } from '@/components/EmptyState';
import { ContactImportReview } from '@/components/ContactImportReview';
import { parseLinkedInConnections } from '@/lib/linkedinCsv';
import type { ImportCandidate } from '@/lib/importCandidates';

const EXPORT_URL = 'https://www.linkedin.com/mypreferences/d/download-my-data';

type Stage = 'intro' | 'parsing' | 'error' | 'review';

export default function ImportLinkedInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [stage, setStage] = useState<Stage>('intro');
  const [candidates, setCandidates] = useState<ImportCandidate[]>([]);

  const pickFile = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'application/csv', 'text/plain'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    const uri = result.assets?.[0]?.uri;
    if (!uri) {
      setStage('error');
      return;
    }

    setStage('parsing');
    try {
      const text = await FileSystem.readAsStringAsync(uri);
      setCandidates(parseLinkedInConnections(text));
      setStage('review');
    } catch {
      setStage('error');
    }
  }, []);

  const header = (title: string) => (
    <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
      <Pressable onPress={() => router.back()} hitSlop={8} style={styles.close}>
        <Feather name="x" size={22} color={colors.foreground} />
      </Pressable>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
    </View>
  );

  if (stage === 'review') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        {header('Choose who to add')}
        <ContactImportReview candidates={candidates} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {header('Import from LinkedIn')}
      <View style={styles.body}>
        {stage === 'parsing' ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.para, { color: colors.mutedForeground, marginTop: 16 }]}>
              Reading your connections...
            </Text>
          </View>
        ) : stage === 'error' ? (
          <View style={styles.centered}>
            <EmptyState
              icon="alert-circle"
              title="Couldn't read that file"
              description="Make sure it's the Connections.csv file from your LinkedIn data export, then try again."
            />
          </View>
        ) : (
          <>
            <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
              <Feather name="linkedin" size={26} color={colors.primary} />
            </View>
            <Text style={[styles.introTitle, { color: colors.foreground }]}>
              Import your LinkedIn connections
            </Text>
            <Text style={[styles.para, { color: colors.mutedForeground }]}>
              LinkedIn has no direct connection, so this uses the export file LinkedIn gives you:
            </Text>

            <View style={styles.steps}>
              {[
                'On LinkedIn, open Settings, Data Privacy, then "Get a copy of your data".',
                'Choose Connections, request the archive, and download the file.',
                'Come back here and pick that Connections.csv file.',
              ].map((step, i) => (
                <View key={i} style={styles.step}>
                  <Text style={[styles.stepNum, { color: colors.primary }]}>{i + 1}</Text>
                  <Text style={[styles.stepText, { color: colors.foreground }]}>{step}</Text>
                </View>
              ))}
            </View>

            <Pressable onPress={() => Linking.openURL(EXPORT_URL)} hitSlop={8}>
              <Text style={[styles.link, { color: colors.primary }]}>Open LinkedIn data export</Text>
            </Pressable>

            <Pressable
              onPress={pickFile}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
                Choose CSV file
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  close: { padding: 4 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  body: { flex: 1, padding: 24 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  introTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, textAlign: 'center' },
  para: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 6 },
  steps: { gap: 12, marginTop: 24 },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNum: { fontFamily: 'Inter_700Bold', fontSize: 15, width: 16 },
  stepText: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, flex: 1 },
  link: { fontFamily: 'Inter_600SemiBold', fontSize: 14, textAlign: 'center', marginTop: 20 },
  primaryButton: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 20,
    alignSelf: 'stretch',
  },
  primaryButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});
