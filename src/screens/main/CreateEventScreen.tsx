import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  createEventRequest, clearCreateEventState,
  selectIsCreatingEvent, selectCreateEventError, selectLastCreatedEventId,
} from '../../store/slices/eventsSlice';
import { HomeStackParamList, EventCategory } from '../../types';
import { C } from '../../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'CreateEvent'>;

const CATS: { key: EventCategory; emoji: string }[] = [
  { key: 'Sports',  emoji: '⚽' },
  { key: 'Culture', emoji: '🎭' },
  { key: 'Social',  emoji: '🎉' },
  { key: 'Hobby',   emoji: '🎨' },
  { key: 'Other',   emoji: '📌' },
];

// ─── Date/Time picker helpers ─────────────────────────────────────────────────

const MONTHS = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
];

function pad(n: number): string { return n < 10 ? `0${n}` : `${n}`; }

/** Build an ISO string from separate date/time fields. Returns null if invalid. */
function buildISO(dateStr: string, timeStr: string): string | null {
  // dateStr: "YYYY-MM-DD", timeStr: "HH:MM"
  if (!dateStr || !timeStr) return null;
  const combined = `${dateStr}T${timeStr}:00`;
  const ms = Date.parse(combined);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

/** Format a date string for display in the date button */
function displayDate(dateStr: string): string {
  if (!dateStr) return 'Select date';
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** Format a time string for display */
function displayTime(timeStr: string): string {
  if (!timeStr) return 'Select time';
  const [h, min] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${pad(min)} ${ampm}`;
}

// ─── Inline date picker ───────────────────────────────────────────────────────

interface DatePickerProps {
  value: string;                 // "YYYY-MM-DD"
  onChange: (v: string) => void;
  onClose: () => void;
}

function InlineDatePicker({ value, onChange, onClose }: DatePickerProps): React.JSX.Element {
  const today = new Date();
  const initYear  = value ? parseInt(value.split('-')[0], 10) : today.getFullYear();
  const initMonth = value ? parseInt(value.split('-')[1], 10) - 1 : today.getMonth();

  const [year,  setYear]  = useState(initYear);
  const [month, setMonth] = useState(initMonth);

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1,
  );

  const selectedDay = value
    ? parseInt(value.split('-')[2], 10) : null;

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const select = (day: number) => {
    onChange(`${year}-${pad(month + 1)}-${pad(day)}`);
    onClose();
  };

  const isPast = (day: number) => {
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return d < t;
  };

  return (
    <View style={dp.container}>
      {/* Month/Year nav */}
      <View style={dp.nav}>
        <TouchableOpacity onPress={prevMonth} style={dp.navBtn}>
          <Icon name="chevron-left" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={dp.navTitle}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={dp.navBtn}>
          <Icon name="chevron-right" size={22} color={C.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Day-of-week headers */}
      <View style={dp.row}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <Text key={d} style={dp.dayHeader}>{d}</Text>
        ))}
      </View>

      {/* Day cells */}
      <View style={dp.grid}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`e${idx}`} style={dp.cell} />;
          const past     = isPast(day);
          const selected = day === selectedDay;
          return (
            <TouchableOpacity
              key={day}
              style={[dp.cell, selected && dp.cellSelected, past && dp.cellPast]}
              onPress={() => !past && select(day)}
              disabled={past}>
              <Text style={[dp.cellTxt, selected && dp.cellTxtSelected, past && dp.cellTxtPast]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Inline time picker ───────────────────────────────────────────────────────

interface TimePickerProps {
  value: string;                 // "HH:MM"
  onChange: (v: string) => void;
  onClose: () => void;
}

function InlineTimePicker({ value, onChange, onClose }: TimePickerProps): React.JSX.Element {
  const initH   = value ? parseInt(value.split(':')[0], 10) : 9;
  const initMin = value ? parseInt(value.split(':')[1], 10) : 0;
  const initAM  = initH < 12;

  const [hour,   setHour]   = useState(initH % 12 || 12);  // 1-12
  const [minute, setMinute] = useState(initMin);
  const [isAM,   setIsAM]   = useState(initAM);

  const confirm = () => {
    const h24 = isAM ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
    onChange(`${pad(h24)}:${pad(minute)}`);
    onClose();
  };

  const MINUTES = [0, 15, 30, 45];

  return (
    <View style={tp.container}>
      <Text style={tp.title}>Select Time</Text>

      {/* Hour scroller */}
      <View style={tp.row}>
        <Text style={tp.lbl}>Hour</Text>
        <View style={tp.scroller}>
          {[12,1,2,3,4,5,6,7,8,9,10,11].map(h => (
            <TouchableOpacity
              key={h}
              style={[tp.scrollItem, hour === h && tp.scrollItemOn]}
              onPress={() => setHour(h)}>
              <Text style={[tp.scrollTxt, hour === h && tp.scrollTxtOn]}>{h}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Minute selector */}
      <View style={tp.row}>
        <Text style={tp.lbl}>Minute</Text>
        <View style={tp.minRow}>
          {MINUTES.map(m => (
            <TouchableOpacity
              key={m}
              style={[tp.minBtn, minute === m && tp.minBtnOn]}
              onPress={() => setMinute(m)}>
              <Text style={[tp.minTxt, minute === m && tp.minTxtOn]}>{pad(m)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* AM/PM */}
      <View style={tp.row}>
        <Text style={tp.lbl}>Period</Text>
        <View style={tp.ampmRow}>
          <TouchableOpacity style={[tp.ampmBtn, isAM && tp.ampmOn]} onPress={() => setIsAM(true)}>
            <Text style={[tp.ampmTxt, isAM && tp.ampmTxtOn]}>AM</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[tp.ampmBtn, !isAM && tp.ampmOn]} onPress={() => setIsAM(false)}>
            <Text style={[tp.ampmTxt, !isAM && tp.ampmTxtOn]}>PM</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Preview + Confirm */}
      <TouchableOpacity style={tp.confirmBtn} onPress={confirm}>
        <Text style={tp.confirmTxt}>Set {displayTime(`${pad(isAM ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12))}:${pad(minute)}`)}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CreateEventScreen({ navigation }: Props): React.JSX.Element {
  const dispatch      = useDispatch();
  const isCreating    = useSelector(selectIsCreatingEvent);
  const createError   = useSelector(selectCreateEventError);
  const lastCreatedId = useSelector(selectLastCreatedEventId);

  const [title, setTitle]       = useState('');
  const [dateStr, setDateStr]   = useState('');   // "YYYY-MM-DD"
  const [timeStr, setTimeStr]   = useState('');   // "HH:MM"
  const [location, setLocation] = useState('');
  const [desc, setDesc]         = useState('');
  const [category, setCategory] = useState<EventCategory>('Sports');

  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  // Show API error
  useEffect(() => {
    if (!createError) return;
    Alert.alert('Could not create event', createError, [
      { text: 'OK', onPress: () => dispatch(clearCreateEventState()) },
    ]);
  }, [createError, dispatch]);

  // Navigate on success
  useEffect(() => {
    if (!lastCreatedId) return;
    Alert.alert('Event Created! 🎉', 'Your event is now live.', [
      {
        text: 'OK', onPress: () => {
          dispatch(clearCreateEventState());
          navigation.goBack();
        },
      },
    ]);
  }, [lastCreatedId, dispatch, navigation]);

  const validate = (): string | null => {
    if (!title.trim())    return 'Title is required.';
    if (!location.trim()) return 'Location is required.';
    if (!dateStr)         return 'Please select a date.';
    if (!timeStr)         return 'Please select a time.';
    return null;
  };

  const handleCreate = () => {
    const err = validate();
    if (err) return Alert.alert('Validation Error', err);

    const isoDate = buildISO(dateStr, timeStr);
    if (!isoDate) return Alert.alert('Validation Error', 'Invalid date or time selected.');

    // Send only the fields the API expects — no emoji field
    dispatch(createEventRequest({
      title:       title.trim(),
      location:    location.trim(),
      date:        isoDate,
      category,
      description: desc.trim() || undefined,
    }));
  };

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>New Event</Text>
          <TouchableOpacity onPress={handleCreate} disabled={isCreating}>
            {isCreating
              ? <ActivityIndicator size="small" color={C.btnInactive} />
              : <Text style={s.post}>Post</Text>}
          </TouchableOpacity>
        </View>

        {/* ── Title ──────────────────────────────────────────────────────── */}
        <Text style={s.label}>Title *</Text>
        <TextInput
          style={s.input}
          placeholder="e.g. Sunday Football Match"
          placeholderTextColor={C.textMuted}
          value={title} onChangeText={setTitle} maxLength={100}
        />

        {/* ── Category ───────────────────────────────────────────────────── */}
        <Text style={s.label}>Category *</Text>
        <View style={s.chips}>
          {CATS.map(({ key, emoji }) => (
            <TouchableOpacity
              key={key}
              style={[s.chip, category === key && s.chipOn]}
              onPress={() => setCategory(key)}>
              <Text style={s.chipEmoji}>{emoji}</Text>
              <Text style={[s.chipTxt, category === key && s.chipTxtOn]}>{key}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Description ────────────────────────────────────────────────── */}
        <Text style={s.label}>Description</Text>
        <TextInput
          style={[s.input, s.textArea]}
          placeholder="What's this event about?"
          placeholderTextColor={C.textMuted}
          value={desc} onChangeText={setDesc}
          multiline numberOfLines={4}
          textAlignVertical="top" maxLength={500}
        />

        {/* ── Location ───────────────────────────────────────────────────── */}
        <Text style={s.label}>Location *</Text>
        <View style={s.locRow}>
          <TextInput
            style={[s.input, { flex: 1, marginBottom: 0 }]}
            placeholder="e.g. Central Park Ground"
            placeholderTextColor={C.textMuted}
            value={location} onChangeText={setLocation}
          />
          <View style={s.locIcon}>
            <Icon name="map-marker" size={22} color={C.btnInactive} />
          </View>
        </View>

        {/* ── Date & Time ────────────────────────────────────────────────── */}
        <Text style={[s.label, { marginTop: 16 }]}>Date & Time *</Text>
        <View style={s.dtRow}>
          {/* Date button */}
          <TouchableOpacity
            style={[s.dtBtn, showDate && s.dtBtnActive]}
            onPress={() => { setShowDate(v => !v); setShowTime(false); }}>
            <Icon name="calendar" size={16} color={showDate ? C.btnActive : C.textMuted} />
            <Text style={[s.dtTxt, !!dateStr && s.dtTxtFilled]}>{displayDate(dateStr)}</Text>
          </TouchableOpacity>

          {/* Time button */}
          <TouchableOpacity
            style={[s.dtBtn, showTime && s.dtBtnActive]}
            onPress={() => { setShowTime(v => !v); setShowDate(false); }}>
            <Icon name="clock-outline" size={16} color={showTime ? C.btnActive : C.textMuted} />
            <Text style={[s.dtTxt, !!timeStr && s.dtTxtFilled]}>{displayTime(timeStr)}</Text>
          </TouchableOpacity>
        </View>

        {/* Inline calendar */}
        {showDate && (
          <InlineDatePicker
            value={dateStr}
            onChange={setDateStr}
            onClose={() => setShowDate(false)}
          />
        )}

        {/* Inline time picker */}
        {showTime && (
          <InlineTimePicker
            value={timeStr}
            onChange={setTimeStr}
            onClose={() => setShowTime(false)}
          />
        )}

        {/* Date/time preview */}
        {dateStr && timeStr && (
          <View style={s.dtPreview}>
            <Icon name="check-circle" size={14} color={C.success} />
            <Text style={s.dtPreviewTxt}>
              {displayDate(dateStr)} at {displayTime(timeStr)}
            </Text>
          </View>
        )}

        {/* ── Submit ─────────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[s.submitBtn, isCreating && { opacity: 0.7 }]}
          onPress={handleCreate}
          disabled={isCreating}
          activeOpacity={0.85}>
          {isCreating
            ? <ActivityIndicator color={C.textWhite} />
            : <><Text style={s.submitTxt}>Create Event  </Text>
               <Icon name="arrow-right" size={18} color={C.textWhite} /></>}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 20, paddingBottom: 60 },

  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  cancel:      { fontSize: 15, color: C.textMuted },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.textPrimary },
  post:        { fontSize: 15, color: C.btnInactive, fontWeight: '700' },

  label: { fontSize: 13, fontWeight: '600', color: C.textSecondary, marginBottom: 8, marginTop: 4 },

  input: {
    backgroundColor: C.bgCard, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 14, color: C.textPrimary,
    marginBottom: 16, borderWidth: 1, borderColor: C.border,
  },
  textArea: { height: 100, paddingTop: 14 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border,
  },
  chipOn:     { backgroundColor: C.bgMuted, borderColor: C.btnActive },
  chipEmoji:  { fontSize: 14 },
  chipTxt:    { fontSize: 12, color: C.textMuted },
  chipTxtOn:  { color: C.btnActive, fontWeight: '600' },

  locRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 0 },
  locIcon: {
    width: 50, height: 50, backgroundColor: C.bgCard,
    borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },

  dtRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  dtBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.bgCard, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: C.border,
  },
  dtBtnActive: { borderColor: C.btnActive, backgroundColor: '#EFF6FF' },
  dtTxt:       { fontSize: 13, color: C.textMuted, flex: 1 },
  dtTxtFilled: { color: C.textPrimary, fontWeight: '600' },
  dtPreview:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  dtPreviewTxt: { fontSize: 12, color: C.success, fontWeight: '500' },

  submitBtn: {
    backgroundColor: C.btnInactive, borderRadius: 16, height: 56,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 4, marginTop: 16,
  },
  submitTxt: { fontSize: 16, fontWeight: '700', color: C.textWhite },
});

// ─── Date picker styles ───────────────────────────────────────────────────────

const dp = StyleSheet.create({
  container: {
    backgroundColor: C.bgCard, borderRadius: 18,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
  },
  nav:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn:    { padding: 6 },
  navTitle:  { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  row:       { flexDirection: 'row', marginBottom: 6 },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 11, color: C.textMuted, fontWeight: '600' },
  grid:      { flexDirection: 'row', flexWrap: 'wrap' },
  cell:      { width: `${100 / 7}%`, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  cellSelected: { backgroundColor: C.btnActive, borderRadius: 100 },
  cellPast:     { opacity: 0.3 },
  cellTxt:      { fontSize: 13, color: C.textPrimary },
  cellTxtSelected: { color: C.textWhite, fontWeight: '700' },
  cellTxtPast:  { color: C.textMuted },
});

// ─── Time picker styles ───────────────────────────────────────────────────────

const tp = StyleSheet.create({
  container: {
    backgroundColor: C.bgCard, borderRadius: 18,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
  },
  title: { fontSize: 15, fontWeight: '700', color: C.textPrimary, marginBottom: 14, textAlign: 'center' },
  row:   { marginBottom: 16 },
  lbl:   { fontSize: 12, fontWeight: '600', color: C.textSecondary, marginBottom: 8 },

  scroller:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  scrollItem: {
    width: 40, height: 40, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: C.bgMuted, borderWidth: 1, borderColor: C.border,
  },
  scrollItemOn:  { backgroundColor: C.btnActive, borderColor: C.btnActive },
  scrollTxt:     { fontSize: 13, color: C.textSecondary, fontWeight: '600' },
  scrollTxtOn:   { color: C.textWhite },

  minRow: { flexDirection: 'row', gap: 10 },
  minBtn: {
    flex: 1, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: C.bgMuted, borderWidth: 1, borderColor: C.border,
  },
  minBtnOn:  { backgroundColor: C.btnActive, borderColor: C.btnActive },
  minTxt:    { fontSize: 14, color: C.textSecondary, fontWeight: '600' },
  minTxtOn:  { color: C.textWhite },

  ampmRow: { flexDirection: 'row', gap: 10 },
  ampmBtn: {
    flex: 1, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: C.bgMuted, borderWidth: 1, borderColor: C.border,
  },
  ampmOn:    { backgroundColor: C.btnActive, borderColor: C.btnActive },
  ampmTxt:   { fontSize: 14, fontWeight: '700', color: C.textSecondary },
  ampmTxtOn: { color: C.textWhite },

  confirmBtn: {
    backgroundColor: C.btnInactive, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center', marginTop: 4,
  },
  confirmTxt: { fontSize: 14, fontWeight: '700', color: C.textWhite },
});
