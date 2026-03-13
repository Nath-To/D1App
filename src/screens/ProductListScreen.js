import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { api } from '../api';
import { useCart } from '../context/CartContext';

const PLACEHOLDER_IMG = 'https://via.placeholder.com/120x120?text=Producto';

export default function ProductListScreen({ route, navigation }) {
  const { categoryId, title } = route.params || {};
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const params = categoryId ? { category_id: categoryId } : {};
    api.getProducts(params)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [categoryId]);

  const renderItem = ({ item }) => {
    const price = item.offer_price ?? item.price;
    return (
      <TouchableOpacity style={styles.card} onPress={() => addToCart(item.product_id)}>
        <Image source={{ uri: item.image_url || PLACEHOLDER_IMG }} style={styles.image} />
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.price}>${Number(price).toFixed(2)}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0a6846" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title || 'Productos'}</Text>
      <FlatList
        data={products}
        keyExtractor={(p) => String(p.product_id)}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '600', margin: 16, color: '#333' },
  list: { padding: 12, paddingBottom: 24 },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  image: { width: 100, height: 100, borderRadius: 8, backgroundColor: '#eee' },
  name: { fontSize: 14, marginTop: 6, color: '#333' },
  price: { fontSize: 16, fontWeight: 'bold', color: '#0a6846', marginTop: 4 },
});
