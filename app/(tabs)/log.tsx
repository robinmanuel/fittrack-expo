import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, StatusBar,
} from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { useRecords } from "../../hooks/useRecords";
import RecordRow from "../../components/RecordRow";
import LogEntryModal from "../../components/LogEntryModal";
import { FitnessRecord, NewRecord } from "../../lib/types";
import { shadow } from "../../lib/theme";

export default function LogScreen() {
  const { colors, scheme } = useTheme();
  const { records, loading, add, update, remove } = useRecords();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FitnessRecord | null>(null);

  const handleSave = async (record: NewRecord) => {
    if (editing) {
      await update(editing.id, {
        calories: record.calories ?? undefined,
        steps: record.steps ?? undefined,
        weight: record.weight ?? undefined,
      });
      setEditing(null);
    } else {
      await add(record);
    }
    setModalOpen(false);
  };

  const openEdit = (r: FitnessRecord) => {
    setEditing(r);
    setModalOpen(true);
  };

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>LOG</Text>
          <Text style={[styles.subtitle, { color: colors.text2 }]}>
            {records.length} ENTRIES
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.accent, borderColor: colors.border }, shadow]}
          onPress={openAdd}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>NEW</Text>
        </TouchableOpacity>
      </View>

      {records.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: colors.text2 }]}>NO ENTRIES YET</Text>
          <Text style={[styles.emptyHint, { color: colors.text2 }]}>// start logging to see your data</Text>
          <TouchableOpacity
            style={[styles.emptyBtn, { backgroundColor: colors.accent, borderColor: colors.border }, shadow]}
            onPress={openAdd}
          >
            <Text style={styles.emptyBtnText}>LOG FIRST ENTRY →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={r => String(r.id)}
          renderItem={({ item }) => (
            <RecordRow
              record={item}
              onEdit={openEdit}
              onDelete={remove}
            />
          )}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={() => {}}
        />
      )}

      <LogEntryModal
        visible={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        existing={editing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    borderBottomWidth: 3,
  },
  title: { fontFamily: "BebasNeue", fontSize: 32, letterSpacing: 2, lineHeight: 34 },
  subtitle: { fontFamily: "SpaceMono", fontSize: 10, letterSpacing: 1 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  addBtnText: { fontFamily: "BebasNeue", fontSize: 18, color: "#fff", letterSpacing: 1.2 },
  list: { padding: 16, paddingBottom: 40 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyTitle: { fontFamily: "BebasNeue", fontSize: 32 },
  emptyHint: { fontFamily: "SpaceMono", fontSize: 11 },
  emptyBtn: { borderWidth: 2, paddingVertical: 12, paddingHorizontal: 24, marginTop: 8 },
  emptyBtnText: { fontFamily: "BebasNeue", fontSize: 20, color: "#fff", letterSpacing: 1.5 },
});
