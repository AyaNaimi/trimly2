import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal, View, Text, Pressable, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors, Fonts, Radius, Shadow, Spacing } from '../theme';
import {
  addDays, daysInMonth, formatDateFull, formatMonthYear, todayISO,
} from '../utils/dateUtils';
import { PremiumHaptics } from '../utils/haptics';

const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function isoFromDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

export default function DatePickerModal({
  visible,
  value,
  onClose,
  onChange,
  title = 'Choisir une date',
}) {
  const today = todayISO();
  const initialDate = value || today;
  const [cursor, setCursor] = useState(new Date(initialDate));
  const [draftDate, setDraftDate] = useState(initialDate);

  useEffect(() => {
    if (!visible) return;
    setCursor(new Date(value || today));
    setDraftDate(value || today);
  }, [visible, value, today]);

  const selectedDate = draftDate || value || today;
  const month = cursor.getMonth();
  const year = cursor.getFullYear();

  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const offset = (firstDay.getDay() + 6) % 7;
    const totalDays = daysInMonth(year, month);
    const items = [];
    for (let i = 0; i < offset; i += 1) items.push(null);
    for (let day = 1; day <= totalDays; day += 1) {
      items.push(new Date(year, month, day));
    }
    while (items.length % 7 !== 0) items.push(null);
    return items;
  }, [month, year]);

  function pickDate(date) {
    const iso = isoFromDate(date);
    PremiumHaptics.selection();
    setDraftDate(iso);
  }

  function applyShortcut(daysOffset) {
    const nextDate = addDays(new Date(), daysOffset);
    pickDate(nextDate);
  }

  function confirmDate() {
    PremiumHaptics.success();
    onChange(selectedDate);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>{title}</Text>
              <Text style={styles.selectedLabel}>{formatDateFull(selectedDate)}</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeTxt}>x</Text>
              </Pressable>
              <Pressable onPress={confirmDate} style={styles.confirmBtn}>
                <Text style={styles.confirmTxt}>✓</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.shortcuts}>
            <Pressable onPress={() => applyShortcut(-7)} style={styles.shortcut}>
              <Text style={styles.shortcutText}>Semaine derniere</Text>
            </Pressable>
            <Pressable onPress={() => applyShortcut(0)} style={[styles.shortcut, styles.shortcutActive]}>
              <Text style={[styles.shortcutText, styles.shortcutTextActive]}>Cette semaine</Text>
            </Pressable>
            <Pressable onPress={() => applyShortcut(7)} style={styles.shortcut}>
              <Text style={styles.shortcutText}>Semaine prochaine</Text>
            </Pressable>
          </View>

          <View style={styles.monthHeader}>
            <Pressable onPress={() => setCursor(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} style={styles.navBtn}>
              <Text style={styles.navTxt}>{'<'}</Text>
            </Pressable>
            <Text style={styles.monthTitle}>{formatMonthYear(cursor)}</Text>
            <Pressable onPress={() => setCursor(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} style={styles.navBtn}>
              <Text style={styles.navTxt}>{'>'}</Text>
            </Pressable>
          </View>

          <View style={styles.weekHeader}>
            {WEEK_DAYS.map((day, index) => (
              <Text key={`weekday_${index}_${day}`} style={styles.weekLabel}>{day}</Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((date, index) => {
              if (!date) return <View key={`empty_${index}`} style={styles.dayCell} />;
              const iso = isoFromDate(date);
              const isSelected = iso === selectedDate;
              const isToday = iso === today;
              return (
                <Pressable
                  key={iso}
                  onPress={() => pickDate(date)}
                  style={styles.dayCell}
                >
                  <View style={[
                    styles.dayCircle,
                    isToday && styles.todayCircle,
                    isSelected && styles.selectedCircle,
                  ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isToday && styles.todayText,
                        isSelected && styles.selectedText,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.16)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    ...Shadow.premium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyebrow: {
    ...Fonts.sans,
    fontSize: 11,
    ...Fonts.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  selectedLabel: {
    ...Fonts.serif,
    fontSize: 20,
    color: Colors.text,
    marginTop: 6,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  closeTxt: {
    ...Fonts.sans,
    fontSize: 18,
    color: Colors.textSecondary,
  },
  confirmBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTxt: {
    ...Fonts.sans,
    fontSize: 17,
    ...Fonts.bold,
    color: '#16A34A',
  },
  shortcuts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  shortcut: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  shortcutActive: {
    backgroundColor: Colors.accent,
  },
  shortcutText: {
    ...Fonts.sans,
    fontSize: 11,
    ...Fonts.semiBold,
    color: Colors.text,
    textAlign: 'center',
  },
  shortcutTextActive: {
    color: Colors.white,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  navTxt: {
    ...Fonts.sans,
    fontSize: 20,
    color: Colors.text,
  },
  monthTitle: {
    ...Fonts.sans,
    fontSize: 15,
    ...Fonts.bold,
    color: Colors.text,
    textTransform: 'capitalize',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    ...Fonts.sans,
    fontSize: 12,
    ...Fonts.semiBold,
    color: Colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: {
    backgroundColor: Colors.accentSoft,
  },
  selectedCircle: {
    backgroundColor: Colors.accent,
  },
  dayText: {
    ...Fonts.sans,
    fontSize: 14,
    ...Fonts.medium,
    color: Colors.text,
  },
  todayText: {
    ...Fonts.bold,
    color: Colors.accent,
  },
  selectedText: {
    color: Colors.white,
    ...Fonts.bold,
  },
});
