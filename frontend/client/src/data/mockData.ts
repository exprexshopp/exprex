import { Category, SubCategory, Shop, Product, Review, Favorite, ProductAnalytics, ModerationLog, CustomUser } from '../types';

export const CITIES = [
  'Douala', 'Yaounde', 'Bafoussam', 'Bamenda', 'Garoua',
  'Maroua', 'Ngaoundere', 'Buea', 'Limbe', 'Kribi',
];

export const INITIAL_USERS: CustomUser[] = [
  {
    id: 'usr_customer_1', email: 'client@express-shop.cm', username: 'mfeugang',
    first_name: 'Marc', last_name: 'Feugang', role: 'CUSTOMER', gender: 'M',
    password: 'password123', permissions: ['view_catalog', 'create_reviews', 'add_favorites'],
  },
  {
    id: 'usr_seller_1', email: 'vendeur.douala@express-shop.cm', username: 'tek_empire',
    first_name: 'Paul', last_name: 'Atangana', role: 'SELLER', gender: 'M',
    password: 'password123', permissions: ['manage_own_shop', 'manage_own_products', 'view_analytics'],
  },
  {
    id: 'usr_seller_2', email: 'mode.yaounde@express-shop.cm', username: 'chama_chic',
    first_name: 'Chantal', last_name: 'Eboa', role: 'SELLER', gender: 'F',
    password: 'password123', permissions: ['manage_own_shop', 'manage_own_products', 'view_analytics'],
  },
  {
    id: 'usr_seller_3', email: 'bio.buea@express-shop.cm', username: 'mount_cam_spices',
    first_name: 'Nkem', last_name: 'Tanyi', role: 'SELLER', gender: 'M',
    password: 'password123', permissions: ['manage_own_shop', 'manage_own_products', 'view_analytics'],
  },
  {
    id: 'usr_admin', email: 'ghens@express-shop.cm', username: 'ghens',
    first_name: 'Ghens', last_name: 'Administrator', role: 'ADMIN', is_staff: true,
    password: 'ghens.0#', permissions: ['all_permissions', 'validate_shops', 'manage_users', 'manage_categories', 'moderate_products'],
  },
  {
    id: 'usr_admin_2', email: 'admin@express-shop.cm', username: 'superadmin',
    first_name: 'Staff', last_name: 'eXpress Admin', role: 'ADMIN', is_staff: true,
    password: 'ghens.0#', permissions: ['all_permissions', 'validate_shops', 'manage_users', 'manage_categories', 'moderate_products'],
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'Téléphones & Accessoires', slug: 'telephones-accessoires', is_active: true },
  { id: 'cat_2', name: 'Mode & Vêtements', slug: 'mode-vetements', is_active: true },
  { id: 'cat_3', name: 'Beauté & Cosmétiques', slug: 'beaute-cosmetiques', is_active: true },
  { id: 'cat_4', name: 'Électronique & Informatique', slug: 'electronique-informatique', is_active: true },
  { id: 'cat_5', name: 'Électroménager', slug: 'electromenager', is_active: true },
  { id: 'cat_6', name: 'Auto & Moto', slug: 'auto-moto', is_active: true },
  { id: 'cat_7', name: 'Alimentation & Supermarché', slug: 'alimentation-supermarche', is_active: true },
];

