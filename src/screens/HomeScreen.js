import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { api } from '../api';
import { useCart } from '../context/CartContext';

const PLACEHOLDER_IMG = 'https://via.placeholder.com/120x120?text=Producto';

export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [catRes, prodRes, featRes] = await Promise.all([
        api.getCategories(),
        api.getProducts(),
        api.getProducts({ featured: 'true' }),
      ]);
      setCategories(catRes);
      setProducts(prodRes);
      setFeatured(featRes);
    } catch (e) {
      console.warn('Error cargando datos:', e.message);
    } finally {
      setLoading(false);
    }
  }

  const onSearch = () => {
    if (!search.trim()) return loadData();
    setLoading(true);
    api.getProducts({ search: search.trim() })
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => navigation.navigate('ProductList', { categoryId: item.category_id, title: item.name })}
    >
      <View style={styles.categoryIcon}>
        <Text style={styles.categoryEmoji}>{getCategoryEmoji(item.name)}</Text>
      </View>
      <Text style={styles.categoryName} numberOfLines={1}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderProduct = ({ item }) => {
    const price = item.offer_price ?? item.price;
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => addToCart(item.product_id)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: item.image_url || PLACEHOLDER_IMG }} style={styles.productImage} />
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productPrice}>${Number(price).toFixed(2)}</Text>
      </TouchableOpacity>
    );
  };

  if (loading && categories.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0a6846" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>D1Shop</Text>
      <TextInput
        style={styles.search}
        placeholder="Buscar productos..."
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={onSearch}
        returnKeyType="search"
      />

      <Text style={styles.sectionTitle}>Categorías</Text>
      <FlatList
        data={categories}
        keyExtractor={(c) => String(c.category_id)}
        renderItem={renderCategory}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesList}
      />

      <Text style={styles.sectionTitle}>Ofertas Destacadas</Text>
      <FlatList
        data={featured.length ? featured : products.slice(0, 4)}
        keyExtractor={(p) => String(p.product_id)}
        renderItem={renderProduct}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productsList}
      />

      <Text style={styles.sectionTitle}>Productos</Text>
      <View style={styles.productGrid}>
        {products.map((p) => {
          const price = p.offer_price ?? p.price;
          return (
            <TouchableOpacity
              key={p.product_id}
              style={styles.productCardGrid}
              onPress={() => addToCart(p.product_id)}
            >
              <Image source={{ uri: p.image_url || PLACEHOLDER_IMG }} style={styles.productImageSmall} />
              <Text style={styles.productNameSmall} numberOfLines={2}>{p.name}</Text>
              <Text style={styles.productPriceSmall}>${Number(price).toFixed(2)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

function getCategoryEmoji(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('electr')) return '📱';
  if (n.includes('moda')) return '👕';
  if (n.includes('hogar')) return '🏠';
  if (n.includes('belleza')) return '✨';
  return '🛒';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { paddingBottom: 24 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0a6846', marginHorizontal: 16, marginTop: 16 },
  search: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginHorizontal: 16, marginTop: 20 },
  categoriesList: { paddingHorizontal: 12, paddingVertical: 12, gap: 12 },
  categoryCard: {
    width: 90,
    marginHorizontal: 6,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
  },
  categoryIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e8f5e9', justifyContent: 'center', alignItems: 'center' },
  categoryEmoji: { fontSize: 24 },
  categoryName: { fontSize: 12, marginTop: 6, color: '#333' },
  productsList: { paddingHorizontal: 12, paddingVertical: 12 },
  productCard: {
    width: 160,
    marginHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  productImage: { width: 120, height: 120, borderRadius: 8, backgroundColor: '#eee' },
  productName: { fontSize: 14, marginTop: 6, color: '#333' },
  productPrice: { fontSize: 16, fontWeight: 'bold', color: '#0a6846', marginTop: 4 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, justifyContent: 'space-between' },
  productCardGrid: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  productImageSmall: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#eee' },
  productNameSmall: { fontSize: 12, marginTop: 4, color: '#333' },
  productPriceSmall: { fontSize: 14, fontWeight: 'bold', color: '#0a6846', marginTop: 2 },
});
