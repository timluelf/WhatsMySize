import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/lib/auth';
import { useGame } from '@/lib/gameStore';
import { GameState, Team } from '@/lib/scoring';
import {
  RegisteredTeam,
  TournamentDetail,
  TournamentMatch,
  TournamentTeam,
  addTeamToTournament,
  generateBracket,
  getTeamRoster,
  getTournament,
  listAllRegisteredTeams,
  removeTeamFromTournament,
  reportMatchResult,
  updateTournamentFee,
} from '@/lib/tournaments';
import { centsToDollarsInput, dollarsToCents, formatFee } from '@/lib/money';
import {
  TournamentLeaders,
  computeTournamentLeaders,
  fetchTournamentGames,
} from '@/lib/tournamentStats';
import { isSupabaseConfigured } from '@/lib/supabase';
import { colors, radius, spacing, typography } from '@/lib/theme';

export default function TournamentDetailScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { startGame } = useGame();
  const { tournamentId } = useLocalSearchParams<{ tournamentId: string }>();
  const [t, setT] = useState<TournamentDetail | null>(null);
  const [games, setGames] = useState<GameState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingMatch, setEditingMatch] = useState<TournamentMatch | null>(null);
  const [allTeams, setAllTeams] = useState<RegisteredTeam[]>([]);
  const [editingFee, setEditingFee] = useState(false);
  const [feeInput, setFeeInput] = useState('');

  const isCreator = profile && t && t.createdBy === profile.id;
  const isAdmin = profile?.isAdmin ?? false;

  async function playMatchLive(match: TournamentMatch) {
    if (!match.teamAId || !match.teamBId) return;
    setError(null);
    setBusy(true);
    try {
      const teamAInfo = teamById.get(match.teamAId);
      const teamBInfo = teamById.get(match.teamBId);
      const [rosterA, rosterB] = await Promise.all([
        getTeamRoster(match.teamAId),
        getTeamRoster(match.teamBId),
      ]);
      if (rosterA.length === 0 || rosterB.length === 0) {
        setError(
          `${rosterA.length === 0 ? teamAInfo?.name : teamBInfo?.name} has no players yet — they need to register first.`
        );
        return;
      }
      const teamA: Team = {
        id: match.teamAId,
        name: teamAInfo?.name ?? 'Team A',
        abbreviation: makeAbbr(teamAInfo?.name ?? 'A'),
        players: rosterA,
      };
      const teamB: Team = {
        id: match.teamBId,
        name: teamBInfo?.name ?? 'Team B',
        abbreviation: makeAbbr(teamBInfo?.name ?? 'B'),
        players: rosterB,
      };
      await startGame({
        away: teamA,
        home: teamB,
        tournamentMatchId: match.id,
        totalInnings: 7,
      });
      setEditingMatch(null);
      router.push('/games/live');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start match');
    } finally {
      setBusy(false);
    }
  }

  const refresh = useCallback(async () => {
    if (!tournamentId || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const detail = await getTournament(tournamentId);
      if (!detail) {
        setError('Tournament not found');
        return;
      }
      setT(detail);
      const gameIds = detail.matches
        .map((m) => m.gameId)
        .filter((g): g is string => !!g);
      const [gs, teams] = await Promise.all([
        fetchTournamentGames(gameIds),
        detail.createdBy === profile?.id ? listAllRegisteredTeams() : Promise.resolve([]),
      ]);
      setGames(gs);
      setAllTeams(teams);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load');
    } finally {
      setLoading(false);
    }
  }, [tournamentId, profile?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const teamById = useMemo(() => {
    const m = new Map<string, TournamentTeam>();
    t?.teams.forEach((team) => m.set(team.id, team));
    return m;
  }, [t]);

  const leaders: TournamentLeaders | null = useMemo(() => {
    if (!t) return null;
    return computeTournamentLeaders(games, t.teams);
  }, [games, t]);

  async function copyCode() {
    if (!t) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(t.joinCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        // ignore
      }
    }
  }

  async function handleGenerate() {
    if (!t) return;
    setBusy(true);
    setError(null);
    try {
      await generateBracket(t.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate');
    } finally {
      setBusy(false);
    }
  }

  async function handleAddTeam(teamId: string) {
    if (!t) return;
    setError(null);
    try {
      await addTeamToTournament(t.id, teamId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add team');
    }
  }

  async function handleRemoveTeam(teamId: string) {
    if (!t) return;
    setError(null);
    try {
      await removeTeamFromTournament(t.id, teamId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove team');
    }
  }

  async function handleSaveFee() {
    if (!t) return;
    setBusy(true);
    setError(null);
    try {
      await updateTournamentFee(t.id, dollarsToCents(feeInput));
      setEditingFee(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update fee');
    } finally {
      setBusy(false);
    }
  }

  const availableTeams = useMemo(() => {
    if (!t) return [];
    const inTournament = new Set(t.teams.map((tt) => tt.id));
    return allTeams.filter((team) => !inTournament.has(team.id));
  }, [t, allTeams]);

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : t ? (
          <>
            <View style={styles.header}>
              <Text style={styles.eyebrow}>TOURNAMENT</Text>
              <Text style={styles.title}>{t.name}</Text>
              <Text style={styles.muted}>
                {t.size} teams · {t.status.replace('_', ' ')} ·{' '}
                {t.teams.length}/{t.size} joined ·{' '}
                {formatFee(t.registrationFeeCents)} entry
              </Text>
            </View>

            {isCreator ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Registration fee</Text>
                {editingFee ? (
                  <>
                    <Input
                      label="Fee per team ($)"
                      placeholder="0"
                      value={feeInput}
                      onChangeText={setFeeInput}
                      keyboardType="decimal-pad"
                      autoFocus
                    />
                    <Button label="Save fee" onPress={handleSaveFee} loading={busy} />
                    <Button
                      label="Cancel"
                      variant="ghost"
                      onPress={() => setEditingFee(false)}
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.muted}>
                      {t.registrationFeeCents === 0
                        ? 'Free to join'
                        : `${formatFee(t.registrationFeeCents)} per team`}
                    </Text>
                    <Button
                      label="Edit fee"
                      variant="secondary"
                      onPress={() => {
                        setFeeInput(centsToDollarsInput(t.registrationFeeCents));
                        setEditingFee(true);
                      }}
                    />
                  </>
                )}
              </View>
            ) : null}

            {t.status === 'open' ? (
              <View style={styles.card}>
                <Text style={styles.cardEyebrow}>JOIN CODE</Text>
                <View style={styles.codeBox}>
                  <Text selectable style={styles.code}>
                    {t.joinCode}
                  </Text>
                  {Platform.OS === 'web' ? (
                    <Pressable
                      onPress={copyCode}
                      style={({ pressed }) => [
                        styles.copyBtn,
                        pressed && { opacity: 0.85 },
                      ]}
                    >
                      <Text style={styles.copyText}>{copied ? 'Copied' : 'Copy'}</Text>
                    </Pressable>
                  ) : null}
                </View>
                <Text style={styles.muted}>
                  Share with managers to fill the bracket.
                </Text>
                {isCreator ? (
                  <Button
                    label={
                      t.teams.length < t.size
                        ? `Waiting for ${t.size - t.teams.length} more`
                        : 'Generate bracket'
                    }
                    onPress={handleGenerate}
                    loading={busy}
                    disabled={t.teams.length < t.size}
                  />
                ) : null}
              </View>
            ) : null}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Teams</Text>
              {t.teams.length === 0 ? (
                <Text style={styles.muted}>No teams yet.</Text>
              ) : (
                t.teams.map((team) => (
                  <View key={team.id} style={styles.teamRow}>
                    <Text style={styles.teamSeed}>
                      {team.seed !== null ? `#${team.seed}` : '·'}
                    </Text>
                    <Text style={styles.teamName}>{team.name}</Text>
                    {isCreator && t.status === 'open' ? (
                      <Pressable
                        onPress={() => handleRemoveTeam(team.id)}
                        style={({ pressed }) => [
                          styles.smallBtn,
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <Text style={styles.smallBtnText}>Remove</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))
              )}
            </View>

            {isCreator && t.status === 'open' && availableTeams.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Add registered teams</Text>
                <Text style={styles.muted}>
                  Skip the join code — pick any team in the system.{' '}
                  {t.size - t.teams.length} slot
                  {t.size - t.teams.length === 1 ? '' : 's'} left.
                </Text>
                {availableTeams.map((team) => (
                  <View key={team.id} style={styles.teamRow}>
                    <Text style={styles.teamSeed}>+</Text>
                    <Text style={styles.teamName}>{team.name}</Text>
                    <Pressable
                      onPress={() => handleAddTeam(team.id)}
                      style={({ pressed }) => [
                        styles.smallBtnPrimary,
                        pressed && { opacity: 0.85 },
                      ]}
                      disabled={t.teams.length >= t.size}
                    >
                      <Text style={styles.smallBtnPrimaryText}>Add</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}

            {t.matches.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Bracket</Text>
                <Bracket
                  matches={t.matches}
                  teamById={teamById}
                  canEdit={Boolean(isCreator)}
                  onEditMatch={setEditingMatch}
                />
              </View>
            ) : null}

            {t.matches.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Schedule</Text>
                <Schedule matches={t.matches} teamById={teamById} />
              </View>
            ) : null}

            {leaders && t.matches.some((m) => m.winnerTeamId) ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Tournament leaders</Text>
                <Leaders leaders={leaders} />
              </View>
            ) : null}
          </>
        ) : null}

        <Button label="Back" variant="ghost" onPress={() => router.back()} />
      </ScrollView>

      {editingMatch ? (
        <ReportResultModal
          match={editingMatch}
          teamById={teamById}
          canPlayLive={isAdmin}
          onPlayLive={() => playMatchLive(editingMatch)}
          playLiveBusy={busy}
          onClose={() => setEditingMatch(null)}
          onSubmitted={async () => {
            setEditingMatch(null);
            await refresh();
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function Bracket({
  matches,
  teamById,
  canEdit,
  onEditMatch,
}: {
  matches: TournamentMatch[];
  teamById: Map<string, TournamentTeam>;
  canEdit: boolean;
  onEditMatch: (m: TournamentMatch) => void;
}) {
  const rounds = useMemo(() => {
    const byRound = new Map<number, TournamentMatch[]>();
    for (const m of matches) {
      if (!byRound.has(m.round)) byRound.set(m.round, []);
      byRound.get(m.round)!.push(m);
    }
    return Array.from(byRound.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([round, list]) => [round, list.sort((a, b) => a.slot - b.slot)] as const);
  }, [matches]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.bracketWrap}>
        {rounds.map(([round, list]) => (
          <View key={round} style={styles.roundCol}>
            <Text style={styles.roundLabel}>{labelForRound(round, rounds.length)}</Text>
            {list.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => canEdit && m.teamAId && m.teamBId && !m.winnerTeamId ? onEditMatch(m) : undefined}
                disabled={!canEdit || !m.teamAId || !m.teamBId || !!m.winnerTeamId}
                style={({ pressed }) => [
                  styles.matchCard,
                  pressed && canEdit && { opacity: 0.85 },
                ]}
              >
                <MatchSide
                  teamId={m.teamAId}
                  score={m.teamAScore}
                  isWinner={m.winnerTeamId === m.teamAId}
                  teamById={teamById}
                />
                <View style={styles.matchDivider} />
                <MatchSide
                  teamId={m.teamBId}
                  score={m.teamBScore}
                  isWinner={m.winnerTeamId === m.teamBId}
                  teamById={teamById}
                />
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function MatchSide({
  teamId,
  score,
  isWinner,
  teamById,
}: {
  teamId: string | null;
  score: number | null;
  isWinner: boolean;
  teamById: Map<string, TournamentTeam>;
}) {
  const name = teamId ? teamById.get(teamId)?.name ?? 'Unknown' : 'TBD';
  return (
    <View style={styles.matchSide}>
      <Text
        style={[styles.matchTeam, isWinner && styles.matchWinner, !teamId && styles.matchTBD]}
        numberOfLines={1}
      >
        {name}
      </Text>
      <Text style={[styles.matchScore, isWinner && styles.matchWinner]}>
        {score ?? '–'}
      </Text>
    </View>
  );
}

function Schedule({
  matches,
  teamById,
}: {
  matches: TournamentMatch[];
  teamById: Map<string, TournamentTeam>;
}) {
  return (
    <View>
      {matches.map((m) => {
        const a = m.teamAId ? teamById.get(m.teamAId)?.name : 'TBD';
        const b = m.teamBId ? teamById.get(m.teamBId)?.name : 'TBD';
        const played = m.winnerTeamId != null;
        return (
          <View key={m.id} style={styles.scheduleRow}>
            <Text style={styles.scheduleRound}>R{m.round}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.scheduleTeams}>
                {a} <Text style={styles.muted}>vs</Text> {b}
              </Text>
              <Text style={styles.muted}>
                {played
                  ? `${m.teamAScore} – ${m.teamBScore}`
                  : 'Not yet played'}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Leaders({ leaders }: { leaders: TournamentLeaders }) {
  const blocks = [
    { title: 'Batting avg', rows: leaders.battingAvg, key: 'avg' as const },
    { title: 'Home runs', rows: leaders.homeRuns, key: 'hr' as const },
    { title: 'RBI', rows: leaders.rbi, key: 'rbi' as const },
    { title: 'Runs', rows: leaders.runs, key: 'r' as const },
  ];
  return (
    <View style={{ gap: spacing.md }}>
      {blocks.map((block) =>
        block.rows.length > 0 ? (
          <View key={block.title}>
            <Text style={styles.leaderTitle}>{block.title}</Text>
            {block.rows.map((row, i) => (
              <View key={row.playerId} style={styles.leaderRow}>
                <Text style={styles.leaderRank}>{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.leaderName} numberOfLines={1}>
                    {row.playerName}
                  </Text>
                  <Text style={styles.muted}>{row.teamName}</Text>
                </View>
                <Text style={styles.leaderValue}>
                  {block.key === 'avg'
                    ? row.avg.toFixed(3).replace(/^0/, '')
                    : block.key === 'hr'
                      ? row.hr
                      : block.key === 'rbi'
                        ? row.rbi
                        : row.r}
                </Text>
              </View>
            ))}
          </View>
        ) : null
      )}
    </View>
  );
}

function ReportResultModal({
  match,
  teamById,
  canPlayLive,
  onPlayLive,
  playLiveBusy,
  onClose,
  onSubmitted,
}: {
  match: TournamentMatch;
  teamById: Map<string, TournamentTeam>;
  canPlayLive: boolean;
  onPlayLive: () => void;
  playLiveBusy: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const a = match.teamAId ? teamById.get(match.teamAId)?.name : 'Team A';
  const b = match.teamBId ? teamById.get(match.teamBId)?.name : 'Team B';

  async function submit() {
    setErr(null);
    const aNum = parseInt(scoreA, 10);
    const bNum = parseInt(scoreB, 10);
    if (Number.isNaN(aNum) || Number.isNaN(bNum)) {
      setErr('Enter both scores');
      return;
    }
    setSubmitting(true);
    try {
      await reportMatchResult({
        matchId: match.id,
        teamAScore: aNum,
        teamBScore: bNum,
      });
      onSubmitted();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.cardTitle}>Report result</Text>
          <Text style={styles.muted}>Round {match.round}</Text>
          <Input
            label={a}
            placeholder="Score"
            value={scoreA}
            onChangeText={setScoreA}
            keyboardType="number-pad"
          />
          <Input
            label={b}
            placeholder="Score"
            value={scoreB}
            onChangeText={setScoreB}
            keyboardType="number-pad"
          />
          {err ? <Text style={styles.error}>{err}</Text> : null}
          {canPlayLive ? (
            <Button
              label="Play live"
              onPress={onPlayLive}
              loading={playLiveBusy}
            />
          ) : null}
          <Button
            label="Save result"
            onPress={submit}
            loading={submitting}
            variant={canPlayLive ? 'secondary' : 'primary'}
          />
          <Button label="Cancel" variant="ghost" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

function makeAbbr(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9 ]/g, '').trim();
  if (!clean) return 'TBD';
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return parts
    .slice(0, 3)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function labelForRound(round: number, totalRounds: number): string {
  const reverseIdx = totalRounds - round;
  if (reverseIdx === 0) return 'Final';
  if (reverseIdx === 1) return 'Semifinals';
  if (reverseIdx === 2) return 'Quarterfinals';
  return `Round ${round}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.lg },
  header: { gap: 4, marginTop: spacing.sm },
  eyebrow: { ...typography.caption, color: colors.primary, letterSpacing: 4 },
  title: { ...typography.h1, color: colors.text },
  muted: { ...typography.caption, color: colors.textMuted },
  center: { paddingVertical: spacing.xl, alignItems: 'center' },
  error: { ...typography.caption, color: colors.danger, textAlign: 'center' },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { ...typography.h3, color: colors.text },
  cardEyebrow: { ...typography.caption, color: colors.accent, letterSpacing: 3 },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: spacing.md,
    gap: spacing.md,
  },
  code: {
    flex: 1,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 20,
    color: colors.accent,
    letterSpacing: 3,
  },
  copyBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
  },
  copyText: { ...typography.label, color: colors.bg },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  teamSeed: { ...typography.caption, color: colors.accent, fontWeight: '700', width: 28 },
  teamName: { ...typography.body, color: colors.text, flex: 1 },
  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  smallBtnText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  smallBtnPrimary: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  smallBtnPrimaryText: { ...typography.caption, color: colors.text, fontWeight: '700' },
  bracketWrap: { flexDirection: 'row', gap: spacing.md, paddingVertical: 4 },
  roundCol: { gap: spacing.md, minWidth: 160 },
  roundLabel: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 2,
    fontWeight: '700',
  },
  matchCard: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  matchSide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    gap: 8,
  },
  matchTeam: { ...typography.body, color: colors.text, flex: 1, fontSize: 14 },
  matchTBD: { color: colors.textMuted, fontStyle: 'italic' },
  matchScore: { ...typography.body, color: colors.text, fontWeight: '700', minWidth: 24, textAlign: 'right' },
  matchWinner: { color: colors.accent, fontWeight: '700' },
  matchDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 2 },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  scheduleRound: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '700',
    width: 30,
  },
  scheduleTeams: { ...typography.body, color: colors.text },
  leaderTitle: { ...typography.label, color: colors.textMuted, letterSpacing: 2 },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  leaderRank: {
    width: 18,
    ...typography.caption,
    color: colors.accent,
    fontWeight: '700',
    textAlign: 'center',
  },
  leaderName: { ...typography.body, color: colors.text },
  leaderValue: { ...typography.h3, color: colors.text },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    maxWidth: 400,
  },
});