export const INITIAL_SUBCATEGORIES: SubCategory[] = [
  { id: 'sub_1', category_id: 'cat_1', category_name: 'Téléphones & Accessoires', name: 'Smartphones', slug: 'smartphones', is_active: true },
  { id: 'sub_2', category_id: 'cat_1', category_name: 'Téléphones & Accessoires', name: 'Coques & Protections', slug: 'coques-protections', is_active: true },
  { id: 'sub_3', category_id: 'cat_1', category_name: 'Téléphones & Accessoires', name: 'Chargeurs & Câbles', slug: 'chargeurs-cables', is_active: true },
  { id: 'sub_4', category_id: 'cat_1', category_name: 'Téléphones & Accessoires', name: 'Écouteurs & Casques', slug: 'ecouteurs-casques', is_active: true },
  { id: 'sub_5', category_id: 'cat_2', category_name: 'Mode & Vêtements', name: 'Homme', slug: 'homme', is_active: true },
  { id: 'sub_6', category_id: 'cat_2', category_name: 'Mode & Vêtements', name: 'Femme', slug: 'femme', is_active: true },
  { id: 'sub_7', category_id: 'cat_2', category_name: 'Mode & Vêtements', name: 'Chaussures', slug: 'chaussures', is_active: true },
  { id: 'sub_8', category_id: 'cat_2', category_name: 'Mode & Vêtements', name: 'Accessoires', slug: 'accessoires-mode', is_active: true },
  { id: 'sub_9', category_id: 'cat_3', category_name: 'Beauté & Cosmétiques', name: 'Maquillage', slug: 'maquillage', is_active: true },
  { id: 'sub_10', category_id: 'cat_3', category_name: 'Beauté & Cosmétiques', name: 'Soins du visage', slug: 'soins-visage', is_active: true },
  { id: 'sub_11', category_id: 'cat_3', category_name: 'Beauté & Cosmétiques', name: 'Parfums', slug: 'parfums', is_active: true },
  { id: 'sub_12', category_id: 'cat_4', category_name: 'Électronique & Informatique', name: 'Ordinateurs', slug: 'ordinateurs', is_active: true },
  { id: 'sub_13', category_id: 'cat_4', category_name: 'Électronique & Informatique', name: 'Gaming', slug: 'gaming', is_active: true },
  { id: 'sub_14', category_id: 'cat_7', category_name: 'Alimentation & Supermarché', name: 'Produits locaux', slug: 'produits-locaux', is_active: true },
  { id: 'sub_15', category_id: 'cat_7', category_name: 'Alimentation & Supermarché', name: 'Boissons', slug: 'boissons', is_active: true },
];

