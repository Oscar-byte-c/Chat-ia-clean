import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Easing } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Message } from '../../domain/entities/Message';

interface Props {
  message: Message;
  accentColor?: string;
}

export const MessageBubble: React.FC<Props> = ({ message, accentColor = '#6366F1' }) => {
  const isUser = message.role === 'user';
  const [showTime, setShowTime] = useState(true);

  // Animación de entrada: aparece deslizándose desde su lado
  const appear = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    Animated.timing(appear, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [appear]);

  const animatedStyle = {
    opacity: appear,
    transform: [
      { translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
      { translateX: appear.interpolate({ inputRange: [0, 1], outputRange: [isUser ? 16 : -16, 0] }) },
    ],
  };

  return (
    <Animated.View style={[styles.row, isUser ? styles.userRow : styles.aiRow, animatedStyle]}>
      {!isUser && (
        <View style={[styles.avatar, { backgroundColor: accentColor }]}>
          <Text style={styles.avatarText}>IA</Text>
        </View>
      )}
      <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
        <Pressable
          onPress={() => setShowTime(v => !v)}
          style={({ pressed }) => [
            styles.bubble,
            isUser ? [styles.userBubble, { backgroundColor: accentColor }] : styles.aiBubble,
            pressed && styles.bubblePressed,
          ]}
        >
          {isUser ? (
            <Text style={[styles.text, styles.userText]}>{message.content}</Text>
          ) : (
            // Las respuestas de la IA vienen en Markdown: las renderizamos con formato
            <Markdown style={markdownStyles}>{message.content}</Markdown>
          )}
        </Pressable>
        {showTime && (
          <Text style={[styles.timestamp, isUser && styles.timestampUser]}>
            {message.timestamp.toLocaleTimeString('es-EC', {
              hour: '2-digit', minute: '2-digit',
            })}
            {isUser ? '  ✓✓' : ''}
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  row:          { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 5, marginHorizontal: 12, gap: 8 },
  userRow:      { justifyContent: 'flex-end' },
  aiRow:        { justifyContent: 'flex-start' },
  avatar:       { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  avatarText:   { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  container:    { maxWidth: '80%' },
  userContainer:{ alignItems: 'flex-end' },
  aiContainer:  { alignItems: 'flex-start', flexShrink: 1 },
  bubble:       { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  bubblePressed:{ opacity: 0.85, transform: [{ scale: 0.98 }] },
  userBubble:   { borderBottomRightRadius: 6 },
  aiBubble:     {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
  },
  text:         { fontSize: 15, lineHeight: 21 },
  userText:     { color: '#FFFFFF' },
  timestamp:    { fontSize: 11, color: '#94A3B8', marginTop: 4, marginHorizontal: 4 },
  timestampUser:{ color: '#94A3B8' },
});

// Estilos para los elementos Markdown dentro de la burbuja de la IA
const markdownStyles = StyleSheet.create({
  body:        { fontSize: 15, lineHeight: 22, color: '#1E293B' },
  paragraph:   { marginTop: 0, marginBottom: 6 },
  strong:      { fontWeight: '700', color: '#0F172A' },
  em:          { fontStyle: 'italic' },
  heading1:    { fontSize: 20, fontWeight: '700', marginVertical: 4, color: '#0F172A' },
  heading2:    { fontSize: 18, fontWeight: '700', marginVertical: 4, color: '#0F172A' },
  heading3:    { fontSize: 16, fontWeight: '700', marginVertical: 4, color: '#0F172A' },
  bullet_list: { marginVertical: 4 },
  ordered_list:{ marginVertical: 4 },
  link:        { color: '#4F46E5', textDecorationLine: 'underline' },
  blockquote:  { backgroundColor: '#F8FAFC', borderLeftWidth: 3, borderLeftColor: '#CBD5E1', paddingHorizontal: 10, marginVertical: 4 },
  code_inline: { backgroundColor: '#F1F5F9', color: '#BE185D', borderRadius: 4, paddingHorizontal: 4, fontFamily: 'monospace' },
  fence:       { backgroundColor: '#0F172A', color: '#E2E8F0', borderRadius: 10, padding: 12, fontFamily: 'monospace', borderWidth: 0 },
  code_block:  { backgroundColor: '#0F172A', color: '#E2E8F0', borderRadius: 10, padding: 12, fontFamily: 'monospace', borderWidth: 0 },
});
