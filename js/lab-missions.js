// lab-missions.js — Lab Tab: Mission Guide (OSRO Midrate)

(function () {
  const NON_TRANS_EXP_JOBS = [
    'Novice', 'Super Novice', 'Swordman', 'Mage', 'Archer', 'Acolyte',
    'Merchant', 'Thief', 'Knight', 'Priest', 'Blacksmith', 'Hunter',
    'Assassin', 'Crusader', 'Monk', 'Sage', 'Rogue', 'Alchemist',
    'Bard', 'Dancer', 'Taekwon', 'Star Gladiator', 'Soul Linker',
    'Gunslinger', 'Ninja'
  ];

  const SPEED_LIMIT_JOBS = [
    'Novice', 'Super Novice', 'Archer', 'Hunter', 'Rogue'
  ];

  const MISSIONS = [
    // ── PRONTERA (9) ──────────────────────────────────────────────────────────
    {
      id: 1,
      name: 'Train it like Miley',
      map: 'Prontera',
      tier: 'Standard',
      minLevel: 99,
      timeMins: 10,
      jobs: 'All',
      jobsList: null,
      jobsSummary: 'All Jobs',
      mobs: [
        { id: 1002, name: 'Poring', count: 33 },
        { id: 1113, name: 'Drops', count: 44 },
        { id: 1031, name: 'Poporing', count: 55 }
      ],
      items: [],
      baseExp: 250000,
      jobExp: 125000,
      zeny: 5000000,
      activityPts: 3,
      rewards: []
    },
    {
      id: 2,
      name: 'The White Bear Killa!',
      map: 'Prontera',
      tier: 'Standard',
      minLevel: 99,
      timeMins: 60,
      jobs: 'All',
      jobsList: null,
      jobsSummary: 'All Jobs',
      mobs: [
        { id: 1243, name: 'Sasquatch', count: 300 }
      ],
      items: [],
      baseExp: 500000,
      jobExp: 250000,
      zeny: 10000000,
      activityPts: 3,
      rewards: []
    },
    {
      id: 3,
      name: 'The Daily Lootbucks',
      map: 'Prontera',
      tier: 'Standard',
      minLevel: 99,
      timeMins: 60,
      jobs: 'All',
      jobsList: null,
      jobsSummary: 'All Jobs',
      mobs: [],
      items: [
        { id: 914, name: 'Fluff', count: 100 },
        { id: 949, name: 'Feather', count: 100 },
        { id: 705, name: 'Clover', count: 100 }
      ],
      baseExp: 500000,
      jobExp: 250000,
      zeny: 1000000,
      activityPts: 2,
      rewards: []
    },
    {
      id: 4,
      name: 'The Speed Limit',
      map: 'Prontera',
      tier: 'Speed / Job',
      minLevel: 1,
      timeMins: 9,
      jobs: 'Novice, Super Novice, Archer, Hunter, Rogue',
      jobsList: SPEED_LIMIT_JOBS,
      jobsSummary: '5 Jobs Only',
      mobs: [
        { id: 1007, name: 'Fabre', count: 200 }
      ],
      items: [],
      baseExp: 500000,
      jobExp: 500000,
      zeny: 5000000,
      activityPts: 4,
      rewards: []
    },
    {
      id: 5,
      name: "The Prisoner's Delivery",
      map: 'Prontera',
      tier: 'Standard',
      minLevel: 70,
      timeMins: 60,
      jobs: 'All',
      jobsList: null,
      jobsSummary: 'All Jobs',
      mobs: [
        { id: 1196, name: 'Skeleton Prisoner', count: 300 },
        { id: 1197, name: 'Zombie Prisoner', count: 300 }
      ],
      items: [
        { id: 1015, name: 'Tongue', count: 10 },
        { id: 943, name: 'Solid Shell', count: 100 },
        { id: 660, name: 'Forbidden Red Candle', count: 30 }
      ],
      baseExp: 900000,
      jobExp: 450000,
      zeny: 10000000,
      activityPts: 6,
      rewards: [
        { id: 40151, name: 'Seed Box [10]', sheetName: 'Yggseed Box', count: 1 },
        { id: 40152, name: 'Berry Box [10]', sheetName: 'Yggberry Box', count: 1 },
        { id: 40153, name: 'Thunder Box [10]', sheetName: 'Thunder Box', count: 1 }
      ]
    },
    {
      id: 6,
      name: 'Rookie MVP - Alpha',
      map: 'Prontera',
      tier: 'MVP',
      minLevel: 185,
      timeMins: 30,
      jobs: 'All',
      jobsList: null,
      jobsSummary: 'All Jobs',
      mobs: [
        { id: 1115, name: 'Eddga', count: 5, mvp: true },
        { id: 1059, name: 'Mistress', count: 5, mvp: true },
        { id: 1150, name: 'Moonlight Flower', count: 5, mvp: true },
        { id: 1147, name: 'Maya', count: 5, mvp: true }
      ],
      items: [],
      baseExp: 1000000,
      jobExp: 500000,
      zeny: 10000000,
      activityPts: 5,
      rewards: [
        { id: 40151, name: 'Seed Box [10]', sheetName: 'Yggseed Box', count: 1 },
        { id: 40152, name: 'Berry Box [10]', sheetName: 'Yggberry Box', count: 1 },
        { id: 40153, name: 'Thunder Box [10]', sheetName: 'Thunder Box', count: 1 }
      ]
    },
    {
      id: 7,
      name: 'Rookie MVP - Beta',
      map: 'Prontera',
      tier: 'MVP',
      minLevel: 185,
      timeMins: 30,
      jobs: 'All',
      jobsList: null,
      jobsSummary: 'All Jobs',
      mobs: [
        { id: 1159, name: 'Phreeoni', count: 5, mvp: true },
        { id: 1312, name: 'Turtle General', count: 5, mvp: true },
        { id: 1087, name: 'Orc Hero', count: 5, mvp: true },
        { id: 1190, name: 'Orc Lord', count: 5, mvp: true }
      ],
      items: [],
      baseExp: 1000000,
      jobExp: 500000,
      zeny: 10000000,
      activityPts: 5,
      rewards: [
        { id: 40151, name: 'Seed Box [10]', sheetName: 'Yggseed Box', count: 1 },
        { id: 40152, name: 'Berry Box [10]', sheetName: 'Yggberry Box', count: 1 },
        { id: 40153, name: 'Thunder Box [10]', sheetName: 'Thunder Box', count: 1 }
      ]
    },
    {
      id: 8,
      name: 'Rookie MVP - Theta',
      map: 'Prontera',
      tier: 'MVP',
      minLevel: 185,
      timeMins: 30,
      jobs: 'All',
      jobsList: null,
      jobsSummary: 'All Jobs',
      mobs: [
        { id: 1112, name: 'Drake', count: 5, mvp: true },
        { id: 1038, name: 'Osiris', count: 5, mvp: true },
        { id: 1046, name: 'Doppelganger', count: 5, mvp: true },
        { id: 1373, name: 'Lord the Dead', altName: 'Lord of the Dead', count: 5, mvp: true }
      ],
      items: [],
      baseExp: 1000000,
      jobExp: 500000,
      zeny: 10000000,
      activityPts: 5,
      rewards: [
        { id: 40151, name: 'Seed Box [10]', sheetName: 'Yggseed Box', count: 1 },
        { id: 40152, name: 'Berry Box [10]', sheetName: 'Yggberry Box', count: 1 },
        { id: 40153, name: 'Thunder Box [10]', sheetName: 'Thunder Box', count: 1 }
      ]
    },
    {
      id: 9,
      name: 'Rookie MVP - Epsilon',
      map: 'Prontera',
      tier: 'MVP',
      minLevel: 185,
      timeMins: 30,
      jobs: 'All',
      jobsList: null,
      jobsSummary: 'All Jobs',
      mobs: [
        { id: 1492, name: 'Samurai Specter', altName: 'Incantation Samurai', count: 5, mvp: true },
        { id: 1157, name: 'Pharaoh', count: 5, mvp: true },
        { id: 1272, name: 'Dark Lord', count: 5, mvp: true },
        { id: 1039, name: 'Baphomet', count: 5, mvp: true }
      ],
      items: [],
      baseExp: 1000000,
      jobExp: 500000,
      zeny: 10000000,
      activityPts: 5,
      rewards: [
        { id: 40151, name: 'Seed Box [10]', sheetName: 'Yggseed Box', count: 1 },
        { id: 40152, name: 'Berry Box [10]', sheetName: 'Yggberry Box', count: 1 },
        { id: 40153, name: 'Thunder Box [10]', sheetName: 'Thunder Box', count: 1 }
      ]
    },

    // ── MOROCC (9) ────────────────────────────────────────────────────────────
    {
      id: 10,
      name: 'Scorpion Knights',
      map: 'Morocc',
      tier: 'Standard',
      minLevel: 99,
      timeMins: 60,
      jobs: 'All',
      jobsList: null,
      jobsSummary: 'All Jobs',
      mobs: [
        { id: 1001, name: 'Scorpion', count: 333 }
      ],
      items: [
        { id: 904, name: 'Scorpion Tail', count: 333 }
      ],
      baseExp: 500000,
      jobExp: 250000,
      zeny: 10000000,
      activityPts: 5,
      rewards: []
    },
    {
      id: 11,
      name: 'Picky Boooooooo!',
      map: 'Morocc',
      tier: 'Speed / Job',
      minLevel: 1,
      timeMins: 10,
      jobs: 'Novice, Super Novice, Swordman, Mage, Archer, Acolyte, Merchant, Thief, Knight, Priest, Blacksmith, Hunter, Assassin, Crusader, Monk, Sage, Rogue, Alchemist, Bard, Dancer, Taekwon, Star Gladiator, Soul Linker, Gunslinger, Ninja',
      jobsList: NON_TRANS_EXP_JOBS,
      jobsSummary: 'Non-Trans & Expanded (25 Jobs)',
      mobs: [
        { id: 1049, name: 'Picky', count: 222 }
      ],
      items: [],
      baseExp: 500000,
      jobExp: 500000,
      zeny: 7500000,
      activityPts: 5,
      rewards: []
    },
    {
      id: 12,
      name: 'Not for Minors!',
      map: 'Morocc',
      tier: 'Standard',
      minLevel: 195,
      timeMins: 60,
      jobs: 'All',
      jobsList: null,
      jobsSummary: 'All Jobs',
      mobs: [
        { id: 1149, name: 'Minorous', count: 422 }
      ],
      items: [
        { id: 941, name: 'Nose Ring', count: 521 },
        { id: 4126, name: 'Minorous Card', count: 8 }
      ],
      baseExp: 1000000,
      jobExp: 500000,
      zeny: 10000000,
      activityPts: 8,
      rewards: [
        { id: 40151, name: 'Seed Box [10]', sheetName: 'Yggseed Box', count: 2 },
        { id: 40152, name: 'Berry Box [10]', sheetName: 'Yggberry Box', count: 2 },
        { id: 40153, name: 'Thunder Box [10]', sheetName: 'Thunder Box', count: 2 }
      ]
    },
    {
      id: 13,
      name: 'O, Glorious Anubis',
      map: 'Morocc',
      tier: 'Standard',
      minLevel: 195,
      timeMins: 180,
      jobs: 'All',
      jobsList: null,
      jobsSummary: 'All Jobs',
      mobs: [
        { id: 1098, name: 'Anubis', count: 666 }
      ],
      items: [
        { id: 1045, name: 'Cultish Mask', sheetName: 'Cultish Masque', count: 666 },
        { id: 4138, name: 'Anubis Card', count: 8 }
      ],
      baseExp: 1000000,
      jobExp: 500000,
      zeny: 11000000,
      activityPts: 8,
      rewards: [
        { id: 40151, name: 'Seed Box [10]', sheetName: 'Yggseed Box', count: 2 },
        { id: 40152, name: 'Berry Box [10]', sheetName: 'Yggberry Box', count: 2 },
        { id: 40153, name: 'Thunder Box [10]', sheetName: 'Thunder Box', count: 2 }
      ]
    },
    {
      id: 14,
      name: 'The Sograt Delivery',
      map: 'Morocc',
      tier: 'Standard',
      minLevel: 195,
      timeMins: 70,
      jobs: 'All',
      jobsList: null,
      jobsSummary: 'All Jobs',
      mobs: [
        { id: 1297, name: 'Ancient Mummy', count: 268 },
        { id: 1032, name: 'Verit', count: 268 }
      ],
      items: [
        { id: 930, name: 'Rotten Bandage', count: 178 },
        { id: 929, name: 'Immortal Heart', count: 178 },
        { id: 4097, name: 'Matyr Card', count: 8 }
      ],
      baseExp: 1000000,
      jobExp: 500000,
      zeny: 12000000,
      activityPts: 8,
      rewards: [
        { id: 40001, name: 'Credit', count: 1 }
      ]
    },
    {
      id: 15,
      name: 'Super Rookie MVP - Maya',
      map: 'Morocc',
      tier: 'MVP',
      minLevel: 195,
      timeMins: 60,
      jobs: 'All',
      jobsList: null,
      jobsSummary: 'All Jobs',
      mobs: [
        { id: 1147, name: 'Maya', count: 26, mvp: true }
      ],
      items: [
        { id: 7020, name: "Mother's Nightmare", count: 11 }
      ],
      baseExp: 1200000,
      jobExp: 600000,
      zeny: 12500000,
      activityPts: 8,
      rewards: [
        { id: 40001, name: 'Credit', count: 1 }
      ]
    },
    {
      id: 16,
      name: 'Super Rookie MVP - Osiris',
      map: 'Morocc',
      tier: 'MVP',
      minLevel: 195,
      timeMins: 60,
      jobs: 'All',
      jobsList: null,
      jobsSummary: 'All Jobs',
      mobs: [
        { id: 1038, name: 'Osiris', count: 26, mvp: true }
      ],
      items: [
        { id: 1232, name: 'Assassin Dagger', count: 8 }
      ],
      baseExp: 1200000,
      jobExp: 600000,
      zeny: 12500000,
      activityPts: 8,
      rewards: [
        { id: 40001, name: 'Credit', count: 1 }
      ]
    },
    {
      id: 17,
      name: 'Super Rookie MVP - Pharaoh',
      map: 'Morocc',
      tier: 'MVP',
      minLevel: 195,
      timeMins: 60,
      jobs: 'All',
      jobsList: null,
      jobsSummary: 'All Jobs',
      mobs: [
        { id: 1157, name: 'Pharaoh', count: 26, mvp: true }
      ],
      items: [
        { id: 7114, name: 'Mask of Tutankhamen', sheetName: 'Masque of Tutankhamen', count: 28 }
      ],
      baseExp: 1200000,
      jobExp: 600000,
      zeny: 12500000,
      activityPts: 8,
      rewards: [
        { id: 40001, name: 'Credit', count: 1 }
      ]
    },
    {
      id: 18,
      name: 'Super Rookie MVP - Phreeoni',
      map: 'Morocc',
      tier: 'MVP',
      minLevel: 195,
      timeMins: 60,
      jobs: 'All',
      jobsList: null,
      jobsSummary: 'All Jobs',
      mobs: [
        { id: 1159, name: 'Phreeoni', count: 26, mvp: true }
      ],
      items: [
        { id: 1008, name: 'Necklace of Oblivion', count: 28 }
      ],
      baseExp: 1200000,
      jobExp: 600000,
      zeny: 12500000,
      activityPts: 8,
      rewards: [
        { id: 40001, name: 'Credit', count: 1 }
      ]
    },

    // ── PAYON (7) ─────────────────────────────────────────────────────────────
    {
      id: 19,
      name: 'Sohee, so good!',
      map: 'Payon',
      tier: 'Standard',
      minLevel: 195,
      timeMins: 60,
      jobs: 'All',
      jobsList: null,
      jobsSummary: 'All Jobs',
      mobs: [
        { id: 1170, name: 'Sohee', count: 422 }
      ],
      items: [
        { id: 1049, name: 'Skirt of Virgin', count: 538 }
      ],
      baseExp: 600000,
      jobExp: 300000,
      zeny: 11000000,
      activityPts: 6,
      rewards: []
    },
    {
      id: 20,
      name: "Knock Nak, who's there?",
      map: 'Payon',
      tier: 'Speed / Job',
      minLevel: 195,
      timeMins: 10,
      jobs: 'Novice, Super Novice, Swordman, Mage, Archer, Acolyte, Merchant, Thief, Knight, Priest, Blacksmith, Hunter, Assassin, Crusader, Monk, Sage, Rogue, Alchemist, Bard, Dancer, Taekwon, Star Gladiator, Soul Linker, Gunslinger, Ninja',
      jobsList: NON_TRANS_EXP_JOBS,
      jobsSummary: 'Non-Trans & Expanded (25 Jobs)',
      mobs: [
        { id: 1026, name: 'Munak', count: 242 }
      ],
      items: [],
      baseExp: 600000,
      jobExp: 600000,
      zeny: 8000000,
      activityPts: 6,
      rewards: []
    },
    {
      id: 21,
      name: 'Nine-Tailed Dance',
      map: 'Payon',
      tier: 'Standard',
      minLevel: 195,
      timeMins: 60,
      jobs: 'All',
      jobsList: null,
      jobsSummary: 'All Jobs',
      mobs: [
        { id: 1180, name: 'Nine Tail', count: 538 }
      ],
      items: [
        { id: 1022, name: 'Nine Tails', count: 538 },
        { id: 4159, name: 'Nine Tail Card', count: 8 }
      ],
      baseExp: 1200000,
      jobExp: 600000,
      zeny: 11000000,
      activityPts: 8,
      rewards: [
        { id: 40001, name: 'Credit', count: 1 }
      ]
    },
    {
      id: 22,
      name: 'Forestland Assassin',
      map: 'Payon',
      tier: 'Standard',
      minLevel: 195,
      timeMins: 60,
      jobs: 'All',
      jobsList: null,
      jobsSummary: 'All Jobs',
      mobs: [],
      items: [
        { id: 920, name: 'Wolf Claw', count: 178 },
        { id: 906, name: 'Pointed Scale', count: 178 },
        { id: 1021, name: 'Dokkaebi Horn', sheetName: 'Dokebi Horn', count: 178 },
        { id: 1019, name: 'Trunk', count: 178 }
      ],
      baseExp: 1200000,
      jobExp: 600000,
      zeny: 11000000,
      activityPts: 8,
      rewards: [
        { id: 40001, name: 'Credit', count: 1 }
      ]
    },
    {
      id: 23,
      name: "The Caveman's Delivery",
      map: 'Payon',
      tier: 'Standard',
      minLevel: 195,
      timeMins: 60,
      jobs: 'All',
      jobsList: null,
      jobsSummary: 'All Jobs',
      mobs: [],
      items: [
        { id: 4103, name: 'Horong Card', count: 18 },
        { id: 4212, name: 'Bongun Card', count: 18 },
        { id: 4094, name: 'Archer Skeleton Card', count: 18 },
        { id: 4086, name: 'Soldier Skeleton Card', count: 18 }
      ],
      baseExp: 1200000,
      jobExp: 600000,
      zeny: 11000000,
      activityPts: 8,
      rewards: [
        { id: 40001, name: 'Credit', count: 1 }
      ]
    },
    {
      id: 24,
      name: 'Super Rookie MVP - Eddga',
      map: 'Payon',
      tier: 'MVP',
      minLevel: 195,
      timeMins: 60,
      jobs: 'All',
      jobsList: null,
      jobsSummary: 'All Jobs',
      mobs: [
        { id: 1115, name: 'Eddga', count: 35, mvp: true }
      ],
      items: [
        { id: 1030, name: "Tiger's Footskin", count: 35 }
      ],
      baseExp: 1200000,
      jobExp: 600000,
      zeny: 15000000,
      activityPts: 8,
      rewards: [
        { id: 40001, name: 'Credit', count: 1 },
        { id: 40151, name: 'Seed Box [10]', sheetName: 'Yggseed Box', count: 1 },
        { id: 40152, name: 'Berry Box [10]', sheetName: 'Yggberry Box', count: 1 },
        { id: 40153, name: 'Thunder Box [10]', sheetName: 'Thunder Box', count: 1 }
      ]
    },
    {
      id: 25,
      name: 'Super Rookie MVP - Moonlight',
      map: 'Payon',
      tier: 'MVP',
      minLevel: 195,
      timeMins: 60,
      jobs: 'All',
      jobsList: null,
      jobsSummary: 'All Jobs',
      mobs: [
        { id: 1150, name: 'Moonlight Flower', count: 35, mvp: true }
      ],
      items: [
        { id: 10008, name: 'Punisher', count: 35 }
      ],
      baseExp: 1200000,
      jobExp: 600000,
      zeny: 15000000,
      activityPts: 8,
      rewards: [
        { id: 40001, name: 'Credit', count: 1 },
        { id: 40151, name: 'Seed Box [10]', sheetName: 'Yggseed Box', count: 1 },
        { id: 40152, name: 'Berry Box [10]', sheetName: 'Yggberry Box', count: 1 },
        { id: 40153, name: 'Thunder Box [10]', sheetName: 'Thunder Box', count: 1 }
      ]
    }
  ];

  const MAP_ORDER = ['Prontera', 'Morocc', 'Payon'];
  const MAP_META = {
    Prontera: { subtitle: 'Lv. 1–185 · Standard, Speed & MVP Missions', badgeClass: 'mg-map--prontera' },
    Morocc:   { subtitle: 'Lv. 1–195 · Desert Hunting & MVP Missions', badgeClass: 'mg-map--morocc' },
    Payon:    { subtitle: 'Lv. 195 · Forest/Cave & MVP Missions', badgeClass: 'mg-map--payon' }
  };

  // UI state
  let searchQuery = '';
  let mapFilter = 'all';        // 'all' | 'Prontera' | 'Morocc' | 'Payon'
  let tierFilter = 'all';       // 'all' | 'Standard' | 'MVP' | 'Speed / Job'
  let objFilter = 'all';        // 'all' | 'kill_collect' | 'kill_only' | 'collect_only'
  let rewardFilter = 'all';     // 'all' | 'credit' | 'boxes' | 'pinned'
  let sortKey = 'default';      // 'default' | 'ap_desc' | 'zeny_desc' | 'lvl_asc' | 'lvl_desc' | 'time_asc' | 'name_asc'
  let tableSortDir = 'asc';
  let expandedJobsSet = new Set();
  let collapsedMapsSet = new Set();

  function getLabPrefs() {
    const d = typeof loadLabData === 'function' ? loadLabData() : {};
    return {
      viewMode: d.mgViewMode === 'table' ? 'table' : 'cards',
      mobDb: d.mgMobDb === 'rms' ? 'rms' : 'koko',
      pinned: new Set(Array.isArray(d.mgPinned) ? d.mgPinned : [])
    };
  }

  function saveLabPrefs(patch) {
    if (typeof saveLabData === 'function') {
      saveLabData(patch);
    }
  }

  // URL Helpers
  function kokotewaMobUrl(mobId) {
    return `https://ro.kokotewa.com/db/mon_info?id=${mobId}`;
  }

  function rmsMobUrl(mobId) {
    return `https://ratemyserver.net/index.php?page=mob_db&mob_id=${mobId}&ird=1`;
  }

  function getItemNameFromDb(itemEntry) {
    const dbItem = window.DATA?.items?.[itemEntry.id];
    if (dbItem && dbItem.name) {
      const slot = Number(dbItem.slot) || 0;
      return slot > 0 && !dbItem.name.includes(`[${slot}]`)
        ? `${dbItem.name} [${slot}]`
        : dbItem.name;
    }
    return itemEntry.name;
  }

  function formatCompactNumber(num) {
    if (num >= 1_000_000) {
      const m = num / 1_000_000;
      return (m % 1 === 0 ? m.toFixed(0) : m.toFixed(2).replace(/\.?0+$/, '')) + 'M';
    }
    if (num >= 1_000) {
      const k = num / 1_000;
      return (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1).replace(/\.?0+$/, '')) + 'K';
    }
    return String(num);
  }

  function formatDurationMins(mins) {
    return `${mins}m`;
  }

  function getMissionObjectiveType(m) {
    const hasMobs = m.mobs.length > 0;
    const hasItems = m.items.length > 0;
    if (hasMobs && hasItems) return 'kill_collect';
    if (hasMobs) return 'kill_only';
    return 'collect_only';
  }

  function getMissionTotalValue(m) {
    let total = m.zeny || 0;
    m.rewards.forEach(r => {
      if (r.id === 40001) {
        const creditVal = typeof getCreditValue === 'function' ? getCreditValue() : 10_000_000;
        total += r.count * creditVal;
      } else {
        const itemVal = window.DATA?.items?.[r.id]?.value || 0;
        total += r.count * itemVal;
      }
    });
    return total;
  }

  function getTierBadgeClass(tier) {
    if (tier === 'MVP') return 'mg-tier--mvp';
    if (tier === 'Speed / Job') return 'mg-tier--speed';
    return 'mg-tier--standard';
  }

  function matchesMissionSearch(m, q) {
    if (!q) return true;
    const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return true;

    const searchableParts = [
      m.name,
      m.map,
      m.tier,
      `lv${m.minLevel}`,
      `lvl${m.minLevel}`,
      String(m.minLevel),
      `${m.timeMins}m`,
      m.jobs,
      m.jobsSummary
    ];

    m.mobs.forEach(mob => {
      searchableParts.push(mob.name, String(mob.id));
      if (mob.altName) searchableParts.push(mob.altName);
      if (mob.mvp) searchableParts.push('mvp');
    });

    m.items.forEach(it => {
      searchableParts.push(it.name, getItemNameFromDb(it), String(it.id));
      if (it.sheetName) searchableParts.push(it.sheetName);
    });

    m.rewards.forEach(r => {
      searchableParts.push(r.name, getItemNameFromDb(r), String(r.id));
      if (r.sheetName) searchableParts.push(r.sheetName);
    });

    const haystack = searchableParts.join(' ').toLowerCase();
    return terms.every(t => haystack.includes(t));
  }

  function filterAndSortMissions(prefs) {
    let list = MISSIONS.filter(m => {
      if (!matchesMissionSearch(m, searchQuery)) return false;
      if (mapFilter !== 'all' && m.map !== mapFilter) return false;
      if (tierFilter !== 'all' && m.tier !== tierFilter) return false;
      if (objFilter !== 'all' && getMissionObjectiveType(m) !== objFilter) return false;
      if (rewardFilter === 'credit' && !m.rewards.some(r => r.id === 40001)) return false;
      if (rewardFilter === 'boxes' && !m.rewards.some(r => r.id === 40151 || r.id === 40152 || r.id === 40153)) return false;
      if (rewardFilter === 'pinned' && !prefs.pinned.has(m.id)) return false;
      return true;
    });

    const dirMult = tableSortDir === 'desc' ? -1 : 1;

    list.sort((a, b) => {
      if (sortKey === 'default') {
        const mapDiff = MAP_ORDER.indexOf(a.map) - MAP_ORDER.indexOf(b.map);
        if (mapDiff !== 0) return mapDiff;
        return a.id - b.id;
      }
      if (sortKey === 'ap_desc') {
        return (b.activityPts - a.activityPts) || (getMissionTotalValue(b) - getMissionTotalValue(a)) || (a.id - b.id);
      }
      if (sortKey === 'zeny_desc') {
        return (getMissionTotalValue(b) - getMissionTotalValue(a)) || (b.zeny - a.zeny) || (a.id - b.id);
      }
      if (sortKey === 'lvl_asc') {
        return (a.minLevel - b.minLevel) || (a.id - b.id);
      }
      if (sortKey === 'lvl_desc') {
        return (b.minLevel - a.minLevel) || (a.id - b.id);
      }
      if (sortKey === 'time_asc') {
        return (a.timeMins - b.timeMins) || (a.id - b.id);
      }
      if (sortKey === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      // Table column sorts
      if (sortKey === 'col_name') return dirMult * a.name.localeCompare(b.name);
      if (sortKey === 'col_map') return dirMult * (MAP_ORDER.indexOf(a.map) - MAP_ORDER.indexOf(b.map) || a.id - b.id);
      if (sortKey === 'col_lvl') return dirMult * ((a.minLevel - b.minLevel) || (a.id - b.id));
      if (sortKey === 'col_time') return dirMult * ((a.timeMins - b.timeMins) || (a.id - b.id));
      if (sortKey === 'col_zeny') return dirMult * ((a.zeny - b.zeny) || (a.id - b.id));
      if (sortKey === 'col_ap') return dirMult * ((a.activityPts - b.activityPts) || (a.id - b.id));
      if (sortKey === 'col_exp') return dirMult * ((a.baseExp - b.baseExp) || (a.id - b.id));
      return a.id - b.id;
    });

    return list;
  }

  // Render a single monster row inside a card or table
  function renderMobRow(mob, mobDb) {
    const primaryUrl = mobDb === 'rms' ? rmsMobUrl(mob.id) : kokotewaMobUrl(mob.id);
    const primaryLabel = mobDb === 'rms' ? 'RateMyServer' : 'Kokotewa';
    const altHint = mob.altName ? ` title="${escapeHtml(mob.name)} (${escapeHtml(mob.altName)}) — Open on ${primaryLabel}"` : ` title="Open ${escapeHtml(mob.name)} (#${mob.id}) on ${primaryLabel}"`;

    return `
      <div class="mg-obj-row mg-obj-row--mob">
        <span class="mg-qty">×${mob.count.toLocaleString()}</span>
        <div class="mg-obj-main">
          <a class="mg-mob-name" href="${primaryUrl}" target="_blank" rel="noopener"${altHint}>${escapeHtml(mob.name)}</a>
          <button type="button" class="mg-id-tag mg-id-copy-btn" onclick="window.mgCopyMobIds('${mob.id}')" title="Click to copy monster ID (${mob.id})">#${mob.id}</button>
        </div>
      </div>`;
  }

  // Render a single item-to-collect row inside a card or table
  function renderCollectItemRow(it) {
    const dispName = getItemNameFromDb(it);
    const iconHtml = typeof renderItemIcon === 'function' ? renderItemIcon(it.id, 24) : '';
    const url = typeof itemUrl === 'function' ? itemUrl(it.id) : `?item=${it.id}`;

    return `
      <div class="mg-obj-row mg-obj-row--item">
        ${iconHtml}
        <span class="mg-qty">×${it.count.toLocaleString()}</span>
        <div class="mg-obj-main">
          <a class="item-link mg-item-name" href="${url}" onclick="event.preventDefault(); window.mgNavigateToItem(${it.id});" title="View ${escapeHtml(dispName)} in Item Database">${escapeHtml(dispName)}</a>
          <button type="button" class="mg-id-tag mg-id-copy-btn" onclick="window.mgCopyItemIds('${it.id}')" title="Click to copy item ID (${it.id})">#${it.id}</button>
        </div>
      </div>`;
  }

  // Render a reward item chip
  function renderRewardItemChip(r) {
    const dispName = getItemNameFromDb(r);
    const iconHtml = typeof renderItemIcon === 'function' ? renderItemIcon(r.id, 24) : '';
    const url = typeof itemUrl === 'function' ? itemUrl(r.id) : `?item=${r.id}`;
    const isCredit = r.id === 40001;
    const extraClass = isCredit ? 'mg-reward-chip--credit' : 'mg-reward-chip--item';

    return `
      <a class="mg-reward-chip ${extraClass}" href="${url}" onclick="event.preventDefault(); window.mgNavigateToItem(${r.id});" title="${escapeHtml(dispName)} (#${r.id})${r.sheetName && r.sheetName !== dispName ? ' — ' + escapeHtml(r.sheetName) : ''}">
        ${iconHtml}
        <span class="mg-reward-qty">${r.count}×</span>
        <span class="mg-reward-label">${escapeHtml(dispName)}</span>
      </a>`;
  }

  function renderMissionCard(m, prefs) {
    const isPinned = prefs.pinned.has(m.id);
    const mapMeta = MAP_META[m.map] || {};
    const tierClass = getTierBadgeClass(m.tier);
    const hasRestrictedJobs = Array.isArray(m.jobsList) && m.jobsList.length > 0;
    const isJobsExpanded = expandedJobsSet.has(m.id);

    const zenyIcon = typeof renderItemIcon === 'function' ? renderItemIcon(1, 24) : '';
    const apIcon = typeof renderItemIcon === 'function' ? renderItemIcon(2, 24) : '';

    const mobsHtml = m.mobs.length > 0
      ? `
        <div class="mg-obj-section">
          <div class="mg-obj-header">
            <span class="mg-obj-title">⚔ Mobs to Kill <span class="mg-obj-count">(${m.mobs.length})</span></span>
          </div>
          <div class="mg-obj-list">
            ${m.mobs.map(mob => renderMobRow(mob, prefs.mobDb)).join('')}
          </div>
        </div>`
      : '';

    const itemIdsStr = m.items.map(i => i.id).join(' ');
    const itemsHtml = m.items.length > 0
      ? `
        <div class="mg-obj-section">
          <div class="mg-obj-header">
            <span class="mg-obj-title">🎒 Items to Collect <span class="mg-obj-count">(${m.items.length})</span></span>
            <button type="button" class="mg-copy-ids-btn" onclick="window.mgCopyItemIds('${itemIdsStr}')" title="Copy item IDs (${itemIdsStr}) for Autoloot">
              Copy IDs
            </button>
          </div>
          <div class="mg-obj-list">
            ${m.items.map(it => renderCollectItemRow(it)).join('')}
          </div>
        </div>`
      : '';

    const jobsSectionHtml = hasRestrictedJobs
      ? `
        <div class="mg-jobs-drawer ${isJobsExpanded ? 'open' : ''}" id="mg-jobs-${m.id}" style="display: ${isJobsExpanded ? 'flex' : 'none'};">
          <div class="mg-jobs-drawer-label">Allowed Jobs (${m.jobsList.length}):</div>
          <div class="mg-jobs-pills">
            ${m.jobsList.map(j => `<span class="mg-job-pill">${escapeHtml(j)}</span>`).join('')}
          </div>
        </div>`
      : '';

    return `
      <div class="mg-card ${isPinned ? 'mg-card--pinned' : ''}" id="mg-card-${m.id}">
        <div class="mg-card-top">
          <div class="mg-card-title-group">
            <button type="button" class="mg-pin-btn ${isPinned ? 'active' : ''}" onclick="window.mgTogglePin(${m.id})" title="${isPinned ? 'Unpin mission' : 'Pin mission for quick reference'}">
              ${isPinned ? '★' : '☆'}
            </button>
            <h3 class="mg-card-name">${escapeHtml(m.name)}</h3>
          </div>
          <div class="mg-card-badges">
            <span class="mg-map-badge ${mapMeta.badgeClass || ''}">${escapeHtml(m.map)}</span>
            <span class="mg-tier-badge ${tierClass}">${escapeHtml(m.tier)}</span>
          </div>
        </div>

        <div class="mg-meta-strip">
          <span class="mg-meta-chip ${m.minLevel >= 195 ? 'mg-meta-chip--lv195' : m.minLevel >= 185 ? 'mg-meta-chip--lv185' : ''}" title="Minimum Base Level">
            Lv. ${m.minLevel}
          </span>
          <span class="mg-meta-chip" title="Time Limit: ${m.timeMins} minutes">
            ⏱ ${formatDurationMins(m.timeMins)}
          </span>
          ${hasRestrictedJobs
            ? `<button type="button" class="mg-meta-chip mg-meta-chip--jobs ${isJobsExpanded ? 'active' : ''}" onclick="window.mgToggleJobs(${m.id})" title="Click to view allowed job classes">
                ⚠ ${escapeHtml(m.jobsSummary)} <span class="mg-jobs-caret">${isJobsExpanded ? '▴' : '▾'}</span>
              </button>`
            : `<span class="mg-meta-chip mg-meta-chip--alljobs" title="Allowed Jobs: All">
                All Jobs
              </span>`
          }
        </div>

        ${jobsSectionHtml}

        <div class="mg-card-body">
          ${mobsHtml}
          ${itemsHtml}
        </div>

        <div class="mg-card-footer">
          <div class="mg-rewards-row">
            <span class="mg-reward-chip mg-reward-chip--zeny" title="${m.zeny.toLocaleString()} Zeny">
              ${zenyIcon}
              <span class="mg-reward-qty">${formatCompactNumber(m.zeny)}</span>
              <span class="mg-reward-label">Zeny</span>
            </span>
            <span class="mg-reward-chip mg-reward-chip--ap" title="${m.activityPts} Activity Points">
              ${apIcon}
              <span class="mg-reward-qty">${m.activityPts}×</span>
              <span class="mg-reward-label">Activity Points</span>
            </span>
            ${m.rewards.map(r => renderRewardItemChip(r)).join('')}
          </div>
          <div class="mg-exp-row" title="Base EXP: ${m.baseExp.toLocaleString()} · Job EXP: ${m.jobExp.toLocaleString()}">
            <span>EXP: <strong>${formatCompactNumber(m.baseExp)}</strong> Base / <strong>${formatCompactNumber(m.jobExp)}</strong> Job</span>
          </div>
        </div>
      </div>`;
  }

  function renderCardsView(filtered, prefs) {
    if (filtered.length === 0) {
      return `<div class="empty-msg-centered" style="padding: 32px 16px;">No missions match your current filters.</div>`;
    }

    // Group by map when using default sort and 'all' map filter
    if (sortKey === 'default' && mapFilter === 'all') {
      return MAP_ORDER.map(mapName => {
        const groupMissions = filtered.filter(m => m.map === mapName);
        if (groupMissions.length === 0) return '';
        const isCollapsed = collapsedMapsSet.has(mapName);
        const meta = MAP_META[mapName] || {};

        return `
          <div class="mg-map-section">
            <div class="mg-map-header" onclick="window.mgToggleMapSection('${mapName}')">
              <div class="mg-map-header-left">
                <span class="mg-map-chevron ${isCollapsed ? 'collapsed' : ''}">▾</span>
                <span class="mg-map-badge ${meta.badgeClass || ''}">${mapName}</span>
                <span class="mg-map-count">${groupMissions.length} ${groupMissions.length === 1 ? 'mission' : 'missions'}</span>
                <span class="mg-map-sub">${meta.subtitle || ''}</span>
              </div>
            </div>
            ${isCollapsed ? '' : `
              <div class="mg-cards-grid">
                ${groupMissions.map(m => renderMissionCard(m, prefs)).join('')}
              </div>
            `}
          </div>`;
      }).join('');
    }

    return `
      <div class="mg-cards-grid">
        ${filtered.map(m => renderMissionCard(m, prefs)).join('')}
      </div>`;
  }

  function getTableSortIndicator(colKey) {
    if (sortKey !== colKey) return ' <span class="dt-sort-arrow">↕</span>';
    return tableSortDir === 'asc'
      ? ' <span class="dt-sort-arrow">▲</span>'
      : ' <span class="dt-sort-arrow">▼</span>';
  }

  function renderTableView(filtered, prefs) {
    if (filtered.length === 0) {
      return `<div class="empty-msg-centered" style="padding: 32px 16px;">No missions match your current filters.</div>`;
    }

    const rowsHtml = filtered.map(m => {
      const isPinned = prefs.pinned.has(m.id);
      const mapMeta = MAP_META[m.map] || {};
      const tierClass = getTierBadgeClass(m.tier);
      const hasRestrictedJobs = Array.isArray(m.jobsList) && m.jobsList.length > 0;

      const mobsCell = m.mobs.length > 0
        ? `<div class="mg-table-list">${m.mobs.map(mob => renderMobRow(mob, prefs.mobDb)).join('')}</div>`
        : `<span class="mg-table-none">—</span>`;

      const itemsCell = m.items.length > 0
        ? `<div class="mg-table-list">${m.items.map(it => renderCollectItemRow(it)).join('')}</div>`
        : `<span class="mg-table-none">—</span>`;

      const rewardsCell = m.rewards.length > 0
        ? `<div class="mg-table-rewards">${m.rewards.map(r => renderRewardItemChip(r)).join('')}</div>`
        : `<span class="mg-table-none">—</span>`;

      const jobsBadge = hasRestrictedJobs
        ? `<div class="mg-table-jobs-warn" title="Allowed Jobs: ${escapeHtml(m.jobs)}">⚠ ${escapeHtml(m.jobsSummary)}</div>`
        : '';

      return `
        <tr class="mg-table-row ${isPinned ? 'mg-table-row--pinned' : ''}">
          <td class="dt-col-star">
            <button type="button" class="dt-star-btn ${isPinned ? 'active' : ''}" onclick="window.mgTogglePin(${m.id})" title="${isPinned ? 'Unpin' : 'Pin'}">
              ${isPinned ? '★' : '☆'}
            </button>
          </td>
          <td class="mg-col-name">
            <div class="mg-table-name">${escapeHtml(m.name)}</div>
            <div class="mg-table-sub">
              <span class="mg-tier-badge ${tierClass}">${escapeHtml(m.tier)}</span>
              ${jobsBadge}
            </div>
          </td>
          <td class="mg-col-map">
            <span class="mg-map-badge ${mapMeta.badgeClass || ''}">${escapeHtml(m.map)}</span>
          </td>
          <td class="mg-col-num">${m.minLevel}</td>
          <td class="mg-col-num">${formatDurationMins(m.timeMins)}</td>
          <td class="mg-col-mobs">${mobsCell}</td>
          <td class="mg-col-items">${itemsCell}</td>
          <td class="mg-col-zeny" title="${m.zeny.toLocaleString()} Zeny">${formatCompactNumber(m.zeny)}</td>
          <td class="mg-col-ap" title="${m.activityPts} Activity Points">${m.activityPts} AP</td>
          <td class="mg-col-rewards">${rewardsCell}</td>
          <td class="mg-col-exp" title="Base: ${m.baseExp.toLocaleString()} / Job: ${m.jobExp.toLocaleString()}">
            ${formatCompactNumber(m.baseExp)} / ${formatCompactNumber(m.jobExp)}
          </td>
        </tr>`;
    }).join('');

    return `
      <div class="dt-table-wrapper mg-table-wrapper">
        <table class="dt-table mg-table">
          <thead>
            <tr>
              <th class="dt-col-star" title="Pinned">★</th>
              <th class="dt-sortable" onclick="window.mgHandleTableSort('col_name')">Mission${getTableSortIndicator('col_name')}</th>
              <th class="dt-sortable" onclick="window.mgHandleTableSort('col_map')">Map${getTableSortIndicator('col_map')}</th>
              <th class="dt-sortable" onclick="window.mgHandleTableSort('col_lvl')">Min Lv${getTableSortIndicator('col_lvl')}</th>
              <th class="dt-sortable" onclick="window.mgHandleTableSort('col_time')">Time${getTableSortIndicator('col_time')}</th>
              <th>Mobs to Kill</th>
              <th>Items to Collect</th>
              <th class="dt-sortable" onclick="window.mgHandleTableSort('col_zeny')">Zeny${getTableSortIndicator('col_zeny')}</th>
              <th class="dt-sortable" onclick="window.mgHandleTableSort('col_ap')" title="Activity Points">AP${getTableSortIndicator('col_ap')}</th>
              <th>Reward Items</th>
              <th class="dt-sortable" onclick="window.mgHandleTableSort('col_exp')">EXP (B/J)${getTableSortIndicator('col_exp')}</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>`;
  }

  function renderMissionsMain() {
    const mainContainer = document.getElementById('mainContent');
    if (!mainContainer) return;

    const searchActive = document.activeElement && document.activeElement.classList.contains('mg-search-input');
    const cursorStart = searchActive ? document.activeElement.selectionStart : 0;
    const cursorEnd = searchActive ? document.activeElement.selectionEnd : 0;

    const prefs = getLabPrefs();
    const filtered = filterAndSortMissions(prefs);

    const mapCounts = {
      all: MISSIONS.length,
      Prontera: MISSIONS.filter(m => m.map === 'Prontera').length,
      Morocc: MISSIONS.filter(m => m.map === 'Morocc').length,
      Payon: MISSIONS.filter(m => m.map === 'Payon').length
    };

    const hasActiveFilters = searchQuery || mapFilter !== 'all' || tierFilter !== 'all' || objFilter !== 'all' || rewardFilter !== 'all' || sortKey !== 'default';

    mainContainer.innerHTML = `
      <div class="lab-main mg-main">
        <div class="lab-section">
          <div class="mg-header-row">
            <div class="lab-section-header">
              <span class="lab-section-title">
                <span class="lab-section-icon">${window.SVG_ICONS?.mission18 || ''}</span>
                Mission Guide
              </span>
              <span class="lab-section-meta">
                Showing ${filtered.length} of ${MISSIONS.length} missions · Click items for in-app details or monster names for spawn &amp; drop tables
              </span>
            </div>

            <div class="mg-header-controls">
              <div class="mg-toggle-group" title="Default database when clicking monster names">
                <span class="mg-toggle-label">Mob Click:</span>
                <button type="button" class="mg-toggle-btn ${prefs.mobDb === 'koko' ? 'active' : ''}" onclick="window.mgSetMobDb('koko')">Kokotewa</button>
                <button type="button" class="mg-toggle-btn ${prefs.mobDb === 'rms' ? 'active' : ''}" onclick="window.mgSetMobDb('rms')">RMS</button>
              </div>
              <div class="mg-toggle-group" title="Switch between Cards and Table view">
                <button type="button" class="mg-toggle-btn ${prefs.viewMode === 'cards' ? 'active' : ''}" onclick="window.mgSetViewMode('cards')">Cards</button>
                <button type="button" class="mg-toggle-btn ${prefs.viewMode === 'table' ? 'active' : ''}" onclick="window.mgSetViewMode('table')">Table</button>
              </div>
            </div>
          </div>

          <div class="mg-toolbar">
            <div class="mg-toolbar-top">
              <div class="dt-search-wrapper mg-search-wrapper">
                <span class="dt-search-icon">🔍</span>
                <input type="text" class="dt-search-input mg-search-input"
                  placeholder="Search mission, mob, item, ID, or job…"
                  value="${escapeHtml(searchQuery)}"
                  oninput="window.mgHandleSearch(this.value)">
                ${searchQuery ? `
                  <button type="button" class="btn btn-sm" onclick="window.mgClearSearch()"
                    style="padding: 0 5px; height: 20px; line-height: 1; margin-left: 4px; flex-shrink: 0;" title="Clear search">×</button>
                ` : ''}
              </div>

              <div class="mg-map-tabs" role="tablist" aria-label="Filter by Map">
                <button type="button" class="dt-filter-btn ${mapFilter === 'all' ? 'active' : ''}" onclick="window.mgSetMapFilter('all')">All (${mapCounts.all})</button>
                <button type="button" class="dt-filter-btn ${mapFilter === 'Prontera' ? 'active' : ''}" onclick="window.mgSetMapFilter('Prontera')">Prontera (${mapCounts.Prontera})</button>
                <button type="button" class="dt-filter-btn ${mapFilter === 'Morocc' ? 'active' : ''}" onclick="window.mgSetMapFilter('Morocc')">Morocc (${mapCounts.Morocc})</button>
                <button type="button" class="dt-filter-btn ${mapFilter === 'Payon' ? 'active' : ''}" onclick="window.mgSetMapFilter('Payon')">Payon (${mapCounts.Payon})</button>
              </div>
            </div>

            <div class="dt-subfilter-bar mg-subfilter-bar">
              <div class="dt-select-group ${tierFilter !== 'all' ? 'active' : ''}">
                <span class="dt-select-label">Tier</span>
                <select class="dt-filter-select" onchange="window.mgSetTierFilter(this.value)" aria-label="Filter by Tier">
                  <option value="all" ${tierFilter === 'all' ? 'selected' : ''}>All Tiers</option>
                  <option value="Standard" ${tierFilter === 'Standard' ? 'selected' : ''}>Standard (12)</option>
                  <option value="MVP" ${tierFilter === 'MVP' ? 'selected' : ''}>MVP (10)</option>
                  <option value="Speed / Job" ${tierFilter === 'Speed / Job' ? 'selected' : ''}>Speed / Job Restricted (3)</option>
                </select>
              </div>

              <div class="dt-select-group ${objFilter !== 'all' ? 'active' : ''}">
                <span class="dt-select-label">Objective</span>
                <select class="dt-filter-select" onchange="window.mgSetObjFilter(this.value)" aria-label="Filter by Objective">
                  <option value="all" ${objFilter === 'all' ? 'selected' : ''}>All</option>
                  <option value="kill_collect" ${objFilter === 'kill_collect' ? 'selected' : ''}>Kill + Collect (13)</option>
                  <option value="kill_only" ${objFilter === 'kill_only' ? 'selected' : ''}>Kill Only (9)</option>
                  <option value="collect_only" ${objFilter === 'collect_only' ? 'selected' : ''}>Collect Only (3)</option>
                </select>
              </div>

              <div class="dt-select-group ${rewardFilter !== 'all' ? 'active' : ''}">
                <span class="dt-select-label">Filter</span>
                <select class="dt-filter-select" onchange="window.mgSetRewardFilter(this.value)" aria-label="Filter by Reward or Pin">
                  <option value="all" ${rewardFilter === 'all' ? 'selected' : ''}>All Missions</option>
                  <option value="credit" ${rewardFilter === 'credit' ? 'selected' : ''}>Rewards Credit (10)</option>
                  <option value="boxes" ${rewardFilter === 'boxes' ? 'selected' : ''}>Rewards Supply Boxes (9)</option>
                  <option value="pinned" ${rewardFilter === 'pinned' ? 'selected' : ''}>★ Pinned (${prefs.pinned.size})</option>
                </select>
              </div>

              <div class="dt-select-group ${sortKey !== 'default' ? 'active' : ''}">
                <span class="dt-select-label">Sort</span>
                <select class="dt-filter-select" onchange="window.mgSetSortKey(this.value)" aria-label="Sort Missions">
                  <option value="default" ${sortKey === 'default' ? 'selected' : ''}>Map &amp; Tier (Default)</option>
                  <option value="ap_desc" ${sortKey === 'ap_desc' ? 'selected' : ''}>Activity Points (High → Low)</option>
                  <option value="zeny_desc" ${sortKey === 'zeny_desc' ? 'selected' : ''}>Total Value (High → Low)</option>
                  <option value="lvl_asc" ${sortKey === 'lvl_asc' ? 'selected' : ''}>Min Level (Low → High)</option>
                  <option value="lvl_desc" ${sortKey === 'lvl_desc' ? 'selected' : ''}>Min Level (High → Low)</option>
                  <option value="time_asc" ${sortKey === 'time_asc' ? 'selected' : ''}>Time Limit (Short → Long)</option>
                  <option value="name_asc" ${sortKey === 'name_asc' ? 'selected' : ''}>Name (A → Z)</option>
                </select>
              </div>

              ${hasActiveFilters ? `
                <button type="button" class="dt-subfilter-clear" onclick="window.mgResetFilters()" title="Reset all filters and sorting">× Reset</button>
              ` : ''}
            </div>
          </div>

          ${prefs.viewMode === 'table' ? renderTableView(filtered, prefs) : renderCardsView(filtered, prefs)}
        </div>
      </div>`;

    if (window.applySvgIcons) window.applySvgIcons(mainContainer);

    if (searchActive) {
      const input = mainContainer.querySelector('.mg-search-input');
      if (input) {
        input.focus();
        input.setSelectionRange(cursorStart, cursorEnd);
      }
    }
  }

  // URL State sync
  function updateMissionsURL() {
    if (window.state?.suppressUrlUpdate) return;
    if (typeof updateURL === 'function' && window.state?.currentTab === 'lab-missions') {
      updateURL(null, null, false);
    }
  }

  window.syncMissionStateFromURL = function (urlParams) {
    const params = urlParams || new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'lab-missions') {
      searchQuery = params.get('ms') || '';
      const mm = params.get('mm');
      mapFilter = MAP_ORDER.includes(mm) ? mm : 'all';
      const mt = params.get('mt');
      tierFilter = ['Standard', 'MVP', 'Speed / Job'].includes(mt) ? mt : 'all';
      const mo = params.get('mo');
      objFilter = ['kill_collect', 'kill_only', 'collect_only'].includes(mo) ? mo : 'all';
      const mr = params.get('mr');
      rewardFilter = ['credit', 'boxes', 'pinned'].includes(mr) ? mr : 'all';
      const msort = params.get('msort');
      sortKey = ['default', 'ap_desc', 'zeny_desc', 'lvl_asc', 'lvl_desc', 'time_asc', 'name_asc'].includes(msort) ? msort : 'default';
    }
  };

  window.applyMissionURLParams = function (url) {
    if (window.state?.currentTab === 'lab-missions') {
      if (searchQuery) url.searchParams.set('ms', searchQuery);
      else url.searchParams.delete('ms');

      if (mapFilter !== 'all') url.searchParams.set('mm', mapFilter);
      else url.searchParams.delete('mm');

      if (tierFilter !== 'all') url.searchParams.set('mt', tierFilter);
      else url.searchParams.delete('mt');

      if (objFilter !== 'all') url.searchParams.set('mo', objFilter);
      else url.searchParams.delete('mo');

      if (rewardFilter !== 'all') url.searchParams.set('mr', rewardFilter);
      else url.searchParams.delete('mr');

      if (sortKey !== 'default' && !sortKey.startsWith('col_')) url.searchParams.set('msort', sortKey);
      else url.searchParams.delete('msort');
    } else {
      ['ms', 'mm', 'mt', 'mo', 'mr', 'msort'].forEach(k => url.searchParams.delete(k));
    }
  };

  // Global handlers
  let searchDebounce = null;
  window.mgHandleSearch = function (val) {
    searchQuery = val || '';
    if (searchDebounce) clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      renderMissionsMain();
      updateMissionsURL();
    }, 150);
  };

  window.mgClearSearch = function () {
    searchQuery = '';
    if (searchDebounce) clearTimeout(searchDebounce);
    renderMissionsMain();
    updateMissionsURL();
  };

  window.mgSetMapFilter = function (val) {
    mapFilter = val || 'all';
    renderMissionsMain();
    updateMissionsURL();
  };

  window.mgSetTierFilter = function (val) {
    tierFilter = val || 'all';
    renderMissionsMain();
    updateMissionsURL();
  };

  window.mgSetObjFilter = function (val) {
    objFilter = val || 'all';
    renderMissionsMain();
    updateMissionsURL();
  };

  window.mgSetRewardFilter = function (val) {
    rewardFilter = val || 'all';
    renderMissionsMain();
    updateMissionsURL();
  };

  window.mgSetSortKey = function (val) {
    sortKey = val || 'default';
    renderMissionsMain();
    updateMissionsURL();
  };

  window.mgHandleTableSort = function (colKey) {
    if (sortKey === colKey) {
      tableSortDir = tableSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = colKey;
      tableSortDir = (colKey === 'col_zeny' || colKey === 'col_ap' || colKey === 'col_exp') ? 'desc' : 'asc';
    }
    renderMissionsMain();
  };

  window.mgResetFilters = function () {
    searchQuery = '';
    mapFilter = 'all';
    tierFilter = 'all';
    objFilter = 'all';
    rewardFilter = 'all';
    sortKey = 'default';
    tableSortDir = 'asc';
    renderMissionsMain();
    updateMissionsURL();
  };

  window.mgSetViewMode = function (mode) {
    saveLabPrefs({ mgViewMode: mode === 'table' ? 'table' : 'cards' });
    renderMissionsMain();
  };

  window.mgSetMobDb = function (db) {
    saveLabPrefs({ mgMobDb: db === 'rms' ? 'rms' : 'koko' });
    renderMissionsMain();
  };

  window.mgTogglePin = function (missionId) {
    const prefs = getLabPrefs();
    if (prefs.pinned.has(missionId)) {
      prefs.pinned.delete(missionId);
    } else {
      prefs.pinned.add(missionId);
    }
    saveLabPrefs({ mgPinned: Array.from(prefs.pinned) });
    renderMissionsMain();
  };

  window.mgToggleJobs = function (missionId) {
    if (expandedJobsSet.has(missionId)) {
      expandedJobsSet.delete(missionId);
    } else {
      expandedJobsSet.add(missionId);
    }
    renderMissionsMain();
  };

  window.mgToggleMapSection = function (mapName) {
    if (collapsedMapsSet.has(mapName)) {
      collapsedMapsSet.delete(mapName);
    } else {
      collapsedMapsSet.add(mapName);
    }
    renderMissionsMain();
  };

  window.mgNavigateToItem = function (itemId) {
    if (typeof navigateToItem === 'function') {
      navigateToItem(itemId);
    }
  };

  window.mgCopyMobIds = function (idsStr) {
    if (!idsStr) return;
    const label = String(idsStr).trim().includes(' ') ? 'monster IDs' : 'monster ID';
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(String(idsStr)).then(() => {
        if (typeof showToast === 'function') showToast(`Copied ${label}: ${idsStr}`, 'success', 2000);
      }).catch(() => {
        if (typeof showToast === 'function') showToast(`Failed to copy ${label}`, 'error', 2000);
      });
    } else if (typeof gemCopyText === 'function') {
      gemCopyText(String(idsStr)).then(() => {
        if (typeof showToast === 'function') showToast(`Copied ${label}: ${idsStr}`, 'success', 2000);
      });
    }
  };

  window.mgCopyItemIds = function (idsStr) {
    if (!idsStr) return;
    const label = String(idsStr).trim().includes(' ') ? 'item IDs' : 'item ID';
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(String(idsStr)).then(() => {
        if (typeof showToast === 'function') showToast(`Copied ${label}: ${idsStr}`, 'success', 2000);
      }).catch(() => {
        if (typeof showToast === 'function') showToast(`Failed to copy ${label}`, 'error', 2000);
      });
    } else if (typeof gemCopyText === 'function') {
      gemCopyText(String(idsStr)).then(() => {
        if (typeof showToast === 'function') showToast(`Copied ${label}: ${idsStr}`, 'success', 2000);
      });
    }
  };

  window.registerLabExperiment?.('lab-missions', {
    tabId:        'lab-missions',
    title:        'Mission Guide',
    sidebarLabel: 'Mission Guide',
    sidebarIcon:  window.SVG_ICONS?.mission14 || '',
    renderMain:   renderMissionsMain,
  });
})();