export const INITIAL_SHOPS: Shop[] = [
  {
    id: 'shop_1', owner_id: 'usr_seller_1', owner_email: 'vendeur.douala@express-shop.cm',
    name: 'Tek Empire Douala', slug: 'tek-empire-douala',
    description: "Vente de smartphones scellés, accessoires d'origine et gadgets high-tech garantis 1 an à Akwa, Douala.",
    city: 'Douala', location: 'Akwa, Boulevard de la Liberté, face Pharmacie du Centre',
    phone: '+237699001122', whatsapp_number: '237699001122',
    logo: 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&w=300&q=80',
    theme: 'modern', custom_theme_color: '#0284C7',
    facebook: 'https://facebook.com/tekempiredouala', instagram: 'https://instagram.com/tekempire.cm',
    hours: {
      monday: { opening_time: '08:00', closing_time: '19:00', is_closed: false },
      tuesday: { opening_time: '08:00', closing_time: '19:00', is_closed: false },
      wednesday: { opening_time: '08:00', closing_time: '19:00', is_closed: false },
      thursday: { opening_time: '08:00', closing_time: '19:00', is_closed: false },
      friday: { opening_time: '08:00', closing_time: '19:00', is_closed: false },
      saturday: { opening_time: '08:30', closing_time: '18:00', is_closed: false },
      sunday: { opening_time: null, closing_time: null, is_closed: true },
    },
    status: 'ACTIVE', is_active: true, created_at: '2026-06-10T10:00:00Z',
  },
  {
    id: 'shop_2', owner_id: 'usr_seller_2', owner_email: 'mode.yaounde@express-shop.cm',
    name: 'Chama Chic Yaoundé', slug: 'chama-chic-yaounde',
    description: 'Boutique de vêtements tendance, robes de soirée, tenues africaines chics et sacs de luxe à Yaoundé.',
    city: 'Yaounde', location: 'Bastos, avenue Rosa Parks, à côté de la boulangerie Calafatas',
    phone: '+237677334455', whatsapp_number: '237677334455',
    logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    theme: 'elegant', custom_theme_color: '#881337',
    facebook: 'https://facebook.com/chamachicyaounde', instagram: 'https://instagram.com/chamachic.cm',
    hours: {
      monday: { opening_time: '09:00', closing_time: '19:30', is_closed: false },
      tuesday: { opening_time: '09:00', closing_time: '19:30', is_closed: false },
      wednesday: { opening_time: '09:00', closing_time: '19:30', is_closed: false },
      thursday: { opening_time: '09:00', closing_time: '19:30', is_closed: false },
      friday: { opening_time: '09:00', closing_time: '20:00', is_closed: false },
      saturday: { opening_time: '09:00', closing_time: '20:00', is_closed: false },
      sunday: { opening_time: '12:00', closing_time: '17:00', is_closed: false },
    },
    status: 'ACTIVE', is_active: true, created_at: '2026-06-15T14:30:00Z',
  },
  {
    id: 'shop_3', owner_id: 'usr_seller_3', owner_email: 'bio.buea@express-shop.cm',
    name: 'Mount Cam Bio & Spices', slug: 'mount-cam-bio-spices',
    description: 'Épices naturelles du Cameroun, poivre blanc de Penja certifié, miels sauvages et cosmétiques bio de Buea.',
    city: 'Buea', location: 'Molyko, near UB Junction, Buea',
    phone: '+237655889900', whatsapp_number: '237655889900',
    logo: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
    theme: 'nature', custom_theme_color: '#166534',
    facebook: 'https://facebook.com/mountcambio', instagram: 'https://instagram.com/mountcam_spices',
    hours: {
      monday: { opening_time: '07:30', closing_time: '18:30', is_closed: false },
      tuesday: { opening_time: '07:30', closing_time: '18:30', is_closed: false },
      wednesday: { opening_time: '07:30', closing_time: '18:30', is_closed: false },
      thursday: { opening_time: '07:30', closing_time: '18:30', is_closed: false },
      friday: { opening_time: '07:30', closing_time: '18:30', is_closed: false },
      saturday: { opening_time: '08:00', closing_time: '17:00', is_closed: false },
      sunday: { opening_time: null, closing_time: null, is_closed: true },
    },
    status: 'ACTIVE', is_active: true, created_at: '2026-06-20T09:15:00Z',
  },
  {
    id: 'shop_4', owner_id: 'usr_seller_1', owner_email: 'vendeur.douala@express-shop.cm',
    name: 'Bafoussam Shoes & Sneaker', slug: 'bafoussam-shoes-sneaker',
    description: 'Vente de chaussures de sport, mocassins en cuir véritable et sneakers de marque à Bafoussam.',
    city: 'Bafoussam', location: 'Marché A, Entrée principale, Bafoussam',
    phone: '+237699887766', whatsapp_number: '237699887766',
    logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80',
    theme: 'vif', custom_theme_color: '#EA580C',
    hours: {
      monday: { opening_time: '08:00', closing_time: '18:00', is_closed: false },
      tuesday: { opening_time: '08:00', closing_time: '18:00', is_closed: false },
      wednesday: { opening_time: '08:00', closing_time: '18:00', is_closed: false },
      thursday: { opening_time: '08:00', closing_time: '18:00', is_closed: false },
      friday: { opening_time: '08:00', closing_time: '18:00', is_closed: false },
      saturday: { opening_time: '08:00', closing_time: '18:00', is_closed: false },
      sunday: { opening_time: null, closing_time: null, is_closed: true },
    },
    status: 'PENDING', is_active: false, created_at: '2026-07-24T16:20:00Z',
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1', shop_id: 'shop_1', shop_name: 'Tek Empire Douala', shop_slug: 'tek-empire-douala', shop_whatsapp: '237699001122',
    name: 'iPhone 15 Pro Max 256GB Titanium', slug: 'iphone-15-pro-max-256gb-titanium',
    description: "iPhone 15 Pro Max neuf scellé dans la boîte d'origine, couleur Titane Naturel. Garantie officielle Apple 12 mois. Livraison rapide disponible à Douala et Yaoundé.",
    price: 850000, image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
    category: 'Téléphones & Accessoires', subcategory_id: 'sub_1', subcategory_name: 'Smartphones',
    in_stock: true, created_at: '2026-06-11T08:00:00Z',
  },
  {
    id: 'prod_2', shop_id: 'shop_1', shop_name: 'Tek Empire Douala', shop_slug: 'tek-empire-douala', shop_whatsapp: '237699001122',
    name: 'Écouteurs AirPods Pro 2ème Génération', slug: 'ecouteurs-airpods-pro-2eme-generation',
    description: "Réduction active du bruit ambiant, boîtier MagSafe USB-C avec haut-parleur intégré, autonomie jusqu'à 30 heures.",
    price: 165000, image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=600&q=80',
    category: 'Téléphones & Accessoires', subcategory_id: 'sub_4', subcategory_name: 'Écouteurs & Casques',
    in_stock: true, created_at: '2026-06-12T09:00:00Z',
  },
  {
    id: 'prod_3', shop_id: 'shop_1', shop_name: 'Tek Empire Douala', shop_slug: 'tek-empire-douala', shop_whatsapp: '237699001122',
    name: 'Samsung Galaxy S24 Ultra 512GB Titanium Black', slug: 'samsung-galaxy-s24-ultra-512gb',
    description: 'Smartphone haut de gamme Samsung avec S-Pen intégré, capteur photo 200MP et Galaxy AI. État neuf scellé.',
    price: 790000, image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80',
    category: 'Téléphones & Accessoires', subcategory_id: 'sub_1', subcategory_name: 'Smartphones',
    in_stock: true, created_at: '2026-06-14T11:20:00Z',
  },
  {
    id: 'prod_4', shop_id: 'shop_2', shop_name: 'Chama Chic Yaoundé', shop_slug: 'chama-chic-yaounde', shop_whatsapp: '237677334455',
    name: 'Robe de Soirée Satinée Émeraude', slug: 'robe-de-soiree-satinee-emeraude',
    description: 'Sublime robe de soirée drapée en satin vert émeraude, fente élégante et dos nu raffiné. Idéale pour galas et cérémonies.',
    price: 45000, image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80',
    category: 'Mode & Vêtements', subcategory_id: 'sub_6', subcategory_name: 'Femme',
    in_stock: true, created_at: '2026-06-16T15:00:00Z',
  },
  {
    id: 'prod_5', shop_id: 'shop_2', shop_name: 'Chama Chic Yaoundé', shop_slug: 'chama-chic-yaounde', shop_whatsapp: '237677334455',
    name: 'Sac à Main Cuir Marron Artisanale', slug: 'sac-a-main-cuir-marron',
    description: 'Sac à main en cuir de vachette tanné végétal, finitions dorées, bandoulière amovible. Conçu pour durer.',
    price: 38000, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
    category: 'Mode & Vêtements', subcategory_id: 'sub_8', subcategory_name: 'Accessoires',
    in_stock: true, created_at: '2026-06-18T16:10:00Z',
  },
  {
    id: 'prod_6', shop_id: 'shop_3', shop_name: 'Mount Cam Bio & Spices', shop_slug: 'mount-cam-bio-spices', shop_whatsapp: '237655889900',
    name: 'Poivre Blanc de Penja IGP (Sachet 250g)', slug: 'poivre-blanc-de-penja-250g',
    description: 'Véritable Poivre Blanc de Penja réputé mondialement pour son arôme intense et ses notes boisées. Récolté à la main.',
    price: 8500, image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
    category: 'Alimentation & Supermarché', subcategory_id: 'sub_14', subcategory_name: 'Produits locaux',
    in_stock: true, created_at: '2026-06-21T10:00:00Z',
  },
  {
    id: 'prod_7', shop_id: 'shop_3', shop_name: 'Mount Cam Bio & Spices', shop_slug: 'mount-cam-bio-spices', shop_whatsapp: '237655889900',
    name: 'Beurre de Karité Pur du Nord Cameroun (500g)', slug: 'beurre-de-karite-pur-500g',
    description: 'Beurre de karité 100% naturel non raffiné. Nourrit intensément la peau, les cheveux et répare les peaux sèches.',
    price: 6000, image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=600&q=80',
    category: 'Beauté & Cosmétiques', subcategory_id: 'sub_10', subcategory_name: 'Soins du visage',
    in_stock: true, created_at: '2026-06-22T11:45:00Z',
  },
];

