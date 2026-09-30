/**
 * scripts/seed-database.mjs
 * Game Hub — Database Seeder with prices in Kazakhstani Tenge (₸) and rich detailed descriptions.
 */

const PROJECT_ID = 'game-hub-c9caa';
const API_KEY = 'AIzaSyC1-wdRIA0QsCL86hsAzc_FFwI-dvfz--8';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function toFirestoreValue(val) {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === 'string') {
    return { stringValue: val };
  }
  if (typeof val === 'boolean') {
    return { booleanValue: val };
  }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return { integerValue: val.toString() };
    }
    return { doubleValue: val };
  }
  if (val instanceof Date) {
    return { timestampValue: val.toISOString() };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(toFirestoreValue)
      }
    };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, value] of Object.entries(obj)) {
    fields[key] = toFirestoreValue(value);
  }
  return { fields };
}

export const sampleGames = [
  {
    id: 'seed-game-cyberpunk-2077',
    data: {
      title: 'Cyberpunk 2077',
      titleLower: 'cyberpunk 2077',
      description: 'Грандиозная ролевая игра в открытом мире от CD Projekt RED. Действие разворачивается в сверкающем неоном мегаполисе Найт-Сити — городе будущего, где модификации тела, власть и корпоративное влияние стали религией. Вы играете за V (Ви) — наемника в поисках уникального чипа бессмертия. Вас ждут десятки часов нелинейного сюжета с Киану Ривзом в роли Джонни Сильверхенда, глубокая кастомизация киберимплантов, тактические перестрелки и возможность взлома сетей врагов.',
      coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
      genres: ['RPG', 'Action', 'Adventure'],
      platforms: ['PC', 'PlayStation', 'Xbox'],
      releaseDate: new Date('2020-12-10T00:00:00Z'),
      developer: 'CD Projekt RED',
      publisher: 'CD Projekt',
      price: 14990,
      hardwareRequirements: {
        min: {
          cpu: 'Intel Core i7-6700K / AMD Ryzen 5 1600',
          gpu: 'NVIDIA GTX 1060 6GB / AMD Radeon RX 580 8GB',
          ram: '12 ГБ',
          storage: '70 ГБ SSD',
        },
        rec: {
          cpu: 'Intel Core i7-8700K / AMD Ryzen 5 3600',
          gpu: 'NVIDIA RTX 2060 Super / AMD Radeon RX 5700 XT',
          ram: '16 ГБ',
          storage: '70 ГБ SSD',
        },
      },
      screenshots: [
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80'
      ],
      videoURL: '',
      featured: true,
      avgRating: 4.8,
      reviewCount: 32,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-elden-ring',
    data: {
      title: 'Elden Ring',
      titleLower: 'elden ring',
      description: 'Триумфальный шедевр жанра Action-RPG от Хидэтаки Миядзаки и FromSoftware, созданный в соавторстве с автором "Игры престолов" Джорджем Р. Р. Мартином. Отправляйтесь в монументальные Земли Между, чтобы собрать осколки Кольца Элден и стать новым Повелителем. Вас ждет беспрецедентный по масштабу бесшовный открытый мир, верный скакун Поток, сотни видов оружия и заклинаний, а также эпические битвы с полубогами, требующие максимального мастерства.',
      coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
      genres: ['Action', 'RPG'],
      platforms: ['PC', 'PlayStation', 'Xbox'],
      releaseDate: new Date('2022-02-25T00:00:00Z'),
      developer: 'FromSoftware',
      publisher: 'Bandai Namco Entertainment',
      price: 21990,
      hardwareRequirements: {
        min: {
          cpu: 'Intel Core i5-8400 / AMD Ryzen 3 3300X',
          gpu: 'NVIDIA GeForce GTX 1060 3GB / AMD Radeon RX 580 4GB',
          ram: '12 ГБ',
          storage: '60 ГБ SSD',
        },
        rec: {
          cpu: 'Intel Core i7-8700K / AMD Ryzen 5 3600X',
          gpu: 'NVIDIA GeForce GTX 1070 8GB / AMD RX Vega 56 8GB',
          ram: '16 ГБ',
          storage: '60 ГБ SSD',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: true,
      avgRating: 4.9,
      reviewCount: 45,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-witcher-3',
    data: {
      title: 'Ведьмак 3: Дикая Охота',
      titleLower: 'ведьмак 3: дикая охота',
      description: 'Эталон сюжетных ролевых игр нового поколения. В роли ведьмака Геральта из Ривии, профессионального охотника на монстров, вы отправляетесь на поиски Цири — Дитя Предназначения, за которой охотится призрачная кавалькада Дикой Охоты. Огромный мир от раздираемого войной Велена и шумного Новиграда до суровых островов Скеллиге полон мрачных славянских сказок, морально неоднозначных решений и незабываемых персонажей.',
      coverImage: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80',
      genres: ['RPG', 'Adventure', 'Action'],
      platforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo'],
      releaseDate: new Date('2015-05-18T00:00:00Z'),
      developer: 'CD Projekt RED',
      publisher: 'CD Projekt',
      price: 9990,
      hardwareRequirements: {
        min: {
          cpu: 'Intel Core i5-2500K / AMD Phenom II X4 940',
          gpu: 'NVIDIA GeForce GTX 660 / AMD Radeon HD 7870',
          ram: '6 ГБ',
          storage: '50 ГБ',
        },
        rec: {
          cpu: 'Intel Core i7-3770 / AMD FX-8350',
          gpu: 'NVIDIA GeForce GTX 1060 6GB / AMD Radeon RX 590',
          ram: '16 ГБ',
          storage: '50 ГБ SSD',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: true,
      avgRating: 4.9,
      reviewCount: 58,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-baldurs-gate-3',
    data: {
      title: "Baldur's Gate 3",
      titleLower: "baldur's gate 3",
      description: "Триумфальная партийная ролевая игра нового поколения по вселенной Dungeons & Dragons от Larian Studios. В ваш мозг внедрен личиночный паразит иллитидов, наделяющий пугающей силой, но грозящий превратить в чудовище. Соберите уникальную партию спутников, раскройте их судьбы и отправляйтесь в грандиозный поход по Забытым Королевствам. Вас ждут пошаговые тактические бои с физикой окружения и безграничная вариативность отыгрыша.",
      coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      genres: ['RPG', 'Strategy'],
      platforms: ['PC', 'PlayStation', 'Xbox'],
      releaseDate: new Date('2023-08-03T00:00:00Z'),
      developer: 'Larian Studios',
      publisher: 'Larian Studios',
      price: 23990,
      hardwareRequirements: {
        min: {
          cpu: 'Intel Core i5 4690 / AMD FX 8350',
          gpu: 'NVIDIA GeForce GTX 970 / AMD RX 480',
          ram: '8 ГБ',
          storage: '150 ГБ SSD',
        },
        rec: {
          cpu: 'Intel Core i7 8700K / AMD Ryzen 5 3600',
          gpu: 'NVIDIA GeForce RTX 2060 Super / AMD RX 5700 XT',
          ram: '16 ГБ',
          storage: '150 ГБ SSD',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: true,
      avgRating: 5.0,
      reviewCount: 47,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-rdr2',
    data: {
      title: 'Red Dead Redemption 2',
      titleLower: 'red dead redemption 2',
      description: 'Грандиозный кинематографичный вестерн от Rockstar Games, признанный одной из величайших игр в истории индустрии. Америка, 1899 год. Эпоха Дикого Запада угасает, законники безжалостно охотятся на последние банды. Вы — Артур Морган, преданный член банды Датча ван дер Линде. Ограбления поездов, охота в диких лесах, дуэли на револьверах, живая дикая природа и глубочайшая драма о семье, верности и цене искупления грехов.',
      coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
      genres: ['Action', 'Adventure'],
      platforms: ['PC', 'PlayStation', 'Xbox'],
      releaseDate: new Date('2018-10-26T00:00:00Z'),
      developer: 'Rockstar Games',
      publisher: 'Rockstar Games',
      price: 18990,
      hardwareRequirements: {
        min: {
          cpu: 'Intel Core i5-2500K / AMD FX-6300',
          gpu: 'NVIDIA GeForce GTX 770 2GB / AMD Radeon R9 280 3GB',
          ram: '8 ГБ',
          storage: '150 ГБ',
        },
        rec: {
          cpu: 'Intel Core i7-4770K / AMD Ryzen 5 1500X',
          gpu: 'NVIDIA GeForce GTX 1060 6GB / AMD Radeon RX 480 4GB',
          ram: '12 ГБ',
          storage: '150 ГБ SSD',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: true,
      avgRating: 4.9,
      reviewCount: 63,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-gow-ragnarok',
    data: {
      title: 'God of War Ragnarök',
      titleLower: 'god of war ragnarök',
      description: 'Эпическое продолжение скандинавской саги о спартанском боге войны Кратосе и его взрослеющем сыне Атрее. Надвигается Фимбулвинтер — трехлетняя зима, предвещающая Рагнарёк, гибель богов и всего сущего. Отец и сын должны посетить каждый из Девяти миров в поисках союзников и своего места в пророчестве. Безупречная боевая система с топором Левиафан и Клинками Хаоса, кинематографичная камера без монтажных склеек и трогательная семейная история.',
      coverImage: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
      genres: ['Action', 'Adventure'],
      platforms: ['PlayStation', 'PC'],
      releaseDate: new Date('2022-11-09T00:00:00Z'),
      developer: 'Santa Monica Studio',
      publisher: 'Sony Interactive Entertainment',
      price: 27990,
      hardwareRequirements: {
        min: {
          cpu: 'Intel Core i5-6600k / AMD Ryzen 5 2400 G',
          gpu: 'NVIDIA GTX 1060 6GB / AMD RX 570 4GB',
          ram: '16 ГБ',
          storage: '190 ГБ SSD',
        },
        rec: {
          cpu: 'Intel Core i7-7700k / AMD Ryzen 5 3600X',
          gpu: 'NVIDIA RTX 2060 Super / AMD RX 5700',
          ram: '16 ГБ',
          storage: '190 ГБ SSD',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: true,
      avgRating: 4.8,
      reviewCount: 39,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-zelda-totk',
    data: {
      title: 'The Legend of Zelda: Tears of the Kingdom',
      titleLower: 'the legend of zelda: tears of the kingdom',
      description: 'Шедевр для Nintendo Switch, расширивший горизонты приключенческих игр. Линк возвращается в королевство Хайрул, где после пробуждения древнего зла открылись загадочные парящие острова в небесах и бескрайние опасные Каверны в глубинах земли. Новые революционные механики "Комбинирование", "Автосборка" и "Чароплет" позволяют объединять предметы, строить летательные аппараты, боевые машины и преодолевать любые препятствия безграничной фантазией игрока.',
      coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
      genres: ['Adventure', 'Action', 'Puzzle'],
      platforms: ['Nintendo'],
      releaseDate: new Date('2023-05-12T00:00:00Z'),
      developer: 'Nintendo EPD',
      publisher: 'Nintendo',
      price: 29990,
      hardwareRequirements: {
        min: {
          cpu: 'Nintendo Switch SoC (ARM Cortex-A57 × 4)',
          gpu: 'NVIDIA Tegra X1 (256 Maxwell cores)',
          ram: '4 ГБ',
          storage: '16.3 ГБ',
        },
        rec: {
          cpu: 'Nintendo Switch SoC (ARM Cortex-A57 × 4)',
          gpu: 'NVIDIA Tegra X1 (256 Maxwell cores)',
          ram: '4 ГБ',
          storage: '16.3 ГБ (microSD рекомендована)',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: true,
      avgRating: 4.9,
      reviewCount: 28,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-hades',
    data: {
      title: 'Hades',
      titleLower: 'hades',
      description: 'Захватывающий roguelike-экшен с видом сверху от студии Supergiant Games, удостоенный десятков премий "Игра года". Играя за принца Загрея, бессмертного сына повелителя подземного мира, вы пытаетесь пробиться сквозь орды чудовищ на поверхность к Олимпу. Каждый побег уникален: олимпийские боги (Зевс, Афина, Посейдон) даруют свои благословения, преображающие стиль боя. Великолепная рисованная графика, динамичный саундтрек и остроумные диалоги.',
      coverImage: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
      genres: ['Action', 'Indie', 'RPG'],
      platforms: ['PC', 'Nintendo', 'PlayStation', 'Xbox'],
      releaseDate: new Date('2020-09-17T00:00:00Z'),
      developer: 'Supergiant Games',
      publisher: 'Supergiant Games',
      price: 5490,
      hardwareRequirements: {
        min: {
          cpu: 'Dual Core 2.4 GHz',
          gpu: '2 ГБ VRAM / GeForce GTX 960, Radeon RX 470',
          ram: '8 ГБ',
          storage: '15 ГБ',
        },
        rec: {
          cpu: 'Dual Core 3.0 GHz+',
          gpu: '4 ГБ VRAM / GeForce GTX 1060, Radeon RX 5500 XT',
          ram: '16 ГБ',
          storage: '15 ГБ',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: false,
      avgRating: 4.8,
      reviewCount: 21,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-hollow-knight',
    data: {
      title: 'Hollow Knight',
      titleLower: 'hollow knight',
      description: 'Признанная классика атмосферных двухмерных метроидваний от австралийской Team Cherry. Вооружившись гвоздем, безымянный Рыцарь спускается под землю в руины павшего королевства Халлоунест. Исследуйте мрачные пещеры, заросшие сады и забытые города, сражайтесь с зараженными насекомыми, находите древние амулеты и открывайте тайны увядающего мира. Сложные платформенные испытания, молниеносные бои с боссами и чарующая музыка.',
      coverImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
      genres: ['Indie', 'Action', 'Adventure'],
      platforms: ['PC', 'Nintendo', 'PlayStation', 'Xbox'],
      releaseDate: new Date('2017-02-24T00:00:00Z'),
      developer: 'Team Cherry',
      publisher: 'Team Cherry',
      price: 3690,
      hardwareRequirements: {
        min: {
          cpu: 'Intel Core 2 Duo E5200',
          gpu: 'GeForce 9800GTX+ (1GB)',
          ram: '4 ГБ',
          storage: '9 ГБ',
        },
        rec: {
          cpu: 'Intel Core i5',
          gpu: 'GeForce GTX 560',
          ram: '8 ГБ',
          storage: '9 ГБ',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: false,
      avgRating: 4.9,
      reviewCount: 53,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-forza-5',
    data: {
      title: 'Forza Horizon 5',
      titleLower: 'forza horizon 5',
      description: 'Главная гоночная аркада современности в открытом мире. Вас ждет бесконечный автомобильный фестиваль в потрясающе красивой и разнообразной Мексике — от песчаных дюн и затерянных храмов майя до шумных колониальных городов и действующего вулкана. В вашем распоряжении сотни лицензированных суперкаров, динамическая смена погоды, пыльные бури и тропические штормы, а также бесконечные заезды с друзьями по сети.',
      coverImage: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
      genres: ['Racing', 'Action'],
      platforms: ['PC', 'Xbox'],
      releaseDate: new Date('2021-11-09T00:00:00Z'),
      developer: 'Playground Games',
      publisher: 'Xbox Game Studios',
      price: 19990,
      hardwareRequirements: {
        min: {
          cpu: 'Intel i5-4460 / AMD Ryzen 3 1200',
          gpu: 'NVIDIA GTX 970 / AMD Radeon RX 470',
          ram: '8 ГБ',
          storage: '110 ГБ',
        },
        rec: {
          cpu: 'Intel i7-10700K / AMD Ryzen 7 3800XT',
          gpu: 'NVIDIA RTX 2070 / AMD Radeon RX 6700 XT',
          ram: '16 ГБ',
          storage: '110 ГБ SSD',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: false,
      avgRating: 4.7,
      reviewCount: 16,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-re4-remake',
    data: {
      title: 'Resident Evil 4 Remake',
      titleLower: 'resident evil 4 remake',
      description: 'Эталонный ремейк легендарного survival horror от Capcom на передовом движке RE Engine. Спустя шесть лет после катастрофы в Раккун-Сити агент Леон С. Кеннеди отправляется на спасение похищенной дочери президента США в отдаленную европейскую деревушку, жители которой поражены жутким паразитом Лас-Плагас. Напряженные перестрелки, система парирования ножом, менеджмент инвентаря в дипломате и постоянная нехватка патронов.',
      coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
      genres: ['Action', 'Horror'],
      platforms: ['PC', 'PlayStation', 'Xbox'],
      releaseDate: new Date('2023-03-24T00:00:00Z'),
      developer: 'Capcom',
      publisher: 'Capcom',
      price: 21490,
      hardwareRequirements: {
        min: {
          cpu: 'AMD Ryzen 3 1200 / Intel Core i5-7500',
          gpu: 'NVIDIA GeForce GTX 1050 Ti 4GB / AMD Radeon RX 560 4GB',
          ram: '8 ГБ',
          storage: '70 ГБ',
        },
        rec: {
          cpu: 'AMD Ryzen 5 3600 / Intel Core i7 8700',
          gpu: 'NVIDIA GeForce GTX 1070 / AMD Radeon RX 5700',
          ram: '16 ГБ',
          storage: '70 ГБ SSD',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: false,
      avgRating: 4.8,
      reviewCount: 29,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-gta-5',
    data: {
      title: 'Grand Theft Auto V',
      titleLower: 'grand theft auto v',
      description: 'Монументальный хит от Rockstar Games. В центре повествования — три колоритных персонажа: бывший грабитель банков Майкл, уличный гангстер Франклин и непредсказуемый психопат Тревор. Переключайтесь между героями на лету, планируйте и проводите дерзкие многоэтапные ограбления по всему штату Сан-Андреас и городу Лос-Сантос. Безграничный мир с тысячами занятий, перестрелками, тюнингом тачек и едкой сатирой на современное общество.',
      coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
      genres: ['Action', 'Adventure'],
      platforms: ['PC', 'PlayStation', 'Xbox'],
      releaseDate: new Date('2013-09-17T00:00:00Z'),
      developer: 'Rockstar North',
      publisher: 'Rockstar Games',
      price: 9990,
      hardwareRequirements: {
        min: {
          cpu: 'Intel Core 2 Quad Q6600 2.40GHz / AMD Phenom 9850',
          gpu: 'NVIDIA 9800 GT 1GB / AMD HD 4870 1GB',
          ram: '4 ГБ',
          storage: '72 ГБ',
        },
        rec: {
          cpu: 'Intel Core i5 3470 3.2GHz / AMD FX-8350 4GHz',
          gpu: 'NVIDIA GTX 660 2GB / AMD HD 7870 2GB',
          ram: '8 ГБ',
          storage: '72 ГБ',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: true,
      avgRating: 4.8,
      reviewCount: 88,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  // ─── 20 NEW GAMES ──────────────────────────────────────────────────────────
  {
    id: 'seed-game-dark-souls-3',
    data: {
      title: 'Dark Souls III',
      titleLower: 'dark souls iii',
      description: 'Кульминация трилогии souls-игр от FromSoftware. Мир Лотрика погружается во тьму — огонь угасает, и вы, Нежить, должны разыскать Правителей Пепла и принести их к трону. Самая быстрая и кинематографичная часть серии: молниеносные бои требуют идеального тайминга парирований и уклонений, а каждый босс — настоящее произведение боевого дизайна. Великолепная архитектура локаций, мрачный лор и непревзойдённое чувство победы над сложным противником.',
      coverImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
      genres: ['Action', 'RPG'],
      platforms: ['PC', 'PlayStation', 'Xbox'],
      releaseDate: new Date('2016-04-12T00:00:00Z'),
      developer: 'FromSoftware',
      publisher: 'Bandai Namco Entertainment',
      price: 11990,
      hardwareRequirements: {
        min: {
          cpu: 'Intel Core i3-2100 / AMD FX-6300',
          gpu: 'NVIDIA GeForce GTX 750 Ti / AMD Radeon HD 7950',
          ram: '8 ГБ',
          storage: '25 ГБ',
        },
        rec: {
          cpu: 'Intel Core i7-3770 / AMD FX-8350',
          gpu: 'NVIDIA GeForce GTX 970 / AMD Radeon R9 390X',
          ram: '8 ГБ',
          storage: '25 ГБ',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: false,
      avgRating: 4.9,
      reviewCount: 74,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-sekiro',
    data: {
      title: 'Sekiro: Shadows Die Twice',
      titleLower: 'sekiro: shadows die twice',
      description: 'Лауреат премии "Игра года 2019" от FromSoftware. Вы — Волк, синоби эпохи Сэнгоку, потерявший руку и призванный спасти своего молодого господина из лап враждебного клана. Революционная боевая система строится на сломе стойки противника: вместо уклонений — агрессивные парирования и дефлекции в ритме напряжённой дуэли. Вертикальный платформинг с крюком-кошкой, стелс-убийства и один из самых запоминающихся финальных боссов в истории игровой индустрии.',
      coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
      genres: ['Action', 'Adventure'],
      platforms: ['PC', 'PlayStation', 'Xbox'],
      releaseDate: new Date('2019-03-22T00:00:00Z'),
      developer: 'FromSoftware',
      publisher: 'Activision',
      price: 13990,
      hardwareRequirements: {
        min: {
          cpu: 'Intel Core i3-2100 / AMD FX-6300',
          gpu: 'NVIDIA GeForce GTX 760 / AMD Radeon HD 7950',
          ram: '8 ГБ',
          storage: '25 ГБ',
        },
        rec: {
          cpu: 'Intel Core i5-2500K / AMD Ryzen 5 1400',
          gpu: 'NVIDIA GeForce GTX 970 / AMD Radeon RX 570',
          ram: '8 ГБ',
          storage: '25 ГБ',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: false,
      avgRating: 4.8,
      reviewCount: 41,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-minecraft',
    data: {
      title: 'Minecraft',
      titleLower: 'minecraft',
      description: 'Самая продаваемая игра в истории человечества с более чем 238 миллионами проданных копий. Бесконечно процедурно генерируемый мир из кубических блоков, где единственное ограничение — ваша фантазия. Строите грандиозные замки и мегаполисы в мирном режиме или выживаете, добываете ресурсы и сражаетесь с зомби, скелетами и Эндер-драконом в режиме выживания. Богатая экосистема модов и серверов превращает игру в бесконечную платформу для творчества и приключений.',
      coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
      genres: ['Indie', 'Adventure', 'Puzzle'],
      platforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo'],
      releaseDate: new Date('2011-11-18T00:00:00Z'),
      developer: 'Mojang Studios',
      publisher: 'Mojang Studios',
      price: 3490,
      hardwareRequirements: {
        min: {
          cpu: 'Intel Core i3-3210 / AMD A8-7600',
          gpu: 'GeForce 400 / Radeon HD 7000 (1GB VRAM)',
          ram: '4 ГБ',
          storage: '4 ГБ',
        },
        rec: {
          cpu: 'Intel Core i5-4690 / AMD A10-7800',
          gpu: 'GeForce 700 / Radeon Rx 200 (2GB VRAM)',
          ram: '8 ГБ',
          storage: '4 ГБ SSD',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: true,
      avgRating: 4.7,
      reviewCount: 112,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-death-stranding',
    data: {
      title: 'Death Stranding',
      titleLower: 'death stranding',
      description: 'Революционная "игра связи" от легендарного Хидэо Кодзимы с Норманом Ридусом в главной роли. Америка разрушена катастрофическим явлением — Выбросом смерти, соединившим мир живых с миром мёртвых. Сэм Бриджес — курьер, чья миссия — воссоединить разрозненные анклавы выживших через Хиральную сеть. Завораживающий постапокалиптический пейзаж, система помощи другим игрокам через брошенные предметы и постройки, философия связей и сотрудничества.',
      coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
      genres: ['Action', 'Adventure'],
      platforms: ['PC', 'PlayStation'],
      releaseDate: new Date('2019-11-08T00:00:00Z'),
      developer: 'Kojima Productions',
      publisher: 'Sony Interactive Entertainment',
      price: 14990,
      hardwareRequirements: {
        min: {
          cpu: 'Intel Core i5-4570S / AMD Ryzen 3 1300X',
          gpu: 'NVIDIA GeForce GTX 1050 Ti / AMD Radeon RX 570',
          ram: '8 ГБ',
          storage: '80 ГБ',
        },
        rec: {
          cpu: 'Intel Core i7-4770 / AMD Ryzen 5 1600',
          gpu: 'NVIDIA GeForce GTX 1080 / AMD Radeon RX 5700 XT',
          ram: '8 ГБ',
          storage: '80 ГБ SSD',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: false,
      avgRating: 4.6,
      reviewCount: 33,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-horizon-zd',
    data: {
      title: 'Horizon Zero Dawn',
      titleLower: 'horizon zero dawn',
      description: 'Постапокалиптическая RPG в открытом мире от Guerrilla Games. Тысячи лет после гибели цивилизации Землю населяют механические звери, а люди вернулись к первобытному образу жизни. Эллой — охотница и изгой племени Нора — отправляется разгадывать тайны прошлого мира и своего происхождения. Виртуозная охота на механических динозавров, система крафтинга ловушек, богатый мир с уникальной экосистемой и захватывающий научно-фантастический нарратив.',
      coverImage: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
      genres: ['Action', 'RPG', 'Adventure'],
      platforms: ['PC', 'PlayStation'],
      releaseDate: new Date('2017-02-28T00:00:00Z'),
      developer: 'Guerrilla Games',
      publisher: 'Sony Interactive Entertainment',
      price: 9990,
      hardwareRequirements: {
        min: {
          cpu: 'Intel Core i5-2500K / AMD FX 6300',
          gpu: 'NVIDIA GeForce GTX 780 / AMD Radeon R9 290',
          ram: '8 ГБ',
          storage: '100 ГБ',
        },
        rec: {
          cpu: 'Intel Core i7-4770K / AMD Ryzen 5 1500X',
          gpu: 'NVIDIA GeForce GTX 1060 / AMD Radeon RX 580',
          ram: '16 ГБ',
          storage: '100 ГБ SSD',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: false,
      avgRating: 4.7,
      reviewCount: 37,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-disco-elysium',
    data: {
      title: 'Disco Elysium',
      titleLower: 'disco elysium',
      description: 'Революционная изометрическая RPG без единого боя — вся игра строится на диалогах, навыках и принятии решений. Вы — детектив с полной амнезией, проснувшийся в разгромленном гостиничном номере. Вам предстоит расследовать убийство, попутно буквально собирая по кускам свою личность. 24 прокачиваемых навыка с уникальными голосами образуют целый хор у вас в голове. Невероятный авторский нарратив, политическая сатира и редкая эмоциональная глубина.',
      coverImage: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
      genres: ['RPG', 'Adventure', 'Indie'],
      platforms: ['PC', 'PlayStation'],
      releaseDate: new Date('2019-10-15T00:00:00Z'),
      developer: 'ZA/UM',
      publisher: 'ZA/UM',
      price: 6990,
      hardwareRequirements: {
        min: {
          cpu: 'Intel Core i5-2520M / AMD A10-5750M',
          gpu: 'NVIDIA GeForce GTX 690 / AMD Radeon HD 7970',
          ram: '8 ГБ',
          storage: '22 ГБ',
        },
        rec: {
          cpu: 'Intel Core i7-7700HQ / AMD Ryzen 5 2600',
          gpu: 'NVIDIA GeForce GTX 970 / AMD Radeon RX 580',
          ram: '12 ГБ',
          storage: '22 ГБ SSD',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: false,
      avgRating: 4.9,
      reviewCount: 29,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-stardew-valley',
    data: {
      title: 'Stardew Valley',
      titleLower: 'stardew valley',
      description: 'Уютная фермерская RPG, созданная одним человеком — Эриком Бэроном — за четыре года. Бросьте душную корпоративную работу и унаследуйте дедушкину ферму в Пеликан-Тауне. Выращивайте урожай, разводите скот, рыбачьте, добывайте руду в шахтах, дружите с жителями деревни и находите любовь. Бесконечно умиротворяющий геймплей, очаровательная пиксельная графика и невероятная глубина контента, скрытая за кажущейся простотой.',
      coverImage: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80',
      genres: ['Indie', 'RPG'],
      platforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo'],
      releaseDate: new Date('2016-02-26T00:00:00Z'),
      developer: 'ConcernedApe',
      publisher: 'ConcernedApe',
      price: 2990,
      hardwareRequirements: {
        min: {
          cpu: '2 GHz',
          gpu: '256MB видеокарта, поддержка Pixel Shader 2.0+',
          ram: '2 ГБ',
          storage: '500 МБ',
        },
        rec: {
          cpu: '2 GHz',
          gpu: '256MB видеокарта, поддержка Pixel Shader 2.0+',
          ram: '4 ГБ',
          storage: '500 МБ',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: false,
      avgRating: 4.9,
      reviewCount: 96,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-divinity-os2',
    data: {
      title: 'Divinity: Original Sin 2',
      titleLower: 'divinity: original sin 2',
      description: 'Эталон классических партийных RPG от Larian Studios, вдохновивших создание Baldur\'s Gate 3. Вы — Избранный, один из немногих, кто умеет управлять Источником — мощной запретной магией. В разрушенном мире Ривеллона вам предстоит освободиться из тюрьмы, собрать партию и бросить вызов богам. Глубочайшая пошаговая тактика с взаимодействием окружения, уникальные расы и происхождения, полная озвучка — один из самых богатых нарративных миров в RPG.',
      coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      genres: ['RPG', 'Strategy'],
      platforms: ['PC', 'PlayStation', 'Xbox'],
      releaseDate: new Date('2017-09-14T00:00:00Z'),
      developer: 'Larian Studios',
      publisher: 'Larian Studios',
      price: 12990,
      hardwareRequirements: {
        min: {
          cpu: 'Intel Core i5 / AMD A10',
          gpu: 'NVIDIA GeForce GTX 550 / AMD Radeon HD 6XXX',
          ram: '4 ГБ',
          storage: '60 ГБ',
        },
        rec: {
          cpu: 'Intel Core i7 / AMD Ryzen 5',
          gpu: 'NVIDIA GeForce GTX 770 / AMD Radeon R9 280X',
          ram: '8 ГБ',
          storage: '60 ГБ SSD',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: false,
      avgRating: 4.9,
      reviewCount: 44,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-monster-hunter-world',
    data: {
      title: 'Monster Hunter: World',
      titleLower: 'monster hunter: world',
      description: 'Революционная часть легендарной серии Capcom, открывшая охотничью франшизу для западной аудитории. Отправляйтесь в Новый Свет — загадочный континент, населённый колоссальными чудовищами. Выслеживайте добычу по следам, ловушкам и запахам в живой экосистеме, где монстры охотятся друг на друга. Создавайте мощное оружие и доспехи из трофеев, осваивайте 14 уникальных классов оружия и зовите друзей в кооперативные охоты на эпических боссов.',
      coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
      genres: ['Action', 'RPG'],
      platforms: ['PC', 'PlayStation', 'Xbox'],
      releaseDate: new Date('2018-01-26T00:00:00Z'),
      developer: 'Capcom',
      publisher: 'Capcom',
      price: 13490,
      hardwareRequirements: {
        min: {
          cpu: 'Intel Core i5-4460 / AMD FX-6300',
          gpu: 'NVIDIA GeForce GTX 760 / AMD Radeon R7 260x',
          ram: '8 ГБ',
          storage: '30 ГБ',
        },
        rec: {
          cpu: 'Intel Core i7-3770 / AMD Ryzen 5 1500X',
          gpu: 'NVIDIA GeForce GTX 1060 / AMD Radeon RX 570',
          ram: '8 ГБ',
          storage: '30 ГБ SSD',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: false,
      avgRating: 4.7,
      reviewCount: 52,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-doom-eternal',
    data: {
      title: 'DOOM Eternal',
      titleLower: 'doom eternal',
      description: 'Апофеоз жанра шутер от первого лица от id Software. Земля захвачена легионами ада — Палач Рока, самый смертоносный воин во вселенной, отправляется на охоту. DOOM Eternal — непрекращающийся адреналиновый марафон, требующий постоянного движения, жонглирования оружием и ресурсами в ритме тяжёлого металла. Культовый саундтрек Мика Гордона, вертикальные арены с крюком и системой "ад ресурсов" делают каждую схватку интенсивным танцем смерти.',
      coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
      genres: ['Action', 'Horror'],
      platforms: ['PC', 'PlayStation', 'Xbox'],
      releaseDate: new Date('2020-03-20T00:00:00Z'),
      developer: 'id Software',
      publisher: 'Bethesda Softworks',
      price: 10990,
      hardwareRequirements: {
        min: {
          cpu: 'Intel Core i5-2400S / AMD Phenom II X4 945',
          gpu: 'NVIDIA GeForce GTX 970 / AMD Radeon R9 290',
          ram: '8 ГБ',
          storage: '50 ГБ',
        },
        rec: {
          cpu: 'Intel Core i7-6700K / AMD Ryzen 7 1800X',
          gpu: 'NVIDIA GeForce RTX 2080 / AMD Radeon RX 5700 XT',
          ram: '8 ГБ',
          storage: '50 ГБ SSD',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: false,
      avgRating: 4.8,
      reviewCount: 38,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-the-last-of-us',
    data: {
      title: 'The Last of Us Part I',
      titleLower: 'the last of us part i',
      description: 'Признанная одной из лучших игр всех времён история выживания и человеческой связи от Naughty Dog. Постапокалиптическая Америка захвачена грибковой пандемией кордицепса, превращающей людей в агрессивных мутантов. Контрабандист Джоэл берётся переправить девочку Элли через опасную страну. Невероятно кинематографичное повествование, напряжённый стелс-геймплей с ресурсным голодом и одна из самых мощных концовок в истории интерактивных медиа.',
      coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
      genres: ['Action', 'Adventure', 'Horror'],
      platforms: ['PC', 'PlayStation'],
      releaseDate: new Date('2022-09-02T00:00:00Z'),
      developer: 'Naughty Dog',
      publisher: 'Sony Interactive Entertainment',
      price: 24990,
      hardwareRequirements: {
        min: {
          cpu: 'AMD Ryzen 5 1500X / Intel Core i7-4770K',
          gpu: 'AMD RX 5500 XT 8GB / NVIDIA GTX 970',
          ram: '16 ГБ',
          storage: '72 ГБ SSD',
        },
        rec: {
          cpu: 'AMD Ryzen 5 3600X / Intel Core i7-8700',
          gpu: 'AMD RX 5700 XT / NVIDIA RTX 2080',
          ram: '16 ГБ',
          storage: '72 ГБ NVMe SSD',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: true,
      avgRating: 4.9,
      reviewCount: 61,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-among-us',
    data: {
      title: 'Among Us',
      titleLower: 'among us',
      description: 'Феноменальная многопользовательская игра в жанре социальной дедукции от InnerSloth, покорившая весь мир в 2020 году. Члены экипажа космического корабля должны выполнять задания и вычислить среди себя Предателей — инопланетных существ, убивающих экипаж. Напряжённые обсуждения, обвинения, алиби и ложь делают каждую партию уникальным социальным экспериментом. Идеальная игра для компании от 4 до 15 человек.',
      coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
      genres: ['Indie', 'Action'],
      platforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo'],
      releaseDate: new Date('2018-06-15T00:00:00Z'),
      developer: 'InnerSloth',
      publisher: 'InnerSloth',
      price: 990,
      hardwareRequirements: {
        min: {
          cpu: 'Intel Core 2 Duo E6600 / AMD Phenom II X3 720',
          gpu: 'GeForce GT 620 / Radeon HD 6570',
          ram: '1 ГБ',
          storage: '250 МБ',
        },
        rec: {
          cpu: 'Intel Core i5-8600K / AMD Ryzen 5 2600',
          gpu: 'NVIDIA GeForce GTX 970 / AMD Radeon RX 480',
          ram: '4 ГБ',
          storage: '500 МБ',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: false,
      avgRating: 4.5,
      reviewCount: 143,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-control',
    data: {
      title: 'Control',
      titleLower: 'control',
      description: 'Сверхъестественный шутер от Remedy Entertainment в жанре "странного художественного произведения". Джесси Фейден прибывает в Федеральное Бюро Контроля — монументальное Старейшее здание в Нью-Йорке — и становится его новым Директором в разгар хаоса. Сражайтесь с паранормальной сущностью Хисс с помощью летающих обломков и телекинеза, исследуйте причудливую архитектуру постоянно меняющегося здания. Уникальная лорная глубина через случайно разбросанные документы и видеозаписи.',
      coverImage: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
      genres: ['Action', 'Adventure'],
      platforms: ['PC', 'PlayStation', 'Xbox'],
      releaseDate: new Date('2019-08-27T00:00:00Z'),
      developer: 'Remedy Entertainment',
      publisher: '505 Games',
      price: 8990,
      hardwareRequirements: {
        min: {
          cpu: 'Intel Core i5-4690 / AMD Ryzen 5 1600X',
          gpu: 'NVIDIA GeForce GTX 1060 6GB / AMD RX 580 8GB',
          ram: '8 ГБ',
          storage: '35 ГБ',
        },
        rec: {
          cpu: 'Intel Core i7-8700 / AMD Ryzen 7 2700X',
          gpu: 'NVIDIA GeForce RTX 2070 / AMD RX 5700 XT',
          ram: '16 ГБ',
          storage: '35 ГБ SSD',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: false,
      avgRating: 4.6,
      reviewCount: 27,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-cuphead',
    data: {
      title: 'Cuphead',
      titleLower: 'cuphead',
      description: 'Неповторимый run-and-gun в стиле мультфильмов 1930-х годов от Studio MDHR. Чашечник и Дружок проиграли душу дьяволу и вынуждены собирать долги с таких же неудачников по всему острову. Каждый уровень — уникальный боссфайт, нарисованный вручную в стиле классической анимации Fleischer Studios. Безупречный джазовый оркестровый саундтрек, сумасшедшая сложность боссов и невероятная художественная работа, ставшая культовым явлением в игровой индустрии.',
      coverImage: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
      genres: ['Action', 'Indie'],
      platforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo'],
      releaseDate: new Date('2017-09-29T00:00:00Z'),
      developer: 'Studio MDHR',
      publisher: 'Studio MDHR',
      price: 4990,
      hardwareRequirements: {
        min: {
          cpu: 'Intel Core 2 Duo E8400',
          gpu: 'Intel HD 4000',
          ram: '4 ГБ',
          storage: '6 ГБ',
        },
        rec: {
          cpu: 'Intel i5 Core (2nd Gen)',
          gpu: 'NVIDIA GeForce GTX 960 / AMD Radeon R9 380X',
          ram: '4 ГБ',
          storage: '6 ГБ',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: false,
      avgRating: 4.8,
      reviewCount: 35,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-persona-5-royal',
    data: {
      title: 'Persona 5 Royal',
      titleLower: 'persona 5 royal',
      description: 'Культовая японская RPG от Atlus, признанная одной из лучших игр своего поколения. Токио: старшеклассник Рен Амамия, несправедливо осуждённый за преступление которого не совершал, переводится в новую школу. Вместе с друзьями он создаёт Призрачных воров — группу, проникающую в "Дворцы" порочных взрослых и крадущую их искажённые желания. Стильнейшая в истории UI-система, глубокая социальная система Конфидантов и захватывающие пошаговые бои.',
      coverImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
      genres: ['RPG', 'Adventure'],
      platforms: ['PC', 'PlayStation', 'Xbox'],
      releaseDate: new Date('2022-10-21T00:00:00Z'),
      developer: 'Atlus',
      publisher: 'Atlus',
      price: 19990,
      hardwareRequirements: {
        min: {
          cpu: 'Intel Core i5-2520M / AMD A10-5750M',
          gpu: 'NVIDIA GeForce GTX 670 / AMD Radeon HD 7870',
          ram: '8 ГБ',
          storage: '45 ГБ',
        },
        rec: {
          cpu: 'Intel Core i7-4770 / AMD Ryzen 5 2600',
          gpu: 'NVIDIA GeForce GTX 1060 / AMD Radeon RX 480',
          ram: '8 ГБ',
          storage: '45 ГБ SSD',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: true,
      avgRating: 4.9,
      reviewCount: 48,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-bioshock-infinite',
    data: {
      title: 'BioShock Infinite',
      titleLower: 'bioshock infinite',
      description: 'Шедевральный нарративный шутер от Irrational Games. 1912 год: агент Бюро Пинкертона Букер ДеВитт прибывает в парящий над облаками утопический город Колумбия, чтобы найти и освободить девушку по имени Элизабет. Колумбия — блестящий американский экзепционализм, за фасадом которого скрыты расизм, фанатизм и социальное неравенство. Элизабет — одна из лучших NPC-компаньонов в истории игр. Мощнейший финальный твист, навсегда изменивший взгляд игроков на рассказанную историю.',
      coverImage: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
      genres: ['Action', 'Adventure'],
      platforms: ['PC', 'PlayStation', 'Xbox'],
      releaseDate: new Date('2013-03-26T00:00:00Z'),
      developer: 'Irrational Games',
      publisher: '2K Games',
      price: 7490,
      hardwareRequirements: {
        min: {
          cpu: 'Intel Core 2 DUO 2.4 GHz / AMD Athlon X2 2.7 GHz',
          gpu: 'NVIDIA GeForce GTX 260 / ATI Radeon HD 4870',
          ram: '4 ГБ',
          storage: '30 ГБ',
        },
        rec: {
          cpu: 'Quad Core Processor (Intel / AMD)',
          gpu: 'NVIDIA GeForce GTX 560 / ATI Radeon HD 6950',
          ram: '4 ГБ',
          storage: '30 ГБ',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: false,
      avgRating: 4.8,
      reviewCount: 56,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-metal-gear-v',
    data: {
      title: 'Metal Gear Solid V: The Phantom Pain',
      titleLower: 'metal gear solid v: the phantom pain',
      description: 'Финальный шедевр Хидэо Кодзимы в серии Metal Gear. Биг Босс пробуждается из комы после девяти лет, чтобы отомстить тем, кто уничтожил его Армию-мать. Открытый мир Афганистана и Западной Африки становится полигоном для почти безграничной тактической свободы: бесшумный стелс, прямой штурм, фультонная эвакуация врагов в штаб, управление ресурсами Матери-базы. Непревзойдённая система ИИ врагов и бесконечно вариативный геймплей.',
      coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
      genres: ['Action', 'Adventure'],
      platforms: ['PC', 'PlayStation', 'Xbox'],
      releaseDate: new Date('2015-09-01T00:00:00Z'),
      developer: 'Kojima Productions',
      publisher: 'Konami',
      price: 8990,
      hardwareRequirements: {
        min: {
          cpu: 'Intel Core i5-4460 / AMD FX-6300',
          gpu: 'NVIDIA GeForce GTX 650 (2GB) / AMD Radeon HD 7770 (2GB)',
          ram: '4 ГБ',
          storage: '28 ГБ',
        },
        rec: {
          cpu: 'Intel Core i7-4770 / AMD Ryzen 5 1600',
          gpu: 'NVIDIA GeForce GTX 760 / AMD Radeon R9 280X',
          ram: '8 ГБ',
          storage: '28 ГБ SSD',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: false,
      avgRating: 4.8,
      reviewCount: 43,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-ori-will-wisps',
    data: {
      title: 'Ori and the Will of the Wisps',
      titleLower: 'ori and the will of the wisps',
      description: 'Великолепное продолжение одной из самых красивых платформенных игр от Moon Studios. Дух леса Ори исследует новый мир за пределами леса Нибел в поисках своего друга Ку. Игра поражает безупречной акварельной анимацией, трогательным музыкальным сопровождением Гэрета Косера и отточенным платформенным геймплеем с мгновенной отзывчивостью управления. Новая боевая система и разнообразные способности делают каждую зону уникальным игровым опытом.',
      coverImage: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80',
      genres: ['Action', 'Adventure', 'Indie'],
      platforms: ['PC', 'Xbox'],
      releaseDate: new Date('2020-03-11T00:00:00Z'),
      developer: 'Moon Studios',
      publisher: 'Xbox Game Studios',
      price: 4990,
      hardwareRequirements: {
        min: {
          cpu: 'Intel Core i5-6400 / AMD Ryzen 3 1300X',
          gpu: 'NVIDIA GeForce GTX 950 / AMD Radeon R9 380X',
          ram: '8 ГБ',
          storage: '20 ГБ',
        },
        rec: {
          cpu: 'Intel Core i7-7700K / AMD Ryzen 5 2600X',
          gpu: 'NVIDIA GeForce GTX 1070 / AMD Radeon RX Vega 56',
          ram: '16 ГБ',
          storage: '20 ГБ SSD',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: false,
      avgRating: 4.9,
      reviewCount: 22,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-celeste',
    data: {
      title: 'Celeste',
      titleLower: 'celeste',
      description: 'Душевная инди-платформенная игра о борьбе с тревожностью и внутренними демонами. Мэдлин покоряет легендарную гору Селест, но самым трудным испытанием становится не физический подъём, а противостояние с собственным "тёмным я". Мастерски выверенный платформинг с механикой рывка и уникальными препятствиями на каждом экране — игра честно трудна, но всегда справедлива. Трогательная история о принятии себя и невероятный чиптюн-саундтрек Lena Raine.',
      coverImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
      genres: ['Indie', 'Action'],
      platforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo'],
      releaseDate: new Date('2018-01-25T00:00:00Z'),
      developer: 'Maddy Makes Games',
      publisher: 'Maddy Makes Games',
      price: 3490,
      hardwareRequirements: {
        min: {
          cpu: 'Intel Core i3-3210 / AMD A8-7600',
          gpu: 'GeForce 400 / Radeon HD 6000 (1GB VRAM)',
          ram: '2 ГБ',
          storage: '1.2 ГБ',
        },
        rec: {
          cpu: 'Intel Core i7-7700K / AMD Ryzen 5 2600',
          gpu: 'NVIDIA GeForce GTX 1070 / AMD Radeon RX 580',
          ram: '4 ГБ',
          storage: '1.2 ГБ SSD',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: false,
      avgRating: 4.9,
      reviewCount: 31,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  },
  {
    id: 'seed-game-outer-wilds',
    data: {
      title: 'Outer Wilds',
      titleLower: 'outer wilds',
      description: 'Возможно, самый уникальный игровой опыт последнего десятилетия от Mobius Digital. Вы — молодой астронавт, застрявший в петле из 22 минут перед взрывом местного солнца. Исследуйте миниатюрную солнечную систему, полную физических загадок и архитектурных руин древней цивилизации Номаев. Игра не даёт никаких подсказок — только знания, которые вы несёте от цикла к циклу. Финальный акт вызывает у большинства игроков слёзы. Абсолютно незабываемое путешествие.',
      coverImage: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
      genres: ['Adventure', 'Indie'],
      platforms: ['PC', 'PlayStation', 'Xbox'],
      releaseDate: new Date('2019-05-28T00:00:00Z'),
      developer: 'Mobius Digital',
      publisher: 'Annapurna Interactive',
      price: 5490,
      hardwareRequirements: {
        min: {
          cpu: 'Intel Core i5-2300 / AMD FX-4350',
          gpu: 'NVIDIA GeForce GTX 460 / AMD Radeon R7 260X',
          ram: '4 ГБ',
          storage: '7 ГБ',
        },
        rec: {
          cpu: 'Intel Core i7-2700K / AMD Ryzen 5 1600X',
          gpu: 'NVIDIA GeForce GTX 960 / AMD Radeon R9 390X',
          ram: '8 ГБ',
          storage: '7 ГБ SSD',
        },
      },
      screenshots: [],
      videoURL: '',
      featured: false,
      avgRating: 4.9,
      reviewCount: 19,
      createdAt: new Date(),
      createdBy: 'seed',
    }
  }
];

export const sampleReviews = [
  {
    id: 'seed-review-cyberpunk-1',
    data: {
      gameId: 'seed-game-cyberpunk-2077',
      userId: 'system-demo-user',
      userName: 'КиберПанк_Алматы',
      rating: 5,
      text: 'После масштабного обновления 2.0 игра преобразилась полностью. Найт-Сити завораживает своей глубиной, а сюжет оставляет мощные эмоции.',
      createdAt: new Date(),
    }
  },
  {
    id: 'seed-review-witcher-1',
    data: {
      gameId: 'seed-game-witcher-3',
      userId: 'system-demo-user',
      userName: 'Алишер К.',
      rating: 5,
      text: 'Лучшая RPG всех времен. Прошел трижды со всеми дополнениями — сюжет и музыка на Скеллиге до мурашек.',
      createdAt: new Date(),
    }
  },
  {
    id: 'seed-review-bg3-1',
    data: {
      gameId: 'seed-game-baldurs-gate-3',
      userId: 'system-demo-user',
      userName: 'Тимур Тамерлан',
      rating: 5,
      text: 'Невероятная глубина и вариативность. Larian создали эталон, на который разработчики будут ориентироваться ближайшие 10 лет.',
      createdAt: new Date(),
    }
  }
];

async function writeDocument(collection, docId, data, idToken = null) {
  const url = `${BASE_URL}/${collection}/${docId}?key=${API_KEY}`;
  const headers = { 'Content-Type': 'application/json' };
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }
  const body = JSON.stringify(toFirestoreFields(data));

  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`[${res.status}] ${json.error?.message || JSON.stringify(json)}`);
  }
  return json;
}

export async function runSeed(idToken = null) {
  console.log(`🚀 Seeding Firestore for project: ${PROJECT_ID} (Prices in ₸)...`);

  console.log(`\n📦 Seeding ${sampleGames.length} games collection in Tenge...`);
  for (const game of sampleGames) {
    try {
      await writeDocument('games', game.id, game.data, idToken);
      console.log(`  ✓ Written: games/${game.id} — "${game.data.title}" (${game.data.price.toLocaleString('ru-RU')} ₸)`);
    } catch (err) {
      console.error(`  ✗ Failed: games/${game.id}: ${err.message}`);
    }
  }

  console.log(`\n⭐ Seeding ${sampleReviews.length} sample reviews...`);
  for (const rev of sampleReviews) {
    try {
      await writeDocument('reviews', rev.id, rev.data, idToken);
      console.log(`  ✓ Written: reviews/${rev.id}`);
    } catch (err) {
      console.error(`  ✗ Failed: reviews/${rev.id}: ${err.message}`);
    }
  }

  console.log('\n🏁 Seeding complete. All prices in Tenge (₸) with detailed descriptions!');
}

if (process.argv[1]?.endsWith('seed-database.mjs')) {
  const idToken = process.argv[2] || null;
  runSeed(idToken).catch(console.error);
}
