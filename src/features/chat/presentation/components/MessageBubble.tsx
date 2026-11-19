import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Message } from '../../domain/entities/Message';

interface Props { message: Message; }

export const MessageBubble: React.FC<Props> = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {isUser ? (
          <Text style={[styles.text, styles.userText]}>{message.content}</Text>
        ) : (
          // Las respuestas de la IA vienen en Markdown: las renderizamos con formato
          <Markdown style={markdownStyles}>{message.content}</Markdown>
        )}
      </View>
      <Text style={styles.timestamp}>
        {message.timestamp.toLocaleTimeString('es-EC', {
          hour: '2-digit', minute: '2-digit',
        })}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 4, marginHorizontal: 12, maxWidth: '80%' },
  userContainer: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  aiContainer:  { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble:       { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble:   { backgroundColor: '#2563EB', borderBottomRightRadius: 4 },
  aiBubble:     { backgroundColor: '#F1F5F9', borderBottomLeftRadius: 4 },
  text:         { fontSize: 15, lineHeight: 21 },
  userText:     { color: '#FFFFFF' },
  aiText:       { color: '#1E293B' },
  timestamp:    { fontSize: 10, color: '#94A3B8', marginTop: 2 },
});

// Estilos para los elementos Markdown dentro de la burbuja de la IA
const markdownStyles = StyleSheet.create({
  body:        { fontSize: 15, lineHeight: 21, color: '#1E293B' },
  paragraph:   { marginTop: 0, marginBottom: 6 },
  strong:      { fontWeight: '700' },
  em:          { fontStyle: 'italic' },
  heading1:    { fontSize: 20, fontWeight: '700', marginVertical: 4 },
  heading2:    { fontSize: 18, fontWeight: '700', marginVertical: 4 },
  heading3:    { fontSize: 16, fontWeight: '700', marginVertical: 4 },
  bullet_list: { marginVertical: 4 },
  ordered_list:{ marginVertical: 4 },
  code_inline: { backgroundColor: '#E2E8F0', borderRadius: 4, paddingHorizontal: 4, fontFamily: 'monospace' },
  fence:       { backgroundColor: '#1E293B', color: '#F8FAFC', borderRadius: 8, padding: 10, fontFamily: 'monospace' },
  code_block:  { backgroundColor: '#1E293B', color: '#F8FAFC', borderRadius: 8, padding: 10, fontFamily: 'monospace' },
});