export const INITIAL_ANALYTICS: ProductAnalytics[] = [
  { id: 'an_1', product_id: 'prod_1', views_count: 342, whatsapp_clicks: 48, updated_at: '2026-07-25T18:00:00Z' },
  { id: 'an_2', product_id: 'prod_2', views_count: 189, whatsapp_clicks: 27, updated_at: '2026-07-25T18:00:00Z' },
  { id: 'an_3', product_id: 'prod_3', views_count: 275, whatsapp_clicks: 36, updated_at: '2026-07-25T18:00:00Z' },
  { id: 'an_4', product_id: 'prod_4', views_count: 215, whatsapp_clicks: 31, updated_at: '2026-07-25T18:00:00Z' },
  { id: 'an_5', product_id: 'prod_5', views_count: 140, whatsapp_clicks: 19, updated_at: '2026-07-25T18:00:00Z' },
  { id: 'an_6', product_id: 'prod_6', views_count: 420, whatsapp_clicks: 74, updated_at: '2026-07-25T18:00:00Z' },
  { id: 'an_7', product_id: 'prod_7', views_count: 190, whatsapp_clicks: 22, updated_at: '2026-07-25T18:00:00Z' },
];

export const INITIAL_REVIEWS: Review[] = [
  { id: 'rev_1', user_id: 'usr_customer_1', user_name: 'Marc Feugang', product_id: 'prod_1', rating: 5, comment: "Produit authentique scellé dans l'emballage d'origine ! Vendeur très réactif sur WhatsApp, livré en 2h à Akwa.", created_at: '2026-07-02T14:00:00Z' },
  { id: 'rev_2', user_id: 'usr_customer_1', user_name: 'Marc Feugang', product_id: 'prod_6', rating: 5, comment: 'Le vrai poivre de Penja ! Parfum incomparable dans mes sauces. Recommandé à 100%.', created_at: '2026-07-10T09:30:00Z' },
  { id: 'rev_3', user_id: 'usr_seller_2', user_name: 'Chantal Eboa', product_id: 'prod_2', rating: 4, comment: 'Excellente qualité sonore, suppression du bruit très efficace.', created_at: '2026-07-12T16:45:00Z' },
];

