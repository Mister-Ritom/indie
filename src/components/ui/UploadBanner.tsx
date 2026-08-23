import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInDown,
  FadeOutDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Upload,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle,
  AlertCircle,
  Loader,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useUploadStore } from '@/stores/uploadStore';
import type { UploadJob } from '@/stores/uploadStore';

// Animated rotating loader icon
function SpinnerIcon({ color, size = 16 }: { color: string; size?: number }) {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    const run = () => {
      rotation.value = 0;
      rotation.value = withTiming(360, { duration: 900 });
    };
    run();
    const interval = setInterval(run, 900);
    return () => clearInterval(interval);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Loader size={size} color={color} />
    </Animated.View>
  );
}

function JobRow({ job, onDismiss }: { job: UploadJob; onDismiss: () => void }) {
  const { colors, spacing, typography, radius } = useTheme();

  const iconColor =
    job.status === 'done'
      ? '#22c55e'
      : job.status === 'error'
        ? colors.error
        : colors.primary;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        gap: spacing.sm,
      }}
    >
      {/* Status icon */}
      <View style={{ width: 20, alignItems: 'center' }}>
        {job.status === 'uploading' ? (
          <SpinnerIcon color={iconColor} size={16} />
        ) : job.status === 'done' ? (
          <CheckCircle size={16} color={iconColor} />
        ) : (
          <AlertCircle size={16} color={iconColor} />
        )}
      </View>

      {/* Title + optional error message */}
      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: typography.families.bodyMedium,
            fontSize: typography.scale.bodySmall,
            color: colors.text,
          }}
        >
          {job.title || 'Untitled pin'}
        </Text>
        {job.status === 'error' && job.error ? (
          <Text
            numberOfLines={1}
            style={{
              fontFamily: typography.families.body,
              fontSize: typography.scale.caption,
              color: colors.error,
              marginTop: 2,
            }}
          >
            {job.error}
          </Text>
        ) : null}
      </View>

      {/* Per-row dismiss button */}
      <TouchableOpacity
        onPress={onDismiss}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{
          padding: 4,
          borderRadius: radius.pill,
          backgroundColor: colors.surface,
        }}
      >
        <X size={14} color={colors.icon} />
      </TouchableOpacity>
    </View>
  );
}

export function UploadBanner() {
  const { colors, spacing, typography, radius, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const { jobs, dismissJob } = useUploadStore();
  const [expanded, setExpanded] = useState(true);

  const uploadingCount = jobs.filter((j) => j.status === 'uploading').length;
  const hasError = jobs.some((j) => j.status === 'error');

  // Don't render when there's nothing to show
  if (jobs.length === 0) return null;

  // Position above the tab bar
  const bottomOffset = insets.bottom + (Platform.OS === 'ios' ? 80 : 72);

  const accentColor = hasError
    ? colors.error
    : uploadingCount > 0
      ? colors.primary
      : '#22c55e';

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(14)}
      exiting={FadeOutDown.duration(250)}
      style={{
        position: 'absolute',
        bottom: bottomOffset,
        left: spacing.md,
        right: spacing.md,
        zIndex: 9999,
        borderRadius: radius.xl,
        backgroundColor: colors.surface,
        overflow: 'hidden',
        ...shadows.md,
      }}
    >
      {/* Header row — always visible; tap to collapse/expand */}
      <TouchableOpacity
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.8}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
        }}
      >
        {/* Leading upload icon tinted by status */}
        <Upload size={16} color={accentColor} />

        {/* Summary label */}
        <Text
          style={{
            flex: 1,
            fontFamily: typography.families.bodyMedium,
            fontSize: typography.scale.bodySmall,
            color: colors.text,
          }}
        >
          {uploadingCount > 0
            ? `Uploading ${uploadingCount} pin${uploadingCount > 1 ? 's' : ''}…`
            : hasError
              ? 'Upload failed'
              : `${jobs.length} pin${jobs.length > 1 ? 's' : ''} uploaded`}
        </Text>

        {/* Collapse / Expand chevron */}
        {expanded ? (
          <ChevronDown size={16} color={colors.icon} />
        ) : (
          <ChevronUp size={16} color={colors.icon} />
        )}

        {/* Dismiss-all button — only shown once all jobs are settled */}
        {uploadingCount === 0 && (
          <TouchableOpacity
            onPress={() => jobs.forEach((j) => dismissJob(j.id))}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ marginLeft: spacing.xs }}
          >
            <X size={16} color={colors.icon} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Expanded job list */}
      {expanded && (
        <View
          style={{
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          {jobs.map((job, index) => (
            <React.Fragment key={job.id}>
              {index > 0 && (
                <View
                  style={{
                    height: 1,
                    backgroundColor: colors.border,
                    marginVertical: 2,
                  }}
                />
              )}
              <JobRow job={job} onDismiss={() => dismissJob(job.id)} />
            </React.Fragment>
          ))}
        </View>
      )}
    </Animated.View>
  );
}
