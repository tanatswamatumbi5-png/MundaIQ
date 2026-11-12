import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Card } from '@/components/Card';
import { ListItem } from '@/components/ListItem';
import { Screen } from '@/components/Screen';
import { Tag } from '@/components/Tag';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';

const suggestions = [
  'Why is my production dropping?',
  'How much feed per hen per day?',
  'Lighting program for layers?',
  'Preventing egg breakage',
];

const quickTips = [
  {
    icon: 'water' as const,
    title: 'Clean water daily',
    detail: 'Wash drinkers each morning – watery intake cuts egg size.',
  },
  {
    icon: 'lightbulb-on-outline' as const,
    title: 'Keep lighting steady',
    detail: 'Aim for 14–16 hours of light at a stable intensity.',
  },
  {
    icon: 'egg' as const,
    title: 'Collect eggs 2–3× daily',
    detail: 'Frequent collection reduces breakage and soiling.',
  },
];

export function FarmAssistantScreen() {
  return (
    <Screen>
      <Card style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="robot-outline" size={26} color={colors.assistant} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Shamba</Text>
            <Text style={styles.heroSubtitle}>Your farm assistant</Text>
          </View>
          <Tag label="Demo" tone="neutral" />
        </View>
        <Text style={styles.heroBody}>
          Ask anything about feeding, animal health, planting or farm finances. Answers are
          generated from your records and general best practice.
        </Text>
      </Card>

      <Text style={styles.sectionLabel}>Try asking</Text>
      <View style={styles.suggestionRow}>
        {suggestions.map((question) => (
          <Card key={question} padding={spacing.md} style={styles.suggestion}>
            <Text style={styles.suggestionText}>{question}</Text>
          </Card>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Quick tips</Text>
      <Card padding={0} style={styles.listCard}>
        {quickTips.map((tip, index) => (
          <View key={tip.title}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <ListItem
              icon={tip.icon}
              iconColor={colors.assistant}
              iconBg={colors.assistantSoft}
              title={tip.title}
              subtitle={tip.detail}
              showChevron={false}
              right={undefined}
            />
          </View>
        ))}
      </Card>

      <Text style={styles.disclaimer}>
        Farm Assistant is a planning aid, not a substitute for a qualified veterinarian or
        agronomist.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.assistant,
    borderRadius: radius.xl,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  heroSubtitle: {
    fontSize: fontSize.md,
    color: colors.white,
    opacity: 0.85,
  },
  heroBody: {
    fontSize: fontSize.md,
    color: colors.white,
    opacity: 0.95,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  sectionLabel: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing['2xl'],
    marginBottom: spacing.md,
  },
  suggestionRow: {
    gap: spacing.sm,
  },
  suggestion: {
    paddingVertical: spacing.md,
  },
  suggestionText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  listCard: {
    paddingHorizontal: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  disclaimer: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing['2xl'],
    lineHeight: 16,
  },
});