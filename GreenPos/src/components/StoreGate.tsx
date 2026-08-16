import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { storeApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { shared } from '../sharedStyles';
import { colors } from '../theme';
import { Store } from '../types';

// Operational screens (Kasir, Pembayaran, Riwayat, EDC) all need to know
// which store they're working with. Kasir/ppic/store_manager already have
// one locked via user.storeId; admin/finance don't, so they pick once here
// and every tab shares the same resolved storeId.
export function StoreGate({
  children,
}: {
  children: (storeId: string) => React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const [picked, setPicked] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  const locked = !!user?.storeId;

  useEffect(() => {
    if (locked) {
      setLoading(false);
      return;
    }
    storeApi.list().then(list => {
      setStores(list);
      setLoading(false);
    });
  }, [locked]);

  if (locked) {
    return <>{children(user!.storeId)}</>;
  }

  if (loading) {
    return (
      <View style={shared.centerScreen}>
        <ActivityIndicator color={colors.register} />
      </View>
    );
  }

  if (picked) {
    return <>{children(picked)}</>;
  }

  return (
    <View style={shared.centerScreen}>
      <Text style={shared.pickerTitle}>Pilih store dulu</Text>
      <Text style={shared.pickerSubtitle}>
        Akun Anda tidak terkunci ke 1 store — pilih store yang ingin
        dikerjakan.
      </Text>
      {stores.map(s => (
        <TouchableOpacity
          key={s.id}
          style={{
            width: '100%',
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: '#1C1B181A',
            borderRadius: 8,
            padding: 12,
            marginBottom: 8,
          }}
          onPress={() => setPicked(s.id)}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink }}>
            {s.name}
          </Text>
          <Text style={{ fontSize: 12, color: colors.inkSoft, marginTop: 2 }}>
            {s.address}
          </Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={logout} style={{ marginTop: 20 }}>
        <Text style={shared.logoutLink}>Keluar</Text>
      </TouchableOpacity>
    </View>
  );
}
