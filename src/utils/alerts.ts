import { Alert, Platform } from 'react-native';

export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void,
  destructive = false
) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      const result = window.confirm(`${title}\n\n${message}`);
      if (result) {
        onConfirm();
      }
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: title.split(' ')[0], // E.g. "Block" or "Unblock"
        style: destructive ? 'destructive' : 'default',
        onPress: onConfirm,
      },
    ]);
  }
}
