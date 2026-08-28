import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { EmptyState } from '@/components/EmptyState';
import { ContactImportReview } from '@/components/ContactImportReview';
import {
  GOOGLE_CONTACTS_SCOPE,
  fetchGoogleContacts,
  googleClientIds,
  hasGoogleClientId,
} from '@/lib/googleContacts';
import type { ImportCandidate } from '@/lib/importCandidates';

// Required for the OAuth redirect to close the in-app browser and return here.
WebBrowser.maybeCompleteAuthSession();

type Stage = 'intro' | 'authorizing' | 'loading' | 'error' | 'review';

export default function ImportGoogleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [stage, setStage] = useState<Stage>('intro');
  const [candidates, setCandidates] = useState<ImportCandidate[]>([]);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: googleClientIds.iosClientId,
    androidClientId: googleClientIds.androidClientId,
    webClientId: googleClientIds.webClientId,
    scopes: [GOOGLE_CONTACTS_SCOPE],
  });

  // When the OAuth flow returns, use the access token to pull contacts.
  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const token = response.authentication?.accessToken;
      if (!token) {
        setStage('error');
        return;
      }
      setStage('loading');
      fetchGoogleContacts(token)
        .then((fetched) => {
          setCandidates(fetched);
          setStage('review');
        })
        .catch(() => setStage('error'));
    } else if (response.type === 'error') {
      setStage('error');
    } else if (response.type === 'dismiss' || response.type === 'cancel') {
      setStage('intro');
    }
  }, [response]);

  const connect = useCallback(() => {
    setStage('authorizing');
    promptAsync().catch(() => setStage('error'));
  }, [promptAsync]);

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
      {header('Import from Google')}
      <View style={styles.centered}>
        {stage === 'authorizing' || stage === 'loading' ? (
          <>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.body, { color: colors.mutedForeground, marginTop: 16 }]}>
              {stage === 'loading' ? 'Fetching your Google contacts...' : 'Waiting for Google...'}
            </Text>
          </>
        ) : stage === 'error' ? (
          <EmptyState
            icon="alert-circle"
            title="Couldn't connect to Google"
            description="Something went wrong reaching Google contacts. Please try again."
          />
        ) : !hasGoogleClientId() ? (
          <EmptyState
            icon="settings"
            title="Google sign-in isn't configured yet"
            description="Add the Google OAuth client IDs (see GOOGLE_SETUP.md) to enable this."
          />
        ) : (
          <>
            <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
              <Feather name="mail" size={26} color={colors.primary} />
            </View>
            <Text style={[styles.introTitle, { color: colors.foreground }]}>
              Bring your Google contacts to Orbit
            </Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>
              Sign in with Google to let Orbit read your contacts. You choose who to add, and Orbit
              never keeps your Google password.
            </Text>
            <Pressable
              onPress={connect}
              disabled={!request}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: colors.primary,
                  opacity: !request ? 0.5 : pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
                Continue with Google
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 6 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  introTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, textAlign: 'center' },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center', lineHeight: 20 },
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
