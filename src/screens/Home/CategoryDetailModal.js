import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors, Fonts, Radius, Shadow, Spacing } from '../../theme';
import { daysLeftInPeriod, formatDateFull, formatMonthYear } from '../../utils/dateUtils';
import { PremiumHaptics } from '../../utils/haptics';
import AddCategoryModal from './AddCategoryModal';
import AddTransactionModal from './AddTransactionModal';

function formatMoney(amount, currency) {
  return `${Number(amount || 0).toFixed(2)} ${currency || '€'}`;
}

export default function CategoryDetailModal({
  visible,
  category,
  transactions,
  categories,
  currency,
  onClose,
  onUpdateCategory,
  onDeleteCategory,
  onAddTransaction,
}) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  const categoryTransactions = useMemo(() => {
    if (!category) return [];
    return transactions
      .filter(tx => tx.category_id === category.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, category]);

  if (!category) return null;

  const leftAmount = (category.budget || 0) - (category.spent || 0);
  const periodLabel = category.cycle === 'weekly' ? 'This week' : formatMonthYear(new Date());

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View style={styles.titleRow}>
              <View style={[styles.iconBadge, { backgroundColor: category.color || Colors.accent }]}>
                <Text style={styles.iconBadgeText}>{category.icon || '•'}</Text>
              </View>
              <Text style={styles.title}>{category.name}</Text>
            </View>
            <View style={styles.topActions}>
              <Pressable
                onPress={() => {
                  PremiumHaptics.selection();
                  setShowEditModal(true);
                }}
                style={styles.actionCircle}
              >
                <Text style={styles.actionCircleText}>✎</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  PremiumHaptics.selection();
                  onClose();
                }}
                style={styles.actionCircle}
              >
                <Text style={styles.actionCircleText}>✕</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.headerBottomRow}>
            <View style={styles.periodBlock}>
              <View style={styles.periodDot} />
              <View>
                <Text style={styles.periodTitle}>{periodLabel}</Text>
                <Text style={styles.periodSub}>{daysLeftInPeriod(category.cycle || 'monthly')} days left</Text>
              </View>
            </View>
            <View style={styles.valuesBlock}>
              <Text style={styles.valueLine}>
                <Text style={styles.valueStrong}>{formatMoney(category.budget, currency)}</Text> budgeted
              </Text>
              <Text style={styles.valueLine}>
                <Text style={styles.valueStrong}>{formatMoney(leftAmount, currency)}</Text> left
              </Text>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {categoryTransactions.length > 0 ? (
            <View style={styles.transactionsCard}>
              {categoryTransactions.map(tx => (
                <View key={tx.id} style={styles.transactionRow}>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionName}>{tx.note || category.name}</Text>
                    <Text style={styles.transactionDate}>{formatDateFull(tx.date)}</Text>
                  </View>
                  <Text style={styles.transactionAmount}>{formatMoney(tx.amount, currency)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIllustration}>🏜️</Text>
              <Text style={styles.emptyText}>No transactions</Text>
            </View>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>

        <Pressable
          onPress={() => {
            PremiumHaptics.selection();
            setShowAddTransaction(true);
          }}
          style={styles.fab}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>

        <AddCategoryModal
          visible={showEditModal}
          mode="edit"
          initialValues={category}
          onClose={() => setShowEditModal(false)}
          onSave={(nextCategory) => {
            onUpdateCategory(nextCategory);
            setShowEditModal(false);
          }}
          onDelete={() => {
            onDeleteCategory(category.id);
            setShowEditModal(false);
            onClose();
          }}
        />

        <AddTransactionModal
          visible={showAddTransaction}
          onClose={() => setShowAddTransaction(false)}
          categories={categories}
          initial_category_id={category.id}
          onSave={(tx) => {
            onAddTransaction(tx);
            setShowAddTransaction(false);
          }}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  headerCard: {
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 24,
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 14,
    ...Shadow.soft,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 12 },
  iconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  iconBadgeText: { fontSize: 14 },
  title: { ...Fonts.sans, fontSize: 19, ...Fonts.bold, color: '#111111' },
  topActions: { flexDirection: 'row', gap: 10 },
  actionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCircleText: { fontSize: 14, color: '#666666' },
  headerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodBlock: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  periodDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#ECECEC',
  },
  periodTitle: { ...Fonts.sans, fontSize: 16, ...Fonts.bold, color: '#111111' },
  periodSub: { ...Fonts.sans, fontSize: 13, color: '#8B8B8B', marginTop: 2 },
  valuesBlock: { alignItems: 'flex-end' },
  valueLine: { ...Fonts.sans, fontSize: 14, color: '#8B8B8B', marginBottom: 4 },
  valueStrong: { ...Fonts.sans, fontSize: 18, ...Fonts.bold, color: '#111111' },
  scroll: { flexGrow: 1, paddingHorizontal: 12, paddingTop: 20 },
  transactionsCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  transactionInfo: { flex: 1, paddingRight: 10 },
  transactionName: { ...Fonts.sans, fontSize: 15, ...Fonts.medium, color: '#111111' },
  transactionDate: { ...Fonts.sans, fontSize: 12, color: '#8B8B8B', marginTop: 4 },
  transactionAmount: { ...Fonts.sans, fontSize: 15, ...Fonts.bold, color: '#111111' },
  emptyState: {
    flex: 1,
    minHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIllustration: { fontSize: 56, marginBottom: 14 },
  emptyText: { ...Fonts.sans, fontSize: 18, color: '#333333' },
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 26,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.medium,
  },
  fabText: { color: Colors.white, fontSize: 32, fontWeight: '300', marginTop: -2 },
});
