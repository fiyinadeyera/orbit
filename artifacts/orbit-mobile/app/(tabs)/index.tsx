import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  AudioQuality,
  IOSOutputFormat,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useToast } from '@/components/Toast';
import { EmptyState } from '@/components/EmptyState';
import { PersonListItem } from '@/components/PersonListItem';
import { Skeleton } from '@/components/Skeleton';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { transcribeRecording } from '@/lib/transcribe';
import {
  getListPeopleQueryKey,
  getListReconnectsQueryKey,
  useConfirmCapture,
  useExtractCapture,
  useListPeople,
  useListReconnects,
} from '@workspace/api-client-react';

// Record 16kHz mono WAV. The API's /transcribe detects format by magic bytes
// and passes WAV straight through to OpenAI (no server-side ffmpeg transcode),
// so recording WAV on device keeps voice capture dependency-free. 16kHz mono is
// plenty for speech and keeps files small enough for the 25mb upload limit.
const WAV_RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  extension: '.wav',
  sampleRate: 16000,
  numberOfChannels: 1,
  ios: {
    ...RecordingPresets.HIGH_QUALITY.ios,
    outputFormat: IOSOutputFormat.LINEARPCM,
    audioQuality: AudioQuality.HIGH,
  },
};

// Safety cap so a forgotten recording can't run forever (and stays well under
// the 25mb transcribe upload limit). It auto-stops and transcribes at this mark.
const MAX_RECORDING_MS = 120000;

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function JournalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [note, setNote] = useState('');

  const reconnectsQuery = useListReconnects();
  const peopleQuery = useListPeople();
  // Capture is a two-step API: extract runs the note through Claude, then
  // confirm persists the (here, unedited) fields. The screen keeps a single
  // one-tap flow by chaining them, so the UX is unchanged from the user's side.
  const extractCapture = useExtractCapture();
  const confirmCapture = useConfirmCapture();
  const isCapturing = extractCapture.isPending || confirmCapture.isPending;

  // Voice capture: record on device, transcribe via the API, then drop the
  // text into the same note field so it flows through the existing extract →
  // confirm pipeline. The user can still edit the transcript before saving.
  const audioRecorder = useAudioRecorder(WAV_RECORDING_OPTIONS);
  // Poll a few times a second so the on-screen timer ticks and the auto-stop
  // safety cap fires promptly while recording.
  const recorderState = useAudioRecorderState(audioRecorder, 250);
  const isRecording = recorderState.isRecording;
  const [isTranscribing, setIsTranscribing] = useState(false);
  // Capture is voice-first: 'voice' shows the big record button, 'text' shows
  // the editable note field. A finished transcription flips us to 'text' so the
  // user can review before saving; "Type instead" flips there manually.
  const [mode, setMode] = useState<'voice' | 'text'>('voice');

  const invalidateAfterCapture = () => {
    queryClient.invalidateQueries({ queryKey: getListPeopleQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListReconnectsQueryKey() });
  };

  const failCapture = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    showToast("Couldn't save that note. Try again.", 'error');
  };

  const startRecording = async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        showToast('Microphone access is off. Enable it in Settings.', 'error');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast("Couldn't start recording. Try again.", 'error');
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      await setAudioModeAsync({ allowsRecording: false });
      if (!uri) return;

      setIsTranscribing(true);
      const text = await transcribeRecording(uri);
      // Append to whatever is already typed so voice and text can be combined.
      setNote((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text));
      // Surface the transcript for a quick review/edit before saving.
      setMode('text');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(
        error instanceof Error ? error.message : 'Could not transcribe that.',
        'error',
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleMicPress = () => {
    if (isCapturing || isTranscribing) return;
    if (isRecording) {
      void stopRecording();
    } else {
      void startRecording();
    }
  };

  // Auto-stop (and transcribe) once the recording hits the safety cap.
  useEffect(() => {
    if (isRecording && recorderState.durationMillis >= MAX_RECORDING_MS) {
      void stopRecording();
    }
    // stopRecording is stable enough for this guard; re-running on duration is
    // what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, recorderState.durationMillis]);

  const handleCapture = () => {
    const trimmed = note.trim();
    if (!trimmed || isCapturing) return;

    extractCapture.mutate(
      { data: { note: trimmed } },
      {
        onSuccess: ({ extracted, rawNote }) => {
          confirmCapture.mutate(
            {
              data: {
                name: extracted.name,
                company: extracted.company ?? undefined,
                role: extracted.role ?? undefined,
                location: extracted.location ?? undefined,
                context: extracted.context ?? undefined,
                interests: extracted.interests,
                connectedTo: extracted.connectedTo,
                status: extracted.status ?? undefined,
                date: extracted.date,
                rawNote,
              },
            },
            {
              onSuccess: (result) => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setNote('');
                setMode('voice');
                invalidateAfterCapture();
                showToast(
                  result.created
                    ? `Added ${result.person.name} to your network`
                    : `Logged an update for ${result.person.name}`,
                );
              },
              onError: failCapture,
            },
          );
        },
        onError: failCapture,
      },
    );
  };

  const refreshing = reconnectsQuery.isRefetching || peopleQuery.isRefetching;
  const onRefresh = () => {
    reconnectsQuery.refetch();
    peopleQuery.refetch();
  };

  const recentPeople = (peopleQuery.data ?? []).slice(0, 4);
  const reconnects = (reconnectsQuery.data ?? []).slice(0, 4);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.wordmark, { color: colors.foreground }]}>Orbit</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Your Network Universe
          </Text>
        </View>

        {mode === 'voice' ? (
          <View style={styles.voiceHero}>
            <Text style={[styles.voicePrompt, { color: colors.foreground }]}>
              {isRecording
                ? formatDuration(recorderState.durationMillis)
                : isTranscribing
                  ? 'One sec...'
                  : 'What happened?'}
            </Text>
            <Text style={[styles.voiceSubtitle, { color: colors.mutedForeground }]}>
              {isRecording
                ? 'Tap the button when you are done.'
                : isTranscribing
                  ? 'Turning your voice into a note.'
                  : 'Tap to record who you met and what you talked about.'}
            </Text>

            <Pressable
              onPress={handleMicPress}
              disabled={isCapturing || isTranscribing}
              accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
              style={({ pressed }) => [
                styles.micHero,
                {
                  backgroundColor: isRecording ? colors.destructive : colors.primary,
                  opacity: isCapturing || isTranscribing ? 0.6 : pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                },
              ]}
            >
              {isTranscribing ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Feather
                  name={isRecording ? 'square' : 'mic'}
                  size={40}
                  color={colors.primaryForeground}
                />
              )}
            </Pressable>

            <Pressable
              onPress={() => setMode('text')}
              disabled={isRecording || isTranscribing}
              hitSlop={8}
              style={styles.typeInstead}
            >
              <Feather name="edit-3" size={13} color={colors.mutedForeground} />
              <Text style={[styles.typeInsteadText, { color: colors.mutedForeground }]}>
                Type instead
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.composerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.composerHeaderRow}>
              <Text style={[styles.composerLabel, { color: colors.mutedForeground }]}>
                Review and save
              </Text>
              <Pressable
                onPress={() => setMode('voice')}
                disabled={isCapturing}
                hitSlop={8}
                style={styles.recordInstead}
              >
                <Feather name="mic" size={12} color={colors.primary} />
                <Text style={[styles.recordInsteadText, { color: colors.primary }]}>
                  Record instead
                </Text>
              </Pressable>
            </View>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Ran into Maya at the conference, she just started a new role at..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              autoFocus
              textAlignVertical="top"
              style={[styles.composerInput, { color: colors.foreground }]}
            />
            <Pressable
              onPress={handleCapture}
              disabled={!note.trim() || isCapturing}
              style={({ pressed }) => [
                styles.captureButton,
                {
                  backgroundColor: colors.primary,
                  opacity: !note.trim() || isCapturing ? 0.5 : pressed ? 0.85 : 1,
                },
              ]}
            >
              {isCapturing ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <>
                  <Feather name="send" size={15} color={colors.primaryForeground} />
                  <Text style={[styles.captureButtonText, { color: colors.primaryForeground }]}>
                    Save note
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Time to reconnect</Text>
          {reconnectsQuery.isLoading ? (
            <View style={{ gap: 10 }}>
              <Skeleton style={{ height: 74 }} />
              <Skeleton style={{ height: 74 }} />
            </View>
          ) : reconnects.length === 0 ? (
            <EmptyState
              icon="check-circle"
              title="You're all caught up"
              description="No one is overdue for a reconnect right now."
            />
          ) : (
            <View style={{ gap: 10 }}>
              {reconnects.map((prompt) => (
                <PersonListItem
                  key={prompt.person.id}
                  person={prompt.person}
                  subtitle={
                    prompt.lastInteraction ?? `${prompt.daysSinceContact} days since last contact`
                  }
                  trailingLabel={`${prompt.daysSinceContact}d`}
                  trailingSublabel="since contact"
                  showTags={false}
                  onPress={() => router.push(`/person/${prompt.person.id}`)}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Recent connections
            </Text>
            <Pressable onPress={() => router.push('/people')} hitSlop={8}>
              <Text style={[styles.viewAll, { color: colors.primary }]}>View all</Text>
            </Pressable>
          </View>
          {peopleQuery.isLoading ? (
            <View style={{ gap: 10 }}>
              <Skeleton style={{ height: 74 }} />
              <Skeleton style={{ height: 74 }} />
            </View>
          ) : recentPeople.length === 0 ? (
            <EmptyState
              icon="users"
              title="No connections yet"
              description="Capture a note above to start building your network."
            />
          ) : (
            <View style={{ gap: 10 }}>
              {recentPeople.map((person) => (
                <PersonListItem
                  key={person.id}
                  person={person}
                  onPress={() => router.push(`/person/${person.id}`)}
                />
              ))}
            </View>
          )}
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    gap: 26,
  },
  header: {
    gap: 3,
  },
  wordmark: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 34,
    letterSpacing: -0.8,
  },
  tagline: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    letterSpacing: 0.1,
  },
  voiceHero: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  voicePrompt: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
  },
  voiceSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 260,
  },
  micHero: {
    marginTop: 20,
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  typeInstead: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeInsteadText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  composerCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  composerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  composerLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12.5,
  },
  recordInstead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  recordInsteadText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12.5,
  },
  composerInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    minHeight: 76,
    lineHeight: 21,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
  },
  captureButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  section: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 19,
  },
  viewAll: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
});