export const INITIAL_FAVORITES: Favorite[] = [
  { id: 'fav_1', user_id: 'usr_customer_1', product_id: 'prod_1', created_at: '2026-07-01T10:00:00Z' },
  { id: 'fav_2', user_id: 'usr_customer_1', product_id: 'prod_6', created_at: '2026-07-05T12:00:00Z' },
];

export const INITIAL_MODERATION_LOGS: ModerationLog[] = [
  { id: 'mod_1', shop_id: 'shop_1', shop_name: 'Tek Empire Douala', actor_email: 'admin@express-shop.cm', action: 'approve', note: "Boutique vérifiée avec pièce d'identité et localisation physique conforme.", created_at: '2026-06-10T11:00:00Z' },
  { id: 'mod_2', shop_id: 'shop_2', shop_name: 'Chama Chic Yaoundé', actor_email: 'admin@express-shop.cm', action: 'approve', note: 'Validation du compte vendeur et des canaux de contact.', created_at: '2026-06-15T15:00:00Z' },
  { id: 'mod_3', shop_id: 'shop_3', shop_name: 'Mount Cam Bio & Spices', actor_email: 'admin@express-shop.cm', action: 'approve', note: 'Conforme aux critères de la marketplace eXpress Shop.', created_at: '2026-06-20T10:00:00Z' },
];

