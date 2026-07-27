import { requestTrackingPermissionsAsync, getTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { Platform } from 'react-native';

/**
 * Requests the App Tracking Transparency permission on iOS.
 * On Android, this returns true immediately as the permission is declared in the manifest
 * and does not require a runtime prompt.
 */
export async function requestTrackingPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    const { status: currentStatus } = await getTrackingPermissionsAsync();
    
    if (currentStatus === 'undetermined') {
      const { status: newStatus } = await requestTrackingPermissionsAsync();
      return newStatus === 'granted';
    }
    
    return currentStatus === 'granted';
  }
  
  // Android handles this via com.google.android.gms.permission.AD_ID in the manifest
  return true;
}
