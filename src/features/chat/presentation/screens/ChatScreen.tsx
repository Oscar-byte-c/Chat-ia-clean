import React, { useState, useRef, useEffect } from 'react';
import { View, FlatList, TextInput, TouchableOpacity,
  Text, StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChat } from '../hooks/useChat';
import { useSpeech } from '../hooks/useSpeech';
import { MessageBubble } from '../components/MessageBubble';
import { AIProvider, AI_PROVIDERS } from '../../domain/entities/AIProvider';

export const ChatScreen: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [provider, setProvider] = useState<AIProvider>('gemini');
  const providerName = AI_PROVIDERS.find(p => p.id === provider)!.name;
  const flatListRef = useRef<FlatList>(null);
  const { messages, isLoading, error, sendMessage, clearChat } = useChat(provider);
  const { speak, stop, isSpeaking } = useSpeech();

  // Cuando llega una nueva respuesta de la IA, la leemos en voz alta
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (voiceEnabled && last?.role === 'assistant') {
      speak(last.content);
    }
  }, [messages]);

  const toggleVoice = () => {
    if (voiceEnabled) stop();
    setVoiceEnabled(!voiceEnabled);
  };

  const handleClear = () => {
    stop();
    clearChat();
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText('');
    await sendMessage(text);
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat con {providerName}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleVoice} style={styles.clearBtn}>
            <Text style={styles.voiceText}>
              {voiceEnabled ? (isSpeaking ? '🔊 Hablando' : '🔊 Voz') : '🔇 Voz'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Text style={styles.clearText}>Limpiar</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Selector de proveedor: con quién chatear */}
      <View style={styles.providerBar}>
        {AI_PROVIDERS.map(p => (
          <TouchableOpacity
            key={p.id}
            style={[styles.providerBtn, provider === p.id && styles.providerBtnActive]}
            onPress={() => setProvider(p.id)}
            disabled={isLoading}
          >
            <Text style={[styles.providerText, provider === p.id && styles.providerTextActive]}>
              {p.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <KeyboardAvoidingView style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.messagesList}
        />
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='small' color='#2563EB' />
            <Text style={styles.loadingText}>{providerName} está escribiendo...</Text>
          </View>
        )}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder='Escribe un mensaje...'
            multiline
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendIcon}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  clearBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  clearText: { color: '#EF4444', fontSize: 14 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  voiceText: { color: '#2563EB', fontSize: 14 },
  providerBar: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  providerBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  providerBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  providerText: { fontSize: 14, color: '#374151' },
  providerTextActive: { color: '#FFFFFF', fontWeight: '600' },
  messagesList: { padding: 16, paddingBottom: 8 },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  loadingText: { color: '#6B7280', fontSize: 14 },
  errorContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  errorText: { color: '#DC2626', fontSize: 14 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  sendButton: {
    backgroundColor: '#2563EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { backgroundColor: '#93C5FD' },
  sendIcon: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
});
