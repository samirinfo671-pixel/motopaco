import db from './database.ts';
import bcrypt from 'bcryptjs';

export function seedDatabase() {
  // Check if already seeded by seeing if we have any categories
  const rowCount = db.prepare('SELECT count(*) as count FROM categories').get() as { count: number };
  if (rowCount.count > 0) {
    console.log('Database already has data. Skipping seed.');
    return;
  }

  console.log('Seeding database with default MOTO PACO data...');

  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertCategory = db.prepare(`
    INSERT INTO categories (name, slug, parent_id, image_url, meta_title, meta_description, sort_order, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertBrand = db.prepare(`
    INSERT INTO brands (name, slug, logo_url, is_featured)
    VALUES (?, ?, ?, ?)
  `);

  const insertProduct = db.prepare(`
    INSERT INTO products (name, slug, description, short_description, category_id, brand_id, base_price, sale_price, status, meta_title, meta_description, sold_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertProductImage = db.prepare(`
    INSERT INTO product_images (product_id, url, is_primary, sort_order)
    VALUES (?, ?, ?, ?)
  `);

  const insertProductVariant = db.prepare(`
    INSERT INTO product_variants (product_id, size, color, sku, stock, low_stock_threshold)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertBundle = db.prepare(`
    INSERT INTO bundles (name, discount_percent, fixed_price, is_active)
    VALUES (?, ?, ?, ?)
  `);

  const insertBundleProduct = db.prepare(`
    INSERT INTO bundle_products (bundle_id, product_id)
    VALUES (?, ?)
  `);

  const insertPromo = db.prepare(`
    INSERT INTO promo_codes (code, discount_type, discount_value, min_order, usage_limit, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertReview = db.prepare(`
    INSERT INTO reviews (product_id, user_id, rating, title, body, is_verified)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Run in transaction
  const transaction = db.transaction(() => {
    // 1. Create Admin & Customer User
    const adminHash = bcrypt.hashSync('admin123', 10);
    const customerHash = bcrypt.hashSync('customer123', 10);
    insertUser.run('admin@packmoto.ma', adminHash, 'Pack', 'Moto', '+212600112233', 'admin');
    insertUser.run('client@packmoto.ma', customerHash, 'Samir', 'Alami', '+212644556677', 'customer');
    // 2. Parent Categories
    const catPiloteId = insertCategory.run('Équipement Pilote', 'equipement-pilote', null, 'https://picsum.photos/seed/pilote/600/400', 'Équipement Motard Maroc | Moto Paco', 'Achetez vos casques, gants et vestes de moto au meilleur prix au Maroc.', 1, 0).lastInsertRowid as number;
    const catPiecesId = insertCategory.run('Pièces & Accessoires', 'pieces-accessoires', null, 'https://picsum.photos/seed/pieces/600/400', 'Pièces Moto et Accessoires Maroc', 'Toutes les pièces détachées, kits chaîne et échappements pour votre moto.', 2, 0).lastInsertRowid as number;
    const catMotoId = insertCategory.run('Moto & Quad', 'moto-quad', null, 'https://picsum.photos/seed/motoquad/600/400', 'Moto & Quad Maroc', 'Découvrez notre univers Moto et Quad avec des accessoires dédiés.', 3, 0).lastInsertRowid as number;

    // Subcategories
    const subcats = [
      { name: 'Casques', slug: 'casques', parent: catPiloteId, is_featured: 1, image: '/uploads/cat-casques.png' },
      { name: 'Gants', slug: 'gants', parent: catPiloteId, is_featured: 1, image: '/uploads/cat-gants.png' },
      { name: 'Vestes & Blousons', slug: 'vestes-blousons', parent: catPiloteId, is_featured: 1, image: '/uploads/cat-vestes.png' },
      { name: 'Bottes', slug: 'bottes', parent: catPiloteId, is_featured: 0, image: null },
      { name: 'Pantalons', slug: 'pantalons', parent: catPiloteId },
      { name: 'Échappements', slug: 'echappements', parent: catPiecesId },
      { name: 'Kit Chaîne', slug: 'kit-chaine', parent: catPiecesId },
      { name: 'Bagagerie', slug: 'bagagerie', parent: catPiecesId },
      { name: 'Protections', slug: 'protections', parent: catPiecesId },
      { name: 'Sacoches', slug: 'sacoches', parent: catPiecesId },
      { name: 'Lunettes', slug: 'lunettes', parent: catPiloteId },
      { name: 'Accessoires USB', slug: 'accessoires-usb', parent: catPiecesId }
    ];

    const subcatIds: { [key: string]: number } = {};
    subcats.forEach((sub, idx) => {
      subcatIds[sub.slug] = insertCategory.run(
        sub.name,
        sub.slug,
        sub.parent,
        (sub as any).image || `https://picsum.photos/seed/${sub.slug}/600/600`,
        `${sub.name} Moto Maroc | Prix et Choix`,
        `Grand choix de ${sub.name} de moto au Maroc. Livraison rapide 24h-48h.`,
        idx + 1,
        (sub as any).is_featured || 0
      ).lastInsertRowid as number;
    });

    // 3. Brands
    const brandsData = [
      { name: 'AGV', slug: 'agv', is_featured: 1 },
      { name: 'TCX', slug: 'tcx', is_featured: 1 },
      { name: 'GIVI', slug: 'givi', is_featured: 1 },
      { name: 'DID', slug: 'did', is_featured: 1 },
      { name: '100%', slug: '100-percent', is_featured: 1 },
      { name: 'Akrapovic', slug: 'akrapovic', is_featured: 1 },
      { name: 'Kenny', slug: 'kenny', is_featured: 1 },
      { name: 'Fox Racing', slug: 'fox-racing', is_featured: 1 },
      { name: 'ODI', slug: 'odi', is_featured: 1 },
      { name: 'Dainese', slug: 'dainese', is_featured: 0 },
      { name: 'Alpinestars', slug: 'alpinestars', is_featured: 0 },
      { name: 'Shark', slug: 'shark', is_featured: 0 }
    ];

    const brandIds: { [key: string]: number } = {};
    brandsData.forEach(brand => {
      const rowId = insertBrand.run(
        brand.name,
        brand.slug,
        `https://picsum.photos/seed/brand-${brand.slug}/200/100`,
        brand.is_featured
      ).lastInsertRowid as number;
      brandIds[brand.slug] = rowId;
      brandIds[brand.name] = rowId;
    });

    // 4. Products (30 Items)
    const productsList = [
      // Casques
      {
        name: 'Casque AGV K6 S Noir Mat',
        slug: 'casque-agv-k6-s-noir-mat-maroc',
        short: 'Le casque intégral de route le plus léger au monde, polyvalent et ultra-sécurisé.',
        desc: 'Le casque AGV K6 S est le summum de la technologie routière de la marque italienne. Conçu en fibre de carbone-aramide, il offre une protection maximale pour un poids plume de 1220g. Son aérodynamisme a été étudié en soufflerie pour éliminer les turbulences à haute vitesse. Homologué ECE 22.06.',
        category: 'casques',
        brand: 'agv',
        price: 5200,
        sale_price: 4699,
        variants: [
          { size: 'S', color: 'Noir Mat', stock: 4 },
          { size: 'M', color: 'Noir Mat', stock: 2 },
          { size: 'L', color: 'Noir Mat', stock: 5 },
          { size: 'XL', color: 'Noir Mat', stock: 1 }
        ]
      },
      {
        name: 'Casque Shark Spartan GT Carbon',
        slug: 'casque-shark-spartan-gt-carbon-maroc',
        short: 'Casque intégral haut de gamme avec double écran solaire et finitions carbone apparent.',
        desc: 'Le Shark Spartan GT Carbon repousse les limites de la sécurité et du confort. Sa structure composite carbone et fibre de verre associée à un EPS multi-densités offre un niveau de protection optimal. Il possède un écran anti-rayures classe optique 1 avec Pinlock inclus.',
        category: 'casques',
        brand: 'shark',
        price: 4500,
        sale_price: null,
        variants: [
          { size: 'M', color: 'Carbon', stock: 3 },
          { size: 'L', color: 'Carbon', stock: 6 },
          { size: 'XL', color: 'Carbon', stock: 0 } // Out of stock
        ]
      },
      {
        name: 'Casque AGV Tourmodular',
        slug: 'casque-agv-tourmodular-maroc',
        short: 'Le casque modulable ultra-protecteur pour les longs trajets routiers.',
        desc: 'Homologué double P/J, ce casque modulable offre le confort d\'un casque de tourisme avec la sécurité d\'un intégral de pointe. Entièrement conçu pour accueillir le système de communication intégré AGV INSYDE.',
        category: 'casques',
        brand: 'agv',
        price: 6400,
        sale_price: 5900,
        variants: [
          { size: 'M', color: 'Gris Nardo', stock: 3 },
          { size: 'L', color: 'Gris Nardo', stock: 4 }
        ]
      },
      // Gants
      {
        name: 'Gants Dainese Carbon 4 Long',
        slug: 'gants-dainese-carbon-4-long-maroc',
        short: 'Gants racing en cuir de chèvre avec coques de protection en carbone sur les articulations.',
        desc: 'Les Dainese Carbon 4 Long sont des gants de moto sportifs certifiés CE. Conçus en cuir de chèvre avec des renforts sur la paume, ils offrent une sensibilité maximale. Les inserts en fibre de carbone sur les phalanges garantissent une protection anti-impact d\'élite.',
        category: 'gants',
        brand: 'dainese',
        price: 1800,
        sale_price: 1599,
        variants: [
          { size: 'S', color: 'Noir/Rouge', stock: 8 },
          { size: 'M', color: 'Noir/Rouge', stock: 10 },
          { size: 'L', color: 'Noir/Rouge', stock: 12 },
          { size: 'XL', color: 'Noir/Rouge', stock: 3 }
        ]
      },
      {
        name: 'Gants Alpinestars GP Pro R3',
        slug: 'gants-alpinestars-gp-pro-r3-maroc',
        short: 'Gants de piste professionnels offrant un niveau de protection exceptionnel.',
        desc: 'Issus directement des circuits de MotoGP, les GP Pro R3 d\'Alpinestars combinent cuir de vachette, de chèvre et de kangourou pour une flexibilité et une résistance maximales. Protections rigides ventilées sur les articulations et pont breveté entre l\'annulaire et l\'auriculaire.',
        category: 'gants',
        brand: 'alpinestars',
        price: 2500,
        sale_price: null,
        variants: [
          { size: 'M', color: 'Noir', stock: 5 },
          { size: 'L', color: 'Noir', stock: 7 },
          { size: 'XL', color: 'Noir', stock: 4 }
        ]
      },
      // Vestes
      {
        name: 'Veste Cuir Dainese Racing 4',
        slug: 'veste-cuir-dainese-racing-4-maroc',
        short: 'L\'icône de la veste de sport Dainese en cuir de vachette de première qualité.',
        desc: 'La Racing 4 est le blouson de sport Dainese par excellence. Réalisée en cuir de vachette Tutu avec des inserts élastiques S1 pour un ajustement parfait. Équipée de protections composites sur les coudes et les épaules, ces dernières étant renforcées par des plaques en aluminium interchangeables.',
        category: 'vestes-blousons',
        brand: 'dainese',
        price: 5900,
        sale_price: 5299,
        variants: [
          { size: 'M', color: 'Noir/Rouge', stock: 3 },
          { size: 'L', color: 'Noir/Rouge', stock: 4 },
          { size: 'XL', color: 'Noir/Rouge', stock: 2 }
        ]
      },
      {
        name: 'Veste Textile Alpinestars T-GP Plus R v3',
        slug: 'veste-alpinestars-t-gp-plus-r-v3-maroc',
        short: 'Blouson textile de sport imperméable et ventilé idéal pour la mi-saison.',
        desc: 'Construite en poly-tissu résistant à l\'abrasion, cette veste intègre des protections d\'épaules Nucleon Flex Plus légères et discrètes ainsi qu\'une membrane imperméable fixe pour rouler par tous les temps au Maroc.',
        category: 'vestes-blousons',
        brand: 'alpinestars',
        price: 2800,
        sale_price: null,
        variants: [
          { size: 'M', color: 'Noir/Gris', stock: 5 },
          { size: 'L', color: 'Noir/Gris', stock: 8 },
          { size: 'XL', color: 'Noir/Gris', stock: 6 }
        ]
      },
      // Bottes
      {
        name: 'Bottes Alpinestars SMX-6 v2',
        slug: 'bottes-alpinestars-smx-6-v2-maroc',
        short: 'Bottes de route et piste offrant un équilibre parfait entre confort et protection.',
        desc: 'Les SMX-6 v2 d\'Alpinestars intègrent une protection de cheville articulée biomecanique et des sliders interchangeables. Le rembourrage respirant et la semelle en caoutchouc exclusif offrent une adhérence maximale.',
        category: 'bottes',
        brand: 'alpinestars',
        price: 2700,
        sale_price: 2490,
        variants: [
          { size: '41', color: 'Noir', stock: 2 },
          { size: '42', color: 'Noir', stock: 4 },
          { size: '43', color: 'Noir', stock: 5 },
          { size: '44', color: 'Noir', stock: 3 }
        ]
      },
      {
        name: 'Bottes TCX RT-Race Pro Air',
        slug: 'bottes-tcx-rt-race-pro-air-maroc',
        short: 'Bottes racing professionnelles ultra-ventilées pour les motards exigeants.',
        desc: 'Conçues pour la performance absolue sur piste, ces bottes intègrent le système D.F.C. (Double Flex Control) pour empêcher la torsion de la cheville tout en garantissant une excellente flexion avant-arrière.',
        category: 'bottes',
        brand: 'tcx',
        price: 3800,
        sale_price: null,
        variants: [
          { size: '42', color: 'Noir/Rouge', stock: 2 },
          { size: '43', color: 'Noir/Rouge', stock: 3 },
          { size: '44', color: 'Noir/Rouge', stock: 1 }
        ]
      },
      // Pantalons
      {
        name: 'Pantalon Cuir Dainese Delta 4',
        slug: 'pantalon-cuir-dainese-delta-4-maroc',
        short: 'Pantalon de sport en cuir de vachette Tutu assorti aux blousons Dainese.',
        desc: 'Le Delta 4 propose une coupe ergonomique exceptionnelle grâce à ses soufflets d\'aisance et son textile élastique. Équipé de sliders de genoux interchangeables et de protections de hanches souples certifiées.',
        category: 'pantalons',
        brand: 'dainese',
        price: 3900,
        sale_price: 3600,
        variants: [
          { size: '48', color: 'Noir', stock: 3 },
          { size: '50', color: 'Noir', stock: 5 },
          { size: '52', color: 'Noir', stock: 2 }
        ]
      },
      // Échappements
      {
        name: 'Échappement Akrapovic Slip-On Line Titanium R1',
        slug: 'echappement-akrapovic-slip-on-titanium-r1-maroc',
        short: 'Silencieux en titane de haute qualité avec flasque en carbone pour Yamaha YZF-R1.',
        desc: 'Akrapovic propose ce silencieux homologué conçu avec des matériaux de compétition. Il améliore la sonorité du moteur crossplane de la R1 tout en réduisant le poids global de la machine et en augmentant légèrement le couple.',
        category: 'echappements',
        brand: 'akrapovic',
        price: 9800,
        sale_price: null,
        variants: [
          { size: 'Titanium', color: 'Gris Titane', stock: 2 }
        ]
      },
      {
        name: 'Échappement Akrapovic Black T-Max 560',
        slug: 'echappement-akrapovic-black-t-max-560-maroc',
        short: 'Ligne complète homologuée noire en acier inoxydable et embout carbone pour TMax.',
        desc: 'Donnez à votre T-Max 560 le son rauque et les performances qu\'il mérite avec la ligne d\'échappement complète Akrapovic Racing Line Black. Gain de poids de 1.9kg.',
        category: 'echappements',
        brand: 'akrapovic',
        price: 13500,
        sale_price: 12500,
        variants: [
          { size: 'Black Edition', color: 'Noir', stock: 3 }
        ]
      },
      // Kit Chaîne
      {
        name: 'Kit Chaîne DID 525 VX3 Super Renforcé',
        slug: 'kit-chaine-did-525-vx3-maroc',
        short: 'Kit transmission premium avec chaîne à joints toriques X-Ring dorée.',
        desc: 'Le kit chaîne DID 525 VX3 est la référence mondiale en matière de longévité et de transmission de puissance. Livré avec pignon et couronne en acier trempé haute résistance.',
        category: 'kit-chaine',
        brand: 'did',
        price: 1400,
        sale_price: null,
        variants: [
          { size: '118 Maillons', color: 'Or/Noir', stock: 15 }
        ]
      },
      // Bagagerie
      {
        name: 'Top Case GIVI Trekker Dolomiti 46L',
        slug: 'top-case-givi-trekker-dolomiti-46l-maroc',
        short: 'Valise ou top-case en aluminium naturel de style aventure pour moto trail.',
        desc: 'Le Trekker Dolomiti offre une capacité de 46 litres, idéale pour loger deux casques jets ou un intégral. Conception robuste en aluminium riveté avec verrouillage Security Lock.',
        category: 'bagagerie',
        brand: 'givi',
        price: 4200,
        sale_price: 3899,
        variants: [
          { size: '46 Litres', color: 'Alu', stock: 4 }
        ]
      },
      // Protections
      {
        name: 'Gilet Airbag Dainese Smart Jacket',
        slug: 'gilet-airbag-dainese-smart-jacket-maroc',
        short: 'Gilet airbag sans fil universel portable au-dessus ou en-dessous de tout blouson.',
        desc: 'La technologie d\'airbag D-air® utilisée en MotoGP, disponible dans un gilet polyvalent et ventilé. Il analyse les mouvements 1000 fois par seconde pour se déployer instantanément en cas d\'impact ou de chute.',
        category: 'protections',
        brand: 'dainese',
        price: 7400,
        sale_price: 6999,
        variants: [
          { size: 'S', color: 'Noir', stock: 3 },
          { size: 'M', color: 'Noir', stock: 5 },
          { size: 'L', color: 'Noir', stock: 4 },
          { size: 'XL', color: 'Noir', stock: 2 }
        ]
      },
      {
        name: 'Pare-carters GIVI Cross Bar',
        slug: 'pare-carters-givi-cross-bar-maroc',
        short: 'Crashbars en acier tubulaire noir pour la protection du moteur de votre moto.',
        desc: 'Assurez la sécurité des éléments vitaux de votre moto trail en cas de chute statique ou dynamique avec ces pare-carters en acier résistant fabriqués en Italie.',
        category: 'protections',
        brand: 'givi',
        price: 1900,
        sale_price: null,
        variants: [
          { size: 'Universel', color: 'Noir Tubulaire', stock: 6 }
        ]
      },
      // Sacoches
      {
        name: 'Sacoche Réservoir GIVI Tanklock 15L',
        slug: 'sacoche-reservoir-givi-tanklock-15l-maroc',
        short: 'Sacoche rigide thermoformée extensible avec système de fixation rapide.',
        desc: 'Fixation rapide par bride métallique de réservoir. Poche pour smartphone ou carte routière sur le dessus. Livrée avec housse de pluie et sangle de transport.',
        category: 'sacoches',
        brand: 'givi',
        price: 1100,
        sale_price: 999,
        variants: [
          { size: '15 Litres', color: 'Noir', stock: 10 }
        ]
      },
      // Lunettes
      {
        name: 'Masque Lunettes 100% Armega',
        slug: 'masque-lunettes-100-percent-armega-maroc',
        short: 'Le masque tout-terrain haut de gamme offrant une clarté optique maximale.',
        desc: 'Équipé d\'un verre ultra HD injecté résistant aux impacts. Son cadre double injection évacue efficacement la sueur pour éviter la buée lors des sessions de motocross ou d\'enduro intenses.',
        category: 'lunettes',
        brand: '100%',
        price: 1250,
        sale_price: null,
        variants: [
          { size: 'Taille Unique', color: 'Gouge Rouge', stock: 8 },
          { size: 'Taille Unique', color: 'Falcon Bleu', stock: 5 }
        ]
      },
      // Accessoires USB
      {
        name: 'Double Prise USB Moto Étanche',
        slug: 'double-prise-usb-moto-etanche-maroc',
        short: 'Prise de charge double USB étanche à monter sur le guidon de votre moto.',
        desc: 'Permet de charger votre téléphone, GPS ou intercom tout en roulant. Dispose d\'un interrupteur marche/arrêt et d\'un voltmètre d\'affichage de batterie en temps réel.',
        category: 'accessoires-usb',
        brand: 'fox-racing',
        price: 350,
        sale_price: 299,
        variants: [
          { size: '2.1A + QC3.0', color: 'Noir/Bleu LED', stock: 20 }
        ]
      },
      // Remaining products to reach 30 and cover all subcategories
      {
        name: 'Gants Fox Racing Dirtpaw',
        slug: 'gants-fox-racing-dirtpaw-maroc',
        short: 'Gants de motocross et VTT ultra-populaires pour un grip optimal.',
        desc: 'Les gants Dirtpaw offrent une protection des articulations et une paume clarino monocouche très résistante, assurant une sensibilité exceptionnelle aux poignées.',
        category: 'gants',
        brand: 'fox-racing',
        price: 400,
        sale_price: 349,
        variants: [
          { size: 'M', color: 'Noir', stock: 15 },
          { size: 'L', color: 'Noir', stock: 20 },
          { size: 'XL', color: 'Noir', stock: 12 }
        ]
      },
      {
        name: 'Gants Kenny Titanium',
        slug: 'gants-kenny-titanium-maroc',
        short: 'Gants tout-terrain légers et résistants de la marque française Kenny.',
        desc: 'Idéal pour l\'enduro et le quad au Maroc. Tissu respirant avec renforts en silicone sur les doigts pour une meilleure adhérence aux leviers.',
        category: 'gants',
        brand: 'kenny',
        price: 490,
        sale_price: null,
        variants: [
          { size: 'L', color: 'Bleu', stock: 9 },
          { size: 'XL', color: 'Bleu', stock: 6 }
        ]
      },
      {
        name: 'Maillot Tout-Terrain Kenny Titanium',
        slug: 'maillot-tout-terrain-kenny-titanium-maroc',
        short: 'Maillot de cross respirant et stretch pour la pratique du quad et de la moto.',
        desc: 'Maillot haut de gamme avec découpe laser pour la ventilation. Coupe ergonomique compatible avec les gilets de protection corporelle.',
        category: 'vestes-blousons',
        brand: 'kenny',
        price: 650,
        sale_price: 549,
        variants: [
          { size: 'M', color: 'Bleu/Jaune Neon', stock: 7 },
          { size: 'L', color: 'Bleu/Jaune Neon', stock: 8 }
        ]
      },
      {
        name: 'Pantalon Kenny Titanium Cross',
        slug: 'pantalon-kenny-titanium-cross-maroc',
        short: 'Pantalon motocross ultra-résistant avec empiècements en cuir à l\'intérieur des genoux.',
        desc: 'Matériaux synthétiques hautement résistants à l\'usure. Fermeture micrométrique à la taille pour un ajustement précis et doublure ventilée.',
        category: 'pantalons',
        brand: 'kenny',
        price: 1690,
        sale_price: null,
        variants: [
          { size: '32', color: 'Bleu/Jaune', stock: 4 },
          { size: '34', color: 'Bleu/Jaune', stock: 5 }
        ]
      },
      {
        name: 'Bottes Fox Racing Comp Boot',
        slug: 'bottes-fox-racing-comp-boot-maroc',
        short: 'Bottes de motocross offrant une durabilité et un confort immédiats dès le premier enfilage.',
        desc: 'Conçues pour les pilotes de MX amateurs et intermédiaires. Plaque tibia en TPU moulé, protection des mollets et embout de sélecteur renforcé.',
        category: 'bottes',
        brand: 'fox-racing',
        price: 2800,
        sale_price: 2490,
        variants: [
          { size: '42', color: 'Noir', stock: 3 },
          { size: '43', color: 'Noir', stock: 4 },
          { size: '44', color: 'Noir', stock: 2 }
        ]
      },
      {
        name: 'Sac à Dos GIVI Rider 20L',
        slug: 'sac-a-dos-givi-rider-20l-maroc',
        short: 'Sac à dos aérodynamique conçu spécialement pour les motards sur route.',
        desc: 'Le sac à dos GIVI Rider est muni de sangles pectorale et abdominale réglables pour ne pas bouger à haute vitesse. Compartiment étanche pour PC portable.',
        category: 'bagagerie',
        brand: 'givi',
        price: 850,
        sale_price: null,
        variants: [
          { size: '20L', color: 'Noir Reflective', stock: 12 }
        ]
      },
      {
        name: 'Casque Shark Ridill 2 Solid',
        slug: 'casque-shark-ridill-2-solid-maroc',
        short: 'Le casque intégral accessible certifié sous la nouvelle norme ECE 22.06.',
        desc: 'Une calotte en polycarbonate injecté haute résistance combinée à un écran pare-soleil intégré et un excellent confort pour un prix ultra-compétitif.',
        category: 'casques',
        brand: 'shark',
        price: 1990,
        sale_price: 1799,
        variants: [
          { size: 'S', color: 'Noir Mat', stock: 6 },
          { size: 'M', color: 'Noir Mat', stock: 10 },
          { size: 'L', color: 'Noir Mat', stock: 8 }
        ]
      },
      {
        name: 'Kit Chaîne DID 520 VX3 Or/Noir',
        slug: 'kit-chaine-did-520-vx3-or-noir-maroc',
        short: 'Kit transmission super renforcé pour motos de cylindrée moyenne.',
        desc: 'Excellent rapport durabilité/prix pour les motos comme la Kawasaki Z650 ou Yamaha MT-07. Livré avec pignon acier.',
        category: 'kit-chaine',
        brand: 'did',
        price: 1200,
        sale_price: 1099,
        variants: [
          { size: '114 Maillons', color: 'Or/Noir', stock: 15 }
        ]
      },
      {
        name: 'Masque 100% Strata 2 Goggles',
        slug: 'masque-100-percent-strata-2-goggles-maroc',
        short: 'Masque tout-terrain d\'entrée de gamme offrant un excellent rapport qualité/prix.',
        desc: 'Champ de vision large, mousse faciale double couche absorbant l\'humidité et bandeau en silicone de 40mm maintenant le masque en place sur le casque.',
        category: 'lunettes',
        brand: '100%',
        price: 490,
        sale_price: null,
        variants: [
          { size: 'Taille Unique', color: 'Noir/Ecran Clair', stock: 14 }
        ]
      },
      {
        name: 'Valise Latérale GIVI Trekker 33L',
        slug: 'valise-laterale-givi-trekker-33l-maroc',
        short: 'Valise moto en aluminium et plastique hautement résistante aux intempéries.',
        desc: 'Peut être utilisée comme valise latérale ou comme top-case. Capacité de 33 litres. Système de verrouillage breveté Monokey.',
        category: 'bagagerie',
        brand: 'givi',
        price: 3400,
        sale_price: 3100,
        variants: [
          { size: '33 Litres', color: 'Gris Alu', stock: 4 }
        ]
      },
      {
        name: 'Protège Mains Fox Racing Bomber',
        slug: 'protege-mains-fox-racing-bomber-maroc',
        short: 'Plaques de protection de mains pour guidons de moto cross, enduro et quad.',
        desc: 'Fabriqués en polymère injecté double densité hautement résistant. Protègent contre les projections de pierres et les branches.',
        category: 'protections',
        brand: 'fox-racing',
        price: 590,
        sale_price: 499,
        variants: [
          { size: 'Standard', color: 'Noir', stock: 8 }
        ]
      },
      {
        name: 'Poignées ODI Rogue Lock-On',
        slug: 'poignees-odi-rogue-lock-on-maroc',
        short: 'Poignées de guidon haut de gamme avec système de verrouillage Lock-On.',
        desc: 'Les poignées ODI Rogue offrent une absorption maximale des chocs grâce à leurs larges coussinets surélevés. Le système Lock-On garantit une fixation parfaite sans colle ni fil de fer.',
        category: 'gants',
        brand: 'odi',
        price: 350,
        sale_price: 299,
        variants: [
          { size: 'Standard', color: 'Noir/Colliers Rouges', stock: 15 },
          { size: 'Standard', color: 'Noir/Colliers Noirs', stock: 10 }
        ]
      }
    ];

    // Track product IDs mapped by their slugs to associate in bundles & images
    const dbProductIds: { [slug: string]: number } = {};

    productsList.forEach(p => {
      const catId = subcatIds[p.category];
      const brandId = brandIds[p.brand];

      const metaTitle = `${p.name} Maroc | Prix et Avis - MOTO PACO`;
      const metaDescription = `Achetez ${p.name} au Maroc. ${p.short} Livraison 24h/48h partout au Maroc. Paiement cash à la livraison.`;

      const prodId = insertProduct.run(
        p.name,
        p.slug,
        p.desc,
        p.short,
        catId,
        brandId,
        p.price,
        p.sale_price,
        'published',
        metaTitle,
        metaDescription,
        Math.floor(Math.random() * 91) + 60
      ).lastInsertRowid as number;

      dbProductIds[p.slug] = prodId;

      // Add 1 primary image + 3 additional gallery images
      insertProductImage.run(prodId, `https://picsum.photos/seed/${p.slug}-1/600/600`, 1, 0);
      insertProductImage.run(prodId, `https://picsum.photos/seed/${p.slug}-2/600/600`, 0, 1);
      insertProductImage.run(prodId, `https://picsum.photos/seed/${p.slug}-3/600/600`, 0, 2);
      insertProductImage.run(prodId, `https://picsum.photos/seed/${p.slug}-4/600/600`, 0, 3);

      // Add variants
      p.variants.forEach((v, index) => {
        const productPart = p.slug.replace('-maroc', '').split('-').slice(0, 3).join('-').toUpperCase();
        const sizePart = v.size.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const sku = `${p.brand.toUpperCase()}-${productPart}-${sizePart}-${index}`;
        insertProductVariant.run(prodId, v.size, v.color, sku, v.stock, 3);
      });
    });

    // 5. Create Pre-built Bundles
    // Bundle 1: Pack Sécurité Route (AGV K6 + Dainese Carbon 4 Gloves)
    const b1Id = insertBundle.run('Pack Sécurité Route', 10, null, 1).lastInsertRowid as number;
    insertBundleProduct.run(b1Id, dbProductIds['casque-agv-k6-s-noir-mat-maroc']);
    insertBundleProduct.run(b1Id, dbProductIds['gants-dainese-carbon-4-long-maroc']);

    // Bundle 2: Pack Aventure (Shark Spartan GT + Alpinestars SMX-6 Boots + Dainese Delta 4 Pants)
    const b2Id = insertBundle.run('Pack Aventure', 15, null, 1).lastInsertRowid as number;
    insertBundleProduct.run(b2Id, dbProductIds['casque-shark-spartan-gt-carbon-maroc']);
    insertBundleProduct.run(b2Id, dbProductIds['bottes-alpinestars-smx-6-v2-maroc']);
    insertBundleProduct.run(b2Id, dbProductIds['pantalon-cuir-dainese-delta-4-maroc']);

    // Bundle 3: Pack Chaîne Complete (DID 525 VX3 + USB adapter just to combine item)
    const b3Id = insertBundle.run('Pack Chaîne Complete', 12, null, 1).lastInsertRowid as number;
    insertBundleProduct.run(b3Id, dbProductIds['kit-chaine-did-525-vx3-maroc']);
    insertBundleProduct.run(b3Id, dbProductIds['double-prise-usb-moto-etanche-maroc']);

    // 6. Promo Codes
    insertPromo.run('PREMIER10', 'percent', 10, 500, 100, 1);
    insertPromo.run('ETE2025', 'fixed', 50, 600, 200, 1);

    // 7. Seed Reviews
    insertReview.run(dbProductIds['casque-agv-k6-s-noir-mat-maroc'], 2, 5, 'Casque incroyable !', 'Ultra léger et insonorisé au top. Vaut chaque centime.', 1);
    insertReview.run(dbProductIds['casque-agv-k6-s-noir-mat-maroc'], 2, 4, 'Très bon produit', 'Très confortable, mais un peu serré au début. La qualité italienne est là.', 1);
    insertReview.run(dbProductIds['gants-dainese-carbon-4-long-maroc'], 2, 5, 'Superbe protection', 'Très bonne tenue des poignets. Les coques en carbone donnent confiance.', 1);
    insertReview.run(dbProductIds['bottes-alpinestars-smx-6-v2-maroc'], 2, 4, 'Confortables et robustes', 'Utilisées tous les jours depuis un mois à Casablanca, parfaites !', 1);
  });

  transaction();
  console.log('Database seeded successfully!');
}
