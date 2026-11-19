import React, { useState, useRef, useEffect } from 'react';
import { View, FlatList, TextInput, Pressable,
  Text, StyleSheet, KeyboardAvoidingView, Platform,
  Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChat } from '../hooks/useChat';
import { useSpeech } from '../hooks/useSpeech';
import { MessageBubble } from '../components/MessageBubble';
import { AIProvider, AI_PROVIDERS } from '../../domain/entities/AIProvider';

// Identidad visual de cada proveedor (solo presentación)
const PROVIDER_THEME: Record<AIProvider, { color: string; soft: string; icon: string }> = {
  gemini:     { color: '#6366F1', soft: '#EEF2FF', icon: '✦' },
  openrouter: { color: '#0EA5E9', soft: '#E0F2FE', icon: '⇄' },
  groq:       { color: '#F97316', soft: '#FFF7ED', icon: '⚡' },
};

const SUGGESTIONS = [
  '💡 Explícame la Clean Architecture',
  '✍️ Escribe un poema corto',
  '🧠 Dame un dato curioso',
  '🍳 Una receta rápida para cenar',
];

// Tres puntos que rebotan mientras la IA escribe
const TypingDots: React.FC<{ color: string }> = ({ color }) => {
  const dots = useState(() => [0, 1, 2].map(() => new Animated.Value(0)))[0];

  useEffect(() => {
    const anims = dots.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(v, { toValue: 1, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 300, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.delay((2 - i) * 150),
        ]),
      ),
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, [dots]);

  return (
    <View style={styles.dotsRow}>
      {dots.map((v, i) => (
        <Animated.View
          key={i}
          style={[styles.dot, {
            backgroundColor: color,
            opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
            transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }],
          }]}
        />
      ))}
    </View>
  );
};

