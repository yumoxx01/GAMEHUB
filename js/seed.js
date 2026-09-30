/**
 * seed.js
 * Game Hub — Sample data seeder (Prices in Tenge ₸)
 */

import {
  doc,
  setDoc,
  Timestamp,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { db }          from './firebase-config.js';
import { COLLECTIONS } from './firestore-schema.js';

function buildSampleGames() {
  return [
    {
      id: 'seed-game-cyberpunk-2077',
      data: {
        title:       'Cyberpunk 2077',
        titleLower:  'cyberpunk 2077',
        description: 'Грандиозная ролевая игра в открытом мире от CD Projekt RED. Действие разворачивается в сверкающем неоном мегаполисе Найт-Сити — городе будущего, где модификации тела, власть и корпоративное влияние стали религией. Вы играете за V (Ви) — наемника в поисках уникального чипа бессмертия. Вас ждут десятки часов нелинейного сюжета с Киану Ривзом в роли Джонни Сильверхенда, глубокая кастомизация киберимплантов, тактические перестрелки и возможность взлома сетей врагов.',
        coverImage:  'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
        genres:      ['RPG', 'Action', 'Adventure'],
        platforms:   ['PC', 'PlayStation', 'Xbox'],
        releaseDate: Timestamp.fromDate(new Date('2020-12-10')),
        developer:   'CD Projekt RED',
        publisher:   'CD Projekt',
        price:       14990,
        hardwareRequirements: {
          min: {
            cpu:     'Intel Core i7-6700K / AMD Ryzen 5 1600',
            gpu:     'NVIDIA GTX 1060 6GB / AMD Radeon RX 580 8GB',
            ram:     '12 ГБ',
            storage: '70 ГБ SSD',
          },
          rec: {
            cpu:     'Intel Core i7-8700K / AMD Ryzen 5 3600',
            gpu:     'NVIDIA RTX 2060 Super / AMD Radeon RX 5700 XT',
            ram:     '16 ГБ',
            storage: '70 ГБ SSD',
          },
        },
        screenshots:  [],
        videoURL:     '',
        featured:     true,
        avgRating:    4.8,
        reviewCount:  32,
        createdAt:    serverTimestamp(),
        createdBy:    'seed',
      },
    },
    {
      id: 'seed-game-elden-ring',
      data: {
        title:       'Elden Ring',
        titleLower:  'elden ring',
        description: 'Триумфальный шедевр жанра Action-RPG от Хидэтаки Миядзаки и FromSoftware, созданный в соавторстве с автором "Игры престолов" Джорджем Р. Р. Мартином. Отправляйтесь в монументальные Земли Между, чтобы собрать осколки Кольца Элден и стать новым Повелителем. Вас ждет беспрецедентный по масштабу бесшовный открытый мир, верный скакун Поток, сотни видов оружия и заклинаний, а также эпические битвы с полубогами, требующие максимального мастерства.',
        coverImage:  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
        genres:      ['Action', 'RPG'],
        platforms:   ['PC', 'PlayStation', 'Xbox'],
        releaseDate: Timestamp.fromDate(new Date('2022-02-25')),
        developer:   'FromSoftware',
        publisher:   'Bandai Namco Entertainment',
        price:       21990,
        hardwareRequirements: {
          min: {
            cpu:     'Intel Core i5-8400 / AMD Ryzen 3 3300X',
            gpu:     'NVIDIA GeForce GTX 1060 3GB / AMD Radeon RX 580 4GB',
            ram:     '12 ГБ',
            storage: '60 ГБ SSD',
          },
          rec: {
            cpu:     'Intel Core i7-8700K / AMD Ryzen 5 3600X',
            gpu:     'NVIDIA GeForce GTX 1070 8GB / AMD RX Vega 56 8GB',
            ram:     '16 ГБ',
            storage: '60 ГБ SSD',
          },
        },
        screenshots:  [],
        videoURL:     '',
        featured:     true,
        avgRating:    4.9,
        reviewCount:  45,
        createdAt:    serverTimestamp(),
        createdBy:    'seed',
      },
    },
    {
      id: 'seed-game-witcher-3',
      data: {
        title:       'Ведьмак 3: Дикая Охота',
        titleLower:  'ведьмак 3: дикая охота',
        description: 'Эталон сюжетных ролевых игр нового поколения. В роли ведьмака Геральта из Ривии, профессионального охотника на монстров, вы отправляетесь на поиски Цири — Дитя Предназначения, за которой охотится призрачная кавалькада Дикой Охоты. Огромный мир от раздираемого войной Велена и шумного Новиграда до суровых островов Скеллиге полон мрачных славянских сказок, морально неоднозначных решений и незабываемых персонажей.',
        coverImage:  'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80',
        genres:      ['RPG', 'Adventure', 'Action'],
        platforms:   ['PC', 'PlayStation', 'Xbox', 'Nintendo'],
        releaseDate: Timestamp.fromDate(new Date('2015-05-18')),
        developer:   'CD Projekt RED',
        publisher:   'CD Projekt',
        price:       9990,
        hardwareRequirements: {
          min: {
            cpu:     'Intel Core i5-2500K / AMD Phenom II X4 940',
            gpu:     'NVIDIA GeForce GTX 660 / AMD Radeon HD 7870',
            ram:     '6 ГБ',
            storage: '50 ГБ',
          },
          rec: {
            cpu:     'Intel Core i7-3770 / AMD FX-8350',
            gpu:     'NVIDIA GeForce GTX 1060 6GB / AMD Radeon RX 590',
            ram:     '16 ГБ',
            storage: '50 ГБ SSD',
          },
        },
        screenshots:  [],
        videoURL:     '',
        featured:     true,
        avgRating:    4.9,
        reviewCount:  58,
        createdAt:    serverTimestamp(),
        createdBy:    'seed',
      },
    },
    {
      id: 'seed-game-baldurs-gate-3',
      data: {
        title:       "Baldur's Gate 3",
        titleLower:  "baldur's gate 3",
        description: "Триумфальная партийная ролевая игра нового поколения по вселенной Dungeons & Dragons от Larian Studios. В ваш мозг внедрен личиночный паразит иллитидов, наделяющий пугающей силой, но грозящий превратить в чудовище. Соберите уникальную партию спутников, раскройте их судьбы и отправляйтесь в грандиозный поход по Забытым Королевствам. Вас ждут пошаговые тактические бои с физикой окружения и безграничная вариативность отыгрыша.",
        coverImage:  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        genres:      ['RPG', 'Strategy'],
        platforms:   ['PC', 'PlayStation', 'Xbox'],
        releaseDate: Timestamp.fromDate(new Date('2023-08-03')),
        developer:   'Larian Studios',
        publisher:   'Larian Studios',
        price:       23990,
        hardwareRequirements: {
          min: {
            cpu:     'Intel Core i5 4690 / AMD FX 8350',
            gpu:     'NVIDIA GeForce GTX 970 / AMD RX 480',
            ram:     '8 ГБ',
            storage: '150 ГБ SSD',
          },
          rec: {
            cpu:     'Intel Core i7 8700K / AMD Ryzen 5 3600',
            gpu:     'NVIDIA GeForce RTX 2060 Super / AMD RX 5700 XT',
            ram:     '16 ГБ',
            storage: '150 ГБ SSD',
          },
        },
        screenshots:  [],
        videoURL:     '',
        featured:     true,
        avgRating:    5.0,
        reviewCount:  47,
        createdAt:    serverTimestamp(),
        createdBy:    'seed',
      },
    },
    {
      id: 'seed-game-rdr2',
      data: {
        title:       'Red Dead Redemption 2',
        titleLower:  'red dead redemption 2',
        description: 'Грандиозный кинематографичный вестерн от Rockstar Games, признанный одной из величайших игр в истории индустрии. Америка, 1899 год. Эпоха Дикого Запада угасает, законники безжалостно охотятся на последние банды. Вы — Артур Морган, преданный член банды Датча ван дер Линде. Ограбления поездов, охота в диких лесах, дуэли на револьверах, живая дикая природа и глубочайшая драма о семье, верности и цене искупления грехов.',
        coverImage:  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
        genres:      ['Action', 'Adventure'],
        platforms:   ['PC', 'PlayStation', 'Xbox'],
        releaseDate: Timestamp.fromDate(new Date('2018-10-26')),
        developer:   'Rockstar Games',
        publisher:   'Rockstar Games',
        price:       18990,
        hardwareRequirements: {
          min: {
            cpu:     'Intel Core i5-2500K / AMD FX-6300',
            gpu:     'NVIDIA GeForce GTX 770 2GB / AMD Radeon R9 280 3GB',
            ram:     '8 ГБ',
            storage: '150 ГБ',
          },
          rec: {
            cpu:     'Intel Core i7-4770K / AMD Ryzen 5 1500X',
            gpu:     'NVIDIA GeForce GTX 1060 6GB / AMD Radeon RX 480 4GB',
            ram:     '12 ГБ',
            storage: '150 ГБ SSD',
          },
        },
        screenshots:  [],
        videoURL:     '',
        featured:     true,
        avgRating:    4.9,
        reviewCount:  63,
        createdAt:    serverTimestamp(),
        createdBy:    'seed',
      },
    },
    {
      id: 'seed-game-gow-ragnarok',
      data: {
        title:       'God of War Ragnarök',
        titleLower:  'god of war ragnarök',
        description: 'Эпическое продолжение скандинавской саги о спартанском боге войны Кратосе и его взрослеющем сыне Атрее. Надвигается Фимбулвинтер — трехлетняя зима, предвещающая Рагнарёк, гибель богов и всего сущего. Отец и сын должны посетить каждый из Девяти миров в поисках союзников и своего места в пророчестве. Безупречная боевая система с топором Левиафан и Клинками Хаоса, кинематографичная камера без монтажных склеек и трогательная семейная история.',
        coverImage:  'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
        genres:      ['Action', 'Adventure'],
        platforms:   ['PlayStation', 'PC'],
        releaseDate: Timestamp.fromDate(new Date('2022-11-09')),
        developer:   'Santa Monica Studio',
        publisher:   'Sony Interactive Entertainment',
        price:       27990,
        hardwareRequirements: {
          min: {
            cpu:     'Intel Core i5-6600k / AMD Ryzen 5 2400 G',
            gpu:     'NVIDIA GTX 1060 6GB / AMD RX 570 4GB',
            ram:     '16 ГБ',
            storage: '190 ГБ SSD',
          },
          rec: {
            cpu:     'Intel Core i7-7700k / AMD Ryzen 5 3600X',
            gpu:     'NVIDIA RTX 2060 Super / AMD RX 5700',
            ram:     '16 ГБ',
            storage: '190 ГБ SSD',
          },
        },
        screenshots:  [],
        videoURL:     '',
        featured:     true,
        avgRating:    4.8,
        reviewCount:  39,
        createdAt:    serverTimestamp(),
        createdBy:    'seed',
      },
    },
    {
      id: 'seed-game-zelda-totk',
      data: {
        title:       'The Legend of Zelda: Tears of the Kingdom',
        titleLower:  'the legend of zelda: tears of the kingdom',
        description: 'Шедевр для Nintendo Switch, расширивший горизонты приключенческих игр. Линк возвращается в королевство Хайрул, где после пробуждения древнего зла открылись загадочные парящие острова в небесах и бескрайние опасные Каверны в глубинах земли. Новые революционные механики "Комбинирование", "Автосборка" и "Чароплет" позволяют объединять предметы, строить летательные аппараты, боевые машины и преодолевать любые препятствия безграничной фантазией игрока.',
        coverImage:  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
        genres:      ['Adventure', 'Action', 'Puzzle'],
        platforms:   ['Nintendo'],
        releaseDate: Timestamp.fromDate(new Date('2023-05-12')),
        developer:   'Nintendo EPD',
        publisher:   'Nintendo',
        price:       29990,
        hardwareRequirements: {
          min: {
            cpu:     'Nintendo Switch SoC (ARM Cortex-A57 × 4)',
            gpu:     'NVIDIA Tegra X1 (256 Maxwell cores)',
            ram:     '4 ГБ',
            storage: '16.3 ГБ',
          },
          rec: {
            cpu:     'Nintendo Switch SoC (ARM Cortex-A57 × 4)',
            gpu:     'NVIDIA Tegra X1 (256 Maxwell cores)',
            ram:     '4 ГБ',
            storage: '16.3 ГБ (microSD рекомендована)',
          },
        },
        screenshots:  [],
        videoURL:     '',
        featured:     true,
        avgRating:    4.9,
        reviewCount:  28,
        createdAt:    serverTimestamp(),
        createdBy:    'seed',
      },
    },
    {
      id: 'seed-game-hades',
      data: {
        title:       'Hades',
        titleLower:  'hades',
        description: 'Захватывающий roguelike-экшен с видом сверху от студии Supergiant Games, удостоенный десятков премий "Игра года". Играя за принца Загрея, бессмертного сына повелителя подземного мира, вы пытаетесь пробиться сквозь орды чудовищ на поверхность к Олимпу. Каждый побег уникален: олимпийские боги (Зевс, Афина, Посейдон) даруют свои благословения, преображающие стиль боя. Великолепная рисованная графика, динамичный саундтрек и остроумные диалоги.',
        coverImage:  'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
        genres:      ['Action', 'Indie', 'RPG'],
        platforms:   ['PC', 'Nintendo', 'PlayStation', 'Xbox'],
        releaseDate: Timestamp.fromDate(new Date('2020-09-17')),
        developer:   'Supergiant Games',
        publisher:   'Supergiant Games',
        price:       5490,
        hardwareRequirements: {
          min: {
            cpu:     'Dual Core 2.4 GHz',
            gpu:     '2 ГБ VRAM / GeForce GTX 960, Radeon RX 470',
            ram:     '8 ГБ',
            storage: '15 ГБ',
          },
          rec: {
            cpu:     'Dual Core 3.0 GHz+',
            gpu:     '4 ГБ VRAM / GeForce GTX 1060, Radeon RX 5500 XT',
            ram:     '16 ГБ',
            storage: '15 ГБ',
          },
        },
        screenshots:  [],
        videoURL:     '',
        featured:     false,
        avgRating:    4.8,
        reviewCount:  21,
        createdAt:    serverTimestamp(),
        createdBy:    'seed',
      },
    },
    {
      id: 'seed-game-hollow-knight',
      data: {
        title:       'Hollow Knight',
        titleLower:  'hollow knight',
        description: 'Признанная классика атмосферных двухмерных метроидваний от австралийской Team Cherry. Вооружившись гвоздем, безымянный Рыцарь спускается под землю в руины павшего королевства Халлоунест. Исследуйте мрачные пещеры, заросшие сады и забытые города, сражайтесь с зараженными насекомыми, находите древние амулеты и открывайте тайны увядающего мира. Сложные платформенные испытания, молниеносные бои с боссами и чарующая музыка.',
        coverImage:  'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
        genres:      ['Indie', 'Action', 'Adventure'],
        platforms:   ['PC', 'Nintendo', 'PlayStation', 'Xbox'],
        releaseDate: Timestamp.fromDate(new Date('2017-02-24')),
        developer:   'Team Cherry',
        publisher:   'Team Cherry',
        price:       3690,
        hardwareRequirements: {
          min: {
            cpu:     'Intel Core 2 Duo E5200',
            gpu:     'GeForce 9800GTX+ (1GB)',
            ram:     '4 ГБ',
            storage: '9 ГБ',
          },
          rec: {
            cpu:     'Intel Core i5',
            gpu:     'GeForce GTX 560',
            ram:     '8 ГБ',
            storage: '9 ГБ',
          },
        },
        screenshots:  [],
        videoURL:     '',
        featured:     false,
        avgRating:    4.9,
        reviewCount:  53,
        createdAt:    serverTimestamp(),
        createdBy:    'seed',
      },
    },
    {
      id: 'seed-game-forza-5',
      data: {
        title:       'Forza Horizon 5',
        titleLower:  'forza horizon 5',
        description: 'Главная гоночная аркада современности в открытом мире. Вас ждет бесконечный автомобильный фестиваль в потрясающе красивой и разнообразной Мексике — от песчаных дюн и затерянных храмов майя до шумных колониальных городов и действующего вулкана. В вашем распоряжении сотни лицензированных суперкаров, динамическая смена погоды, пыльные бури и тропические штормы, а также бесконечные заезды с друзьями по сети.',
        coverImage:  'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
        genres:      ['Racing', 'Action'],
        platforms:   ['PC', 'Xbox'],
        releaseDate: Timestamp.fromDate(new Date('2021-11-09')),
        developer:   'Playground Games',
        publisher:   'Xbox Game Studios',
        price:       19990,
        hardwareRequirements: {
          min: {
            cpu:     'Intel i5-4460 / AMD Ryzen 3 1200',
            gpu:     'NVIDIA GTX 970 / AMD Radeon RX 470',
            ram:     '8 ГБ',
            storage: '110 ГБ',
          },
          rec: {
            cpu:     'Intel i7-10700K / AMD Ryzen 7 3800XT',
            gpu:     'NVIDIA RTX 2070 / AMD Radeon RX 6700 XT',
            ram:     '16 ГБ',
            storage: '110 ГБ SSD',
          },
        },
        screenshots:  [],
        videoURL:     '',
        featured:     false,
        avgRating:    4.7,
        reviewCount:  16,
        createdAt:    serverTimestamp(),
        createdBy:    'seed',
      },
    },
    {
      id: 'seed-game-re4-remake',
      data: {
        title:       'Resident Evil 4 Remake',
        titleLower:  'resident evil 4 remake',
        description: 'Эталонный ремейк легендарного survival horror от Capcom на передовом движке RE Engine. Спустя шесть лет после катастрофы в Раккун-Сити агент Леон С. Кеннеди отправляется на спасение похищенной дочери президента США в отдаленную европейскую деревушку, жители которой поражены жутким паразитом Лас-Плагас. Напряженные перестрелки, система парирования ножом, менеджмент инвентаря в дипломате и постоянная нехватка патронов.',
        coverImage:  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
        genres:      ['Action', 'Horror'],
        platforms:   ['PC', 'PlayStation', 'Xbox'],
        releaseDate: Timestamp.fromDate(new Date('2023-03-24')),
        developer:   'Capcom',
        publisher:   'Capcom',
        price:       21490,
        hardwareRequirements: {
          min: {
            cpu:     'AMD Ryzen 3 1200 / Intel Core i5-7500',
            gpu:     'NVIDIA GeForce GTX 1050 Ti 4GB / AMD Radeon RX 560 4GB',
            ram:     '8 ГБ',
            storage: '70 ГБ',
          },
          rec: {
            cpu:     'AMD Ryzen 5 3600 / Intel Core i7 8700',
            gpu:     'NVIDIA GeForce GTX 1070 / AMD Radeon RX 5700',
            ram:     '16 ГБ',
            storage: '70 ГБ SSD',
          },
        },
        screenshots:  [],
        videoURL:     '',
        featured:     false,
        avgRating:    4.8,
        reviewCount:  29,
        createdAt:    serverTimestamp(),
        createdBy:    'seed',
      },
    },
    {
      id: 'seed-game-gta-5',
      data: {
        title:       'Grand Theft Auto V',
        titleLower:  'grand theft auto v',
        description: 'Монументальный хит от Rockstar Games. В центре повествования — три колоритных персонажа: бывший грабитель банков Майкл, уличный гангстер Франклин и непредсказуемый психопат Тревор. Переключайтесь между героями на лету, планируйте и проводите дерзкие многоэтапные ограбления по всему штату Сан-Андреас и городу Лос-Сантос. Безграничный мир с тысячами занятий, перестрелками, тюнингом тачек и едкой сатирой на современное общество.',
        coverImage:  'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
        genres:      ['Action', 'Adventure'],
        platforms:   ['PC', 'PlayStation', 'Xbox'],
        releaseDate: Timestamp.fromDate(new Date('2013-09-17')),
        developer:   'Rockstar North',
        publisher:   'Rockstar Games',
        price:       9990,
        hardwareRequirements: {
          min: {
            cpu:     'Intel Core 2 Quad Q6600 2.40GHz / AMD Phenom 9850',
            gpu:     'NVIDIA 9800 GT 1GB / AMD HD 4870 1GB',
            ram:     '4 ГБ',
            storage: '72 ГБ',
          },
          rec: {
            cpu:     'Intel Core i5 3470 3.2GHz / AMD FX-8350 4GHz',
            gpu:     'NVIDIA GTX 660 2GB / AMD HD 7870 2GB',
            ram:     '8 ГБ',
            storage: '72 ГБ',
          },
        },
        screenshots:  [],
        videoURL:     '',
        featured:     true,
        avgRating:    4.8,
        reviewCount:  88,
        createdAt:    serverTimestamp(),
        createdBy:    'seed',
      },
    },
  ];
}

export async function seedSampleGames() {
  console.group('[seed] Перезапись базы данных с ценами в тенге (₸)...');
  const games = buildSampleGames();

  for (const game of games) {
    const ref = doc(db, COLLECTIONS.GAMES, game.id);
    try {
      await setDoc(ref, game.data, { merge: true });
      console.log(`[seed] УСПЕХ: ${game.id} — "${game.data.title}" (${game.data.price} ₸)`);
    } catch (err) {
      console.error(`[seed] ОШИБКА записи ${game.id}:`, err);
    }
  }

  console.log('[seed] Готово! Все 12 игр успешно обновлены.');
  console.groupEnd();
}

if (typeof window !== 'undefined') {
  window.__seedSampleGames = seedSampleGames;
  console.info('[seed.js] Загружен — вызовите window.__seedSampleGames() в консоли для наполнения базы');
}
