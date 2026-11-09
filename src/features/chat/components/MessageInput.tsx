import { useState } from 'react';
import { View, TextInput, Pressable, Alert, Modal, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Send, Paperclip, ImageIcon, X, Sparkles, FileText, Play } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { useSendMessageWithFiles, useSendGif } from '../api';
import { GifPicker } from './GifPicker';
import { VoiceRecorder } from './VoiceRecorder';

type PickedFile = { uri: string; name: string; type: string; size?: number };

type GifResult = { id: string; url: string; preview: string; width: number; height: number };

type Props = {
  conversationId: string;
  onSendText: (content: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
};

export function MessageInput({ conversationId, onSendText, onTypingStart, onTypingStop }: Props) {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [showGif, setShowGif] = useState(false);
  const sendFiles = useSendMessageWithFiles(conversationId);
  const sendGif = useSendGif(conversationId);

  const onChangeText = (t: string) => {
    setContent(t);
    onTypingStart();
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed && files.length === 0) return;

    if (files.length > 0) {
      sendFiles.mutate(
        { content: trimmed, files: files.map(({ size: _s, ...f }) => f) },
        {
          onSuccess: () => { setContent(''); setFiles([]); onTypingStop(); },
          onError: (err: any) => Alert.alert('Error', err?.message ?? 'Failed to send'),
        },
      );
    } else {
      onSendText(trimmed);
      setContent('');
      onTypingStop();
    }
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled) return;
    const picked = result.assets.map((a) => ({
      uri: a.uri,
      name: a.fileName ?? `photo-${Date.now()}.${(a.mimeType ?? 'image/jpeg').split('/')[1]}`,
      type: a.mimeType ?? 'image/jpeg',
      size: a.fileSize,
    }));
    setFiles((prev) => [...prev, ...picked].slice(0, 10));
  };

  const pickDocs = async () => {
    const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
    if (result.canceled) return;
    const picked = result.assets.map((a) => ({
      uri: a.uri,
      name: a.name,
      type: a.mimeType ?? 'application/octet-stream',
      size: a.size ?? undefined,
    }));
    setFiles((prev) => [...prev, ...picked].slice(0, 10));
  };

  const handleGifSend = (gif: GifResult) => {
    setShowGif(false);
    sendGif.mutate(gif.url, {
      onError: (err: any) => Alert.alert('Error', err?.message ?? 'Failed to send GIF'),
    });
  };

  const handleVoiceSend = (uri: string) => {
    setFiles((prev) =>
      [...prev, { uri, name: `voice-${Date.now()}.m4a`, type: 'audio/mp4' }].slice(0, 10),
    );
  };

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));
  const canSend = content.trim().length > 0 || files.length > 0;
  const isBusy = sendFiles.isPending;

  return (
    <View className="border-t border-border bg-background px-3 py-2">
      {/* File previews */}
      {files.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mb-2">
          {files.map((f, i) => (
            <FilePreview key={i} file={f} onRemove={() => removeFile(i)} />
          ))}
        </View>
      )}

      <View className="flex-row items-end gap-1">
        {/* Image picker */}
        <Pressable onPress={pickImages} hitSlop={6} className="p-2 rounded-md active:bg-secondary" disabled={isBusy}>
          <ImageIcon size={20} className="text-muted-foreground" />
        </Pressable>

        {/* Doc picker */}
        <Pressable onPress={pickDocs} hitSlop={6} className="p-2 rounded-md active:bg-secondary" disabled={isBusy}>
          <Paperclip size={20} className="text-muted-foreground" />
        </Pressable>

        {/* GIF picker */}
        <Pressable onPress={() => setShowGif(true)} hitSlop={6} className="p-2 rounded-md active:bg-secondary" disabled={isBusy}>
          <Sparkles size={20} className="text-muted-foreground" />
        </Pressable>

        {/* Voice recorder */}
        <VoiceRecorder onSend={handleVoiceSend} disabled={isBusy} />

        {/* Text input */}
        <TextInput
          value={content}
          onChangeText={onChangeText}
          multiline
          placeholder="Message…"
          placeholderTextColor="#9ca3af"
          className="flex-1 min-h-[42px] max-h-32 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        />

        {/* Send */}
        <Pressable
          onPress={handleSend}
          disabled={!canSend || isBusy}
          className={`p-2 rounded-md ${canSend && !isBusy ? 'bg-primary' : 'bg-secondary'}`}  // ← !isBusy
        >
          {isBusy ? (
            <ActivityIndicator size="small" />                                             // ← spinner
          ) : (
            <Send size={20} className={canSend ? 'text-primary-foreground' : 'text-muted-foreground'} />
          )}
        </Pressable>
      </View>

      {/* GIF picker modal */}
      <Modal
        visible={showGif}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGif(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-center items-center p-4"
          onPress={() => setShowGif(false)}
        >
          <Pressable onPress={() => { /* block tap-through */ }}>
            <GifPicker onSelect={handleGifSend} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}


// Sub-component to preview different files types 
function FilePreview({ file, onRemove }: { file: PickedFile; onRemove: () => void }) {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const sizeKB  = file.size ? Math.round(file.size / 1024) : null;

  return (
    <View className="relative bg-secondary rounded-lg flex-row items-center gap-2 pl-1 pr-6 py-1 max-w-[160px]">
      {isImage ? (
        <Image source={{ uri: file.uri }} style={{ width: 40, height: 40, borderRadius: 6 }} resizeMode="cover" />
      ) : isVideo ? (
        <View style={{ width: 40, height: 40 }} className="rounded-md bg-black/20 items-center justify-center">
          <Play size={16} className="text-foreground" />
        </View>
      ) : (
        <View style={{ width: 40, height: 40 }} className="rounded-md bg-secondary/70 items-center justify-center">
          <FileText size={20} className="text-muted-foreground" />
        </View>
      )}

      <View className="flex-1">
        <Text className="text-[11px] font-medium text-foreground" numberOfLines={1}>
          {file.name}
        </Text>
        {sizeKB !== null && (
          <Text className="text-[10px] text-muted-foreground">{sizeKB} KB</Text>
        )}
      </View>

      <Pressable onPress={onRemove} hitSlop={8}
        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-muted-foreground items-center justify-center"
      >
        <X size={11} className="text-background" />
      </Pressable>
    </View>
  );
}