export const ChatScreen: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [provider, setProvider] = useState<AIProvider>('gemini');
  const providerName = AI_PROVIDERS.find(p => p.id === provider)!.name;
  const theme = PROVIDER_THEME[provider];
  const flatListRef = useRef<FlatList>(null);
  const { messages, isLoading, error, sendMessage, clearChat } = useChat(provider);
  const { speak, stop, isSpeaking } = useSpeech();

  const sendScale = useState(() => new Animated.Value(1))[0];
  const pulse = useState(() => new Animated.Value(0))[0];

  // Cuando llega una nueva respuesta de la IA, la leemos en voz alta
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (voiceEnabled && last?.role === 'assistant') {
      speak(last.content);
    }
  }, [messages]);

  // Pulso del indicador de estado mientras escribe o habla
  useEffect(() => {
    if (isLoading || isSpeaking) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    pulse.setValue(0);
  }, [isLoading, isSpeaking, pulse]);

  const toggleVoice = () => {
    if (voiceEnabled) stop();
    setVoiceEnabled(!voiceEnabled);
  };

  const handleClear = () => {
    stop();
    clearChat();
  };

  const submit = async (raw: string) => {
    if (!raw.trim() || isLoading) return;
    setInputText('');
    setPendingText(raw);
    await sendMessage(raw);
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const handleSend = () => submit(inputText);

  const pressIn = () =>
    Animated.spring(sendScale, { toValue: 0.85, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () =>
    Animated.spring(sendScale, { toValue: 1, useNativeDriver: true, friction: 3 }).start();

  const canSend = !!inputText.trim() && !isLoading;
  const statusText = isLoading ? 'Escribiendo…' : isSpeaking ? 'Hablando…' : 'En línea';
  const statusColor = isLoading ? theme.color : isSpeaking ? '#8B5CF6' : '#22C55E';
  // Burbuja "optimista" del usuario: solo visible mientras se espera la respuesta
  const shownPending = isLoading ? pendingText : null;
  const isEmpty = messages.length === 0 && !shownPending;

  const handleSuggestion = (s: string) => submit(s.replace(/^\S+\s/, ''));

  const emptyState = (
    <View style={styles.emptyWrap}>
      <View style={[styles.emptyAvatar, { backgroundColor: theme.soft }]}>
        <Text style={[styles.emptyAvatarIcon, { color: theme.color }]}>{theme.icon}</Text>
      </View>
      <Text style={styles.emptyTitle}>¡Hola! Soy {providerName}</Text>
      <Text style={styles.emptySubtitle}>
        Pregúntame lo que quieras. Elige una idea para empezar:
      </Text>
      <View style={styles.suggestions}>
        {SUGGESTIONS.map(s => (
          <Pressable
            key={s}
            onPress={() => handleSuggestion(s)}
            style={({ pressed }) => [
              styles.suggestionChip,
              { borderColor: pressed ? theme.color : '#E2E8F0' },
              pressed && { backgroundColor: theme.soft, transform: [{ scale: 0.97 }] },
            ]}
          >
            <Text style={styles.suggestionText}>{s}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      {/* Encabezado */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatar, { backgroundColor: theme.color }]}>
            <Text style={styles.avatarIcon}>{theme.icon}</Text>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          </View>
          <View>
            <Text style={styles.headerTitle}>{providerName}</Text>
            <View style={styles.statusRow}>
              <Animated.View
                style={[styles.statusPulse, {
                  backgroundColor: statusColor,
                  opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }),
                }]}
              />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={toggleVoice}
            hitSlop={6}
            style={({ pressed }) => [
              styles.iconBtn,
              voiceEnabled && { backgroundColor: theme.soft },
              pressed && styles.iconBtnPressed,
            ]}
            accessibilityLabel={voiceEnabled ? 'Desactivar voz' : 'Activar voz'}
          >
            <Text style={styles.iconBtnText}>{voiceEnabled ? '🔊' : '🔇'}</Text>
          </Pressable>
          <Pressable
            onPress={handleClear}
            hitSlop={6}
            disabled={messages.length === 0}
            style={({ pressed }) => [
              styles.iconBtn,
              messages.length === 0 && styles.iconBtnDisabled,
              pressed && styles.iconBtnPressed,
            ]}
            accessibilityLabel='Limpiar conversación'
          >
            <Text style={styles.iconBtnText}>🗑️</Text>
          </Pressable>
        </View>
      </View>

      {/* Selector de proveedor */}
      <View style={styles.providerBar}>
        <View style={styles.segment}>
          {AI_PROVIDERS.map(p => {
            const active = provider === p.id;
            const t = PROVIDER_THEME[p.id];
            return (
              <Pressable
                key={p.id}
                onPress={() => setProvider(p.id)}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.segmentBtn,
                  active && [styles.segmentBtnActive, { shadowColor: t.color }],
                  pressed && !active && { opacity: 0.6 },
                ]}
              >
                <Text style={[styles.segmentIcon, { color: active ? t.color : '#94A3B8' }]}>{t.icon}</Text>
                <Text style={[styles.segmentText, active && { color: t.color, fontWeight: '700' }]}>
                  {p.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {isEmpty ? emptyState : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={({ item }) => <MessageBubble message={item} accentColor={theme.color} />}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              <>
                {shownPending && (
                  <View style={[styles.pendingBubble, { backgroundColor: theme.color }]}>
                    <Text style={styles.pendingText}>{shownPending}</Text>
                  </View>
                )}
                {isLoading && (
                  <View style={styles.typingRow}>
                    <View style={[styles.typingAvatar, { backgroundColor: theme.soft }]}>
                      <Text style={{ color: theme.color, fontSize: 13 }}>{theme.icon}</Text>
                    </View>
                    <View style={styles.typingBubble}>
                      <TypingDots color={theme.color} />
                    </View>
                  </View>
                )}
              </>
            }
          />
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Barra de entrada */}
        <View style={styles.inputContainer}>
          <View style={[
            styles.inputWrap,
            inputFocused && { borderColor: theme.color, backgroundColor: '#FFFFFF' },
          ]}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={`Escribe a ${providerName}…`}
              placeholderTextColor='#94A3B8'
              multiline
              onSubmitEditing={handleSend}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
          </View>
          <Pressable
            onPress={handleSend}
            onPressIn={pressIn}
            onPressOut={pressOut}
            disabled={!canSend}
            accessibilityLabel='Enviar mensaje'
          >
            <Animated.View style={[
              styles.sendButton,
              { backgroundColor: canSend ? theme.color : '#CBD5E1', transform: [{ scale: sendScale }] },
              canSend && { shadowColor: theme.color },
            ]}>
              <Text style={styles.sendIcon}>➤</Text>
            </Animated.View>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const shadow = Platform.select({
  ios: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6 },
  android: { elevation: 3 },
  default: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  flex: { flex: 1 },

  // Encabezado
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarIcon: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  statusDot: {
    position: 'absolute', right: 0, bottom: 0,
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  statusPulse: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '500' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  iconBtnPressed: { transform: [{ scale: 0.9 }], opacity: 0.8 },
  iconBtnDisabled: { opacity: 0.4 },
  iconBtnText: { fontSize: 18 },

  // Selector de proveedor
  providerBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: { backgroundColor: '#FFFFFF', ...shadow },
  segmentIcon: { fontSize: 13 },
  segmentText: { fontSize: 13, color: '#64748B', fontWeight: '500' },

  // Estado vacío
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyAvatar: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyAvatarIcon: { fontSize: 36, fontWeight: '700' },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  emptySubtitle: { fontSize: 15, color: '#64748B', textAlign: 'center', marginBottom: 20, lineHeight: 21 },
  suggestions: { width: '100%', gap: 10 },
  suggestionChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  suggestionText: { fontSize: 14, color: '#334155' },

  // Mensajes
  messagesList: { paddingVertical: 16, paddingBottom: 8 },
  pendingBubble: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 20,
    borderBottomRightRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    opacity: 0.7,
  },
  pendingText: { color: '#FFFFFF', fontSize: 15, lineHeight: 21 },
  typingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginHorizontal: 12, marginVertical: 6 },
  typingAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  typingBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
  },
  dotsRow: { flexDirection: 'row', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },

  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorIcon: { fontSize: 16 },
  errorText: { flex: 1, color: '#B91C1C', fontSize: 14 },

  // Entrada
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  inputWrap: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
  },
  input: {
    minHeight: 44,
    maxHeight: 120,
    paddingVertical: 11,
    fontSize: 16,
    color: '#0F172A',
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow,
  },
  sendIcon: { color: '#FFFFFF', fontSize: 18, marginLeft: 2 },
});
