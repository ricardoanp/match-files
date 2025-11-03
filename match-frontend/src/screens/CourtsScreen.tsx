import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAppStore } from '../store/appStore.js';
import { Court } from '../types.js';

export const CourtsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { courts, isLoading, error, fetchCourts } = useAppStore();
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCourts();
  }, [selectedSport]);

  const loadCourts = async () => {
    try {
      await fetchCourts(selectedSport ? { sport: selectedSport } : {});
    } catch (error) {
      console.error('Failed to load courts:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadCourts();
    } finally {
      setRefreshing(false);
    }
  };

  const handleCourtPress = (court: Court) => {
    navigation.navigate('CourtDetail', { courtId: court.id });
  };

  const renderCourt = ({ item }: { item: Court }) => (
    <TouchableOpacity
      style={styles.courtCard}
      onPress={() => handleCourtPress(item)}
    >
      <View style={styles.courtHeader}>
        <Text style={styles.courtName}>{item.name}</Text>
        <Text style={styles.courtPartner}>{item.partnerName}</Text>
      </View>

      <View style={styles.courtInfo}>
        <Text style={styles.infoLabel}>Endereço</Text>
        <Text style={styles.infoText}>
          {item.address.street}, {item.address.number}
        </Text>
      </View>

      <View style={styles.courtFooter}>
        <View style={styles.sportsContainer}>
          {item.sports.map((sport) => (
            <View key={sport} style={styles.sportTag}>
              <Text style={styles.sportTagText}>{sport}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && courts.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quadras Perto de Você</Text>
      </View>

      <View style={styles.filterContainer}>
        {['beach_tennis', 'padel', 'volei_praia'].map((sport) => (
          <TouchableOpacity
            key={sport}
            style={[
              styles.filterChip,
              selectedSport === sport && styles.filterChipActive,
            ]}
            onPress={() => setSelectedSport(selectedSport === sport ? null : sport)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedSport === sport && styles.filterChipTextActive,
              ]}
            >
              {sport}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={courts}
        renderItem={renderCourt}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma quadra encontrada</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF3CD',
    marginHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: '#856404',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  courtCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courtHeader: {
    marginBottom: 12,
  },
  courtName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  courtPartner: {
    fontSize: 12,
    color: '#999',
  },
  courtInfo: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
  },
  courtFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sportsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  sportTag: {
    backgroundColor: '#E8F4FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sportTagText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
