import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CertificateGenerator } from '../../../components/academy/CertificateGenerator';
import { ShareAchievementButton } from '../../../components/academy/ShareAchievementButton';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from '../../../i18n';
import { getLocalKidsRankingSnapshot, type KidsLeaderboardRow } from '../../../services/academy/LeaderboardService';
import { getMonthlyHallOfFameSnapshot, type MonthlyWinner } from '../../../services/academy/MonthlyRewardService';
import { FontFamily } from '../../../theme/typography';

type PodiumSlot = Readonly<{
  row: KidsLeaderboardRow;
  height: number;
  medalColor: string;
}>;

function childNicknameFromParent(
  parentName: string | undefined,
  t: (key: string) => string
): string {
  const first = parentName?.trim().split(/\s+/)[0];
  if (!first) return t('academySub.leaderboard.defaultChildNickname');
  if (first.startsWith('Bé')) return first;
  return `Bé ${first}`;
}

export function KidsLeaderboardScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tab, setTab] = useState<'weekly' | 'monthly'>('weekly');
  const [weeklyRows, setWeeklyRows] = useState<readonly KidsLeaderboardRow[]>([]);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [weeklyStale, setWeeklyStale] = useState(false);
  const [weeklyMeta, setWeeklyMeta] = useState<Readonly<{ periodKey: string; checksum: string }>>({
    periodKey: '',
    checksum: '',
  });
  const [monthlyWinners, setMonthlyWinners] = useState<readonly MonthlyWinner[]>([]);
  const [monthlyLoading, setMonthlyLoading] = useState(true);
  const [monthlyStale, setMonthlyStale] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const parentChildNickname = childNicknameFromParent(user?.name, t);
  const city = weeklyRows[0]?.cityLabel ?? 'Global City';
  const pointsUnit = t('academySub.common.pointsUnit');
  const meRow = useMemo(() => {
    const seed = (user?.phone ?? 'guest_parent').length;
    return {
      rank: 8 + (seed % 18),
      points: 900 - seed * 3,
    };
  }, [user?.phone]);

  const podium = useMemo<readonly PodiumSlot[]>(() => {
    const top = weeklyRows.slice(0, 3);
    if (top.length === 0) return [];
    const second = top[1] ?? top[0];
    const first = top[0];
    const third = top[2] ?? top[0];
    if (!first || !second || !third) return [];
    return [
      { row: second, height: 84, medalColor: '#D1D5DB' },
      { row: first, height: 112, medalColor: '#F59E0B' },
      { row: third, height: 70, medalColor: '#B45309' },
    ];
  }, [weeklyRows]);

  useEffect(() => {
    let cancelled = false;
    setWeeklyLoading(true);
    void (async () => {
      const snapshot = await getLocalKidsRankingSnapshot(user?.country ?? 'DE');
      if (cancelled) return;
      setWeeklyRows(snapshot.rows);
      setWeeklyStale(snapshot.stale);
      setWeeklyMeta({ periodKey: snapshot.periodKey, checksum: snapshot.checksum });
      setWeeklyLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [retryNonce, user?.country]);

  useEffect(() => {
    let cancelled = false;
    setMonthlyLoading(true);
    void (async () => {
      const snapshot = await getMonthlyHallOfFameSnapshot(user?.country ?? 'DE');
      if (!cancelled) {
        setMonthlyWinners(snapshot.winners);
        setMonthlyStale(snapshot.stale);
        setMonthlyLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [retryNonce, user?.country]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t('academySub.leaderboard.title')}</Text>
      <Text style={styles.subtitle}>{t('academySub.leaderboard.subtitle')}</Text>

      <View style={styles.previewBanner}>
        <Text style={styles.previewBannerText}>{t('academySub.leaderboard.previewBanner')}</Text>
        <Text style={styles.previewBannerSub}>{t('academySub.common.previewDemoData')}</Text>
        <Text style={styles.previewBannerSub}>{t('academySub.common.notOfficialCert')}</Text>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          style={({ pressed }) => [styles.tabBtn, tab === 'weekly' && styles.tabBtnActive, pressed && { opacity: 0.9 }]}
          onPress={() => setTab('weekly')}
        >
          <Text style={styles.tabText}>{t('academySub.leaderboard.tabWeekly')}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.tabBtn, tab === 'monthly' && styles.tabBtnActive, pressed && { opacity: 0.9 }]}
          onPress={() => setTab('monthly')}
        >
          <Text style={styles.tabText}>{t('academySub.leaderboard.tabMonthly')}</Text>
        </Pressable>
      </View>
      {(weeklyStale || monthlyStale) && (
        <View style={styles.staleBanner}>
          <Text style={styles.staleText}>{t('academySub.leaderboard.staleText')}</Text>
          <Pressable style={styles.retryBtn} onPress={() => setRetryNonce((v) => v + 1)}>
            <Text style={styles.retryText}>{t('academySub.common.retry')}</Text>
          </Pressable>
        </View>
      )}

      {tab === 'weekly' ? (
        <>
          {weeklyLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#2563EB" />
              <Text style={styles.loadingText}>{t('academySub.leaderboard.loadingWeekly')}</Text>
            </View>
          ) : null}
          {!weeklyLoading && podium.length > 0 ? (
          <View style={styles.podiumWrap}>
            {podium.map((slot, idx) => (
              <View key={`${slot.row.nickname}-${slot.row.rank}`} style={styles.podiumCol}>
                <View style={[styles.medal, { backgroundColor: slot.medalColor }]}>
                  <Ionicons name="trophy" size={18} color="#FFFFFF" />
                </View>
                <Text numberOfLines={1} style={styles.podiumName}>
                  {slot.row.avatarEmoji} {slot.row.nickname}
                </Text>
                <Text style={styles.podiumPoints}>
                  {slot.row.vietKidsPoints} {pointsUnit}
                </Text>
                <View style={[styles.podiumBlock, { height: slot.height }]}>
                  <Text style={styles.podiumRank}>#{idx === 0 ? 2 : idx === 1 ? 1 : 3}</Text>
                </View>
              </View>
            ))}
          </View>
          ) : null}

          <FlatList
            data={weeklyRows.slice(3, 50)}
            keyExtractor={(item) => `${item.rank}-${item.nickname}`}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.rowCard}>
                <Text style={styles.rowRank}>#{item.rank}</Text>
                <Text style={styles.rowName}>
                  {item.avatarEmoji} {item.nickname} - {item.cityLabel}
                </Text>
                <Text style={styles.rowPoints}>
                  {item.vietKidsPoints} {pointsUnit}
                </Text>
              </View>
            )}
          />
          <Text style={styles.metaText}>
            {t('academySub.leaderboard.metaWeekly', {
              period: weeklyMeta.periodKey,
              checksum: weeklyMeta.checksum,
            })}
          </Text>
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.monthlyContent}>
          {monthlyLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#2563EB" />
              <Text style={styles.loadingText}>{t('academySub.leaderboard.loadingMonthly')}</Text>
            </View>
          ) : null}
          {monthlyWinners.map((winner) => (
            <View key={`${winner.monthKey}-${winner.rank}-${winner.parentId}`} style={styles.monthlyCard}>
              <Text style={styles.monthlyBadge}>
                {t('academySub.leaderboard.monthlyTop', { rank: winner.rank })}
              </Text>
              <CertificateGenerator winner={winner} />
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.stickyBar}>
        <View style={styles.stickyMain}>
          <Text style={styles.stickyText}>
            {t('academySub.leaderboard.stickyRank', { rank: meRow.rank })}
          </Text>
          <Text style={styles.stickySub}>
            {t('academySub.leaderboard.stickyPoints', { points: meRow.points, unit: pointsUnit })}
          </Text>
          <Text style={styles.stickyDisclaimer}>{t('academySub.common.noGuaranteedOutcome')}</Text>
        </View>
        <ShareAchievementButton
          childNickname={parentChildNickname}
          cityLabel={city}
          rank={meRow.rank}
          points={meRow.points}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECFEFF',
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  title: { color: '#0C4A6E', fontSize: 26, fontFamily: FontFamily.extrabold, textAlign: 'center' },
  subtitle: { color: '#155E75', fontSize: 13, fontFamily: FontFamily.medium, textAlign: 'center', marginTop: 4 },
  previewBanner: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C4B5FD',
    backgroundColor: '#F5F3FF',
    padding: 10,
    gap: 4,
  },
  previewBannerText: { color: '#5B21B6', fontSize: 12, fontFamily: FontFamily.bold, textAlign: 'center' },
  previewBannerSub: { color: '#6D28D9', fontSize: 11, fontFamily: FontFamily.medium, textAlign: 'center', lineHeight: 16 },
  tabRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 999,
    backgroundColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#2563EB',
  },
  tabText: { color: '#FFFFFF', fontSize: 12, fontFamily: FontFamily.bold },
  podiumWrap: {
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: '#FDF4FF',
    borderWidth: 2,
    borderColor: '#E9D5FF',
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  podiumCol: { width: '31%', alignItems: 'center' },
  medal: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  podiumName: { color: '#4C1D95', fontSize: 12, fontFamily: FontFamily.bold, maxWidth: '98%' },
  podiumPoints: { color: '#6D28D9', fontSize: 11, fontFamily: FontFamily.medium, marginBottom: 5 },
  podiumBlock: {
    width: '82%',
    borderRadius: 10,
    backgroundColor: '#A78BFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumRank: { color: '#FFFFFF', fontSize: 18, fontFamily: FontFamily.extrabold },
  listContent: { paddingTop: 10, paddingBottom: 120, gap: 8 },
  loadingWrap: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  loadingText: { color: '#0C4A6E', fontSize: 12, fontFamily: FontFamily.medium },
  staleBanner: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  staleText: { flex: 1, color: '#92400E', fontSize: 11, fontFamily: FontFamily.medium },
  retryBtn: { borderRadius: 999, backgroundColor: '#B45309', paddingVertical: 6, paddingHorizontal: 10 },
  retryText: { color: '#FFFFFF', fontSize: 11, fontFamily: FontFamily.bold },
  metaText: { textAlign: 'center', color: '#475569', fontSize: 11, fontFamily: FontFamily.medium, marginBottom: 110 },
  monthlyContent: { paddingTop: 12, paddingBottom: 120, gap: 10 },
  monthlyCard: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FDE68A',
    backgroundColor: '#FEFCE8',
    padding: 8,
    gap: 6,
  },
  monthlyBadge: { color: '#92400E', fontSize: 12, fontFamily: FontFamily.extrabold, textAlign: 'center' },
  rowCard: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowRank: { width: 42, color: '#0C4A6E', fontSize: 13, fontFamily: FontFamily.bold },
  rowName: { flex: 1, color: '#334155', fontSize: 13, fontFamily: FontFamily.medium },
  rowPoints: { color: '#0369A1', fontSize: 13, fontFamily: FontFamily.bold },
  stickyBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stickyMain: { flex: 1, gap: 2 },
  stickyText: { color: '#FFFFFF', fontSize: 13, fontFamily: FontFamily.bold },
  stickySub: { color: '#CBD5E1', fontSize: 12, fontFamily: FontFamily.medium },
  stickyDisclaimer: { color: '#94A3B8', fontSize: 10, fontFamily: FontFamily.medium, lineHeight: 14 },
});
