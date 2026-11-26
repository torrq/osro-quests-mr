// lab-slaves.js — Lab Tab: Real Slave Summons (OSRO Midrate)

(function () {
  const SLAVE_SUMMONS_DATA = [
    { casterId: 1978, casterName: "Hell Apocalips", casterSprite: "HELL_APOCALIPS", casterLv: 86, casterMvp: false, category: "field", summonCount: 2, respawnsAfterKill: false, targetId: 1365, targetName: "Apocalypse", targetSprite: "APOCALIPS", targetLv: 66, cards: [{ id: 4242, name: "Apocalipse Card", raw: "Apocalips_Card", rate: 1 }] },
    { casterId: 1685, casterName: "Vesper", casterSprite: "APOCALIPS_H", casterLv: 97, casterMvp: true, category: "mvp", summonCount: 3, respawnsAfterKill: true, targetId: 1365, targetName: "Apocalypse", targetSprite: "APOCALIPS", targetLv: 66, cards: [{ id: 4242, name: "Apocalipse Card", raw: "Apocalips_Card", rate: 1 }] },
    { casterId: 1979, casterName: "Zukadam", casterSprite: "ZAKUDAM", casterLv: 82, casterMvp: false, category: "field", summonCount: 2, respawnsAfterKill: false, targetId: 1668, targetName: "Archdam", targetSprite: "ARCHDAM", targetLv: 79, cards: [{ id: 4371, name: "Archdam Card", raw: "Archdam_Card", rate: 1 }] },
    { casterId: 1290, casterName: "Skeleton General", casterSprite: "SKELETON_GENERAL", casterLv: 73, casterMvp: false, category: "field", summonCount: 2, respawnsAfterKill: true, targetId: 1016, targetName: "Archer Skeleton", targetSprite: "ARCHER_SKELETON", targetLv: 31, cards: [{ id: 4094, name: "Archer Skeleton Card", raw: "Archer_Skeleton_Card", rate: 1 }] },
    { casterId: 1147, casterName: "Maya", casterSprite: "MAYA", casterLv: 81, casterMvp: true, category: "mvp", summonCount: 10, respawnsAfterKill: false, targetId: 1194, targetName: "Arclouse", targetSprite: "ARCLOUSE", targetLv: 59, cards: [{ id: 4240, name: "Arclouze Card", raw: "Arclouse_Card", rate: 1 }] },
    { casterId: 1289, casterName: "Maya Purple", casterSprite: "MAYA_PUPLE", casterLv: 81, casterMvp: false, category: "field", summonCount: 3, respawnsAfterKill: true, targetId: 1194, targetName: "Arclouse", targetSprite: "ARCLOUSE", targetLv: 59, cards: [{ id: 4240, name: "Arclouze Card", raw: "Arclouse_Card", rate: 1 }] },
    { casterId: 1305, casterName: "Ancient Worm", casterSprite: "ANCIENT_WORM", casterLv: 67, casterMvp: false, category: "field", summonCount: 2, respawnsAfterKill: true, targetId: 1099, targetName: "Argiope", targetSprite: "ARGIOPE", targetLv: 41, cards: [{ id: 4114, name: "Argiope Card", raw: "Argiope_Card", rate: 1 }] },
    { casterId: 1304, casterName: "Giant Spider", casterSprite: "GIANT_SPIDER", casterLv: 55, casterMvp: false, category: "field", summonCount: 2, respawnsAfterKill: true, targetId: 1100, targetName: "Argos", targetSprite: "ARGOS", targetLv: 25, cards: [{ id: 4075, name: "Argos Card", raw: "Argos_Card", rate: 1 }] },
    { casterId: 1039, casterName: "Baphomet", casterSprite: "BAPHOMET", casterLv: 81, casterMvp: true, category: "mvp", summonCount: 4, respawnsAfterKill: false, targetId: 1101, targetName: "Baphomet Jr.", targetSprite: "BAPHOMET_", targetLv: 50, cards: [{ id: 4147, name: "Baphomet Card", raw: "Baphomet__Card", rate: 1 }] },
    { casterId: 1115, casterName: "Eddga", casterSprite: "EDDGA", casterLv: 65, casterMvp: true, category: "mvp", summonCount: 5, respawnsAfterKill: false, targetId: 1060, targetName: "Bigfoot", targetSprite: "BIGFOOT", targetLv: 25, cards: [{ id: 4074, name: "Bigfoot Card", raw: "BigFoot_Card", rate: 1 }] },
    { casterId: 1366, casterName: "Lava Golem", casterSprite: "LAVA_GOLEM", casterLv: 77, casterMvp: false, category: "field", summonCount: 2, respawnsAfterKill: true, targetId: 1367, targetName: "Blazer", targetSprite: "BLAZZER", targetLv: 43, cards: [{ id: 4215, name: "Blazzer Card", raw: "Blazzer_Card", rate: 1 }] },
    { casterId: 1839, casterName: "Byorgue", casterSprite: "BYORGUE", casterLv: 86, casterMvp: false, category: "field", summonCount: 2, respawnsAfterKill: true, targetId: 1830, targetName: "Bow Guardian", targetSprite: "BOW_GUARDIAN", targetLv: 80, cards: [{ id: 4428, name: "Bow Guardian Card", raw: "Bow_Guardian_Card", rate: 1 }] },
    { casterId: 1873, casterName: "Beelzebub", casterSprite: "BEELZEBUB", casterLv: 98, casterMvp: false, category: "field", summonCount: 10, respawnsAfterKill: true, targetId: 1011, targetName: "Chonchon", targetSprite: "CHONCHON", targetLv: 4, cards: [{ id: 4009, name: "Chonchon Card", raw: "Chonchon_Card", rate: 1 }] },
    { casterId: 1874, casterName: "Beelzebub", casterSprite: "BEELZEBUB_", casterLv: 98, casterMvp: true, category: "mvp", summonCount: 10, respawnsAfterKill: true, targetId: 1011, targetName: "Chonchon", targetSprite: "CHONCHON", targetLv: 4, cards: [{ id: 4009, name: "Chonchon Card", raw: "Chonchon_Card", rate: 1 }] },
    { casterId: 1091, casterName: "Dragon Fly", casterSprite: "DRAGON_FLY", casterLv: 8, casterMvp: false, category: "field", summonCount: 5, respawnsAfterKill: true, targetId: 1011, targetName: "Chonchon", targetSprite: "CHONCHON", targetLv: 4, cards: [{ id: 4009, name: "Chonchon Card", raw: "Chonchon_Card", rate: 1 }] },
    { casterId: 1388, casterName: "Archangeling", casterSprite: "ARCHANGELING", casterLv: 60, casterMvp: false, category: "field", summonCount: 7, respawnsAfterKill: true, targetId: 1246, targetName: "Christmas Cookie", targetSprite: "COOKIE_XMAS", targetLv: 28, cards: [{ id: 4235, name: "Christmas Cookie Card", raw: "Cookie_XMAS_Card", rate: 1 }] },
    { casterId: 1293, casterName: "Creamy Fear", casterSprite: "CREMY_FEAR", casterLv: 62, casterMvp: false, category: "field", summonCount: 3, respawnsAfterKill: true, targetId: 1018, targetName: "Creamy", targetSprite: "CREAMY", targetLv: 16, cards: [{ id: 4040, name: "Creamy Card", raw: "Creamy_Card", rate: 1 }] },
    { casterId: 1292, casterName: "Mini Demon", casterSprite: "MINI_DEMON", casterLv: 68, casterMvp: false, category: "field", summonCount: 2, respawnsAfterKill: true, targetId: 1109, targetName: "Deviruchi", targetSprite: "DEVIRUCHI", targetLv: 46, cards: [{ id: 4122, name: "Deviruchi Card", raw: "Deviruchi_Card", rate: 1 }] },
    { casterId: 1685, casterName: "Vesper", casterSprite: "APOCALIPS_H", casterLv: 97, casterMvp: true, category: "mvp", summonCount: 3, respawnsAfterKill: true, targetId: 1669, targetName: "Dimik", targetSprite: "DIMIK", targetLv: 77, cards: [{ id: 4370, name: "Dimik Card", raw: "Dimik_Card", rate: 1 }] },
    { casterId: 1301, casterName: "Am Mut", casterSprite: "AM_MUT", casterLv: 61, casterMvp: false, category: "field", summonCount: 2, respawnsAfterKill: true, targetId: 1110, targetName: "Dokebi", targetSprite: "DOKEBI", targetLv: 33, cards: [{ id: 4098, name: "Dokebi Card", raw: "Dokebi_Card", rate: 1 }] },
    { casterId: 1090, casterName: "Mastering", casterSprite: "MASTERING", casterLv: 2, casterMvp: false, category: "field", summonCount: 5, respawnsAfterKill: true, targetId: 1113, targetName: "Drops", targetSprite: "DROPS", targetLv: 3, cards: [{ id: 4004, name: "Drops Card", raw: "Drops_Card", rate: 1 }] },
    { casterId: 1283, casterName: "Chimera", casterSprite: "CHIMERA", casterLv: 70, casterMvp: false, category: "field", summonCount: 4, respawnsAfterKill: true, targetId: 1253, targetName: "Gargoyle", targetSprite: "GARGOYLE", targetLv: 48, cards: [{ id: 4149, name: "Gargoyle Card", raw: "Gargoyle_Card", rate: 1 }] },
    { casterId: 1251, casterName: "Knight of Windstorm", casterSprite: "KNIGHT_OF_WINDSTORM", casterLv: 77, casterMvp: true, category: "mvp", summonCount: 2, respawnsAfterKill: false, targetId: 1515, targetName: "Garm Baby", targetSprite: "GARM_BABY", targetLv: 61, cards: [{ id: 4323, name: "Hatii Bebe Card", raw: "Garm_Baby_Card", rate: 1 }] },
    { casterId: 1298, casterName: "Zombie Master", casterSprite: "ZOMBIE_MASTER", casterLv: 62, casterMvp: false, category: "field", summonCount: 2, respawnsAfterKill: true, targetId: 1036, targetName: "Ghoul", targetSprite: "GHOUL", targetLv: 40, cards: [{ id: 4110, name: "Ghoul Card", raw: "Ghoul_Card", rate: 1 }] },
    { casterId: 1120, casterName: "Ghostring", casterSprite: "GHOSTRING", casterLv: 18, casterMvp: false, category: "field", summonCount: 5, respawnsAfterKill: false, targetId: 1186, targetName: "Giant Whisper", targetSprite: "WHISPER_BOSS", targetLv: 34, cards: [{ id: 4303, name: "Giant Whisper Card", raw: "Whisper_Boss_Card", rate: 1 }] },
    { casterId: 1299, casterName: "Goblin Leader", casterSprite: "GOBLIN_LEADER", casterLv: 64, casterMvp: false, category: "field", summonCount: 5, respawnsAfterKill: true, targetId: 1122, targetName: "Goblin", targetSprite: "GOBLIN_1", targetLv: 25, cards: [{ id: 4060, name: "Goblin Card", raw: "Goblin_Card", rate: 1 }] },
    { casterId: 1299, casterName: "Goblin Leader", casterSprite: "GOBLIN_LEADER", casterLv: 64, casterMvp: false, category: "field", summonCount: 5, respawnsAfterKill: true, targetId: 1123, targetName: "Goblin", targetSprite: "GOBLIN_2", targetLv: 24, cards: [{ id: 4060, name: "Goblin Card", raw: "Goblin_Card", rate: 1 }] },
    { casterId: 1299, casterName: "Goblin Leader", casterSprite: "GOBLIN_LEADER", casterLv: 64, casterMvp: false, category: "field", summonCount: 5, respawnsAfterKill: true, targetId: 1124, targetName: "Goblin", targetSprite: "GOBLIN_3", targetLv: 24, cards: [{ id: 4060, name: "Goblin Card", raw: "Goblin_Card", rate: 1 }] },
    { casterId: 1299, casterName: "Goblin Leader", casterSprite: "GOBLIN_LEADER", casterLv: 64, casterMvp: false, category: "field", summonCount: 5, respawnsAfterKill: true, targetId: 1125, targetName: "Goblin", targetSprite: "GOBLIN_4", targetLv: 23, cards: [{ id: 4060, name: "Goblin Card", raw: "Goblin_Card", rate: 1 }] },
    { casterId: 1299, casterName: "Goblin Leader", casterSprite: "GOBLIN_LEADER", casterLv: 64, casterMvp: false, category: "field", summonCount: 5, respawnsAfterKill: true, targetId: 1126, targetName: "Goblin", targetSprite: "GOBLIN_5", targetLv: 22, cards: [{ id: 4060, name: "Goblin Card", raw: "Goblin_Card", rate: 1 }] },
    { casterId: 1159, casterName: "Phreeoni", casterSprite: "PHREEONI", casterLv: 69, casterMvp: true, category: "mvp", summonCount: 10, respawnsAfterKill: false, targetId: 1127, targetName: "Hode", targetSprite: "HODE", targetLv: 26, cards: [{ id: 4081, name: "Hode Card", raw: "Hode_Card", rate: 1 }] },
    { casterId: 1309, casterName: "Gajomart", casterSprite: "GAJOMART", casterLv: 63, casterMvp: false, category: "field", summonCount: 2, respawnsAfterKill: true, targetId: 1129, targetName: "Horong", targetSprite: "HORONG", targetLv: 34, cards: [{ id: 4103, name: "Horong Card", raw: "Horong_Card", rate: 1 }] },
    { casterId: 1200, casterName: "Zherlthsh", casterSprite: "ZHERLTHSH", casterLv: 63, casterMvp: false, category: "field", summonCount: 3, respawnsAfterKill: true, targetId: 1257, targetName: "Injustice", targetSprite: "INJUSTICE", targetLv: 51, cards: [{ id: 4268, name: "Injustice Card", raw: "Injustice_Card", rate: 1 }] },
    { casterId: 1399, casterName: "Baphomet", casterSprite: "EVENT_BAPHO", casterLv: 68, casterMvp: true, category: "event", summonCount: 10, respawnsAfterKill: true, targetId: 1029, targetName: "Isis", targetSprite: "ISIS", targetLv: 47, cards: [{ id: 4116, name: "Isis Card", raw: "Isis_Card", rate: 1 }] },
    { casterId: 1038, casterName: "Osiris", casterSprite: "OSIRIS", casterLv: 78, casterMvp: true, category: "mvp", summonCount: 7, respawnsAfterKill: false, targetId: 1029, targetName: "Isis", targetSprite: "ISIS", targetLv: 47, cards: [{ id: 4116, name: "Isis Card", raw: "Isis_Card", rate: 1 }] },
    { casterId: 1219, casterName: "Knight of Abyss", casterSprite: "KNIGHT_OF_ABYSS", casterLv: 79, casterMvp: false, category: "field", summonCount: 2, respawnsAfterKill: true, targetId: 1132, targetName: "Khalitzburg", targetSprite: "KHALITZBURG", targetLv: 63, cards: [{ id: 4136, name: "Khalitzburg Card", raw: "Khalitzburg_Card", rate: 1 }] },
    { casterId: 1296, casterName: "Kobold Leader", casterSprite: "KOBOLD_LEADER", casterLv: 65, casterMvp: false, category: "field", summonCount: 5, respawnsAfterKill: true, targetId: 1133, targetName: "Kobold", targetSprite: "KOBOLD_1", targetLv: 36, cards: [{ id: 4091, name: "Kobold Card", raw: "Kobold_Card", rate: 1 }] },
    { casterId: 1296, casterName: "Kobold Leader", casterSprite: "KOBOLD_LEADER", casterLv: 65, casterMvp: false, category: "field", summonCount: 5, respawnsAfterKill: true, targetId: 1134, targetName: "Kobold", targetSprite: "KOBOLD_2", targetLv: 31, cards: [{ id: 4091, name: "Kobold Card", raw: "Kobold_Card", rate: 1 }] },
    { casterId: 1296, casterName: "Kobold Leader", casterSprite: "KOBOLD_LEADER", casterLv: 65, casterMvp: false, category: "field", summonCount: 5, respawnsAfterKill: true, targetId: 1135, targetName: "Kobold", targetSprite: "KOBOLD_3", targetLv: 31, cards: [{ id: 4091, name: "Kobold Card", raw: "Kobold_Card", rate: 1 }] },
    { casterId: 1296, casterName: "Kobold Leader", casterSprite: "KOBOLD_LEADER", casterLv: 65, casterMvp: false, category: "field", summonCount: 5, respawnsAfterKill: true, targetId: 1282, targetName: "Kobold Archer", targetSprite: "KOBOLD_ARCHER", targetLv: 33, cards: [{ id: 4292, name: "Kobold Archer Card", raw: "Kobold_Archer_Card", rate: 1 }] },
    { casterId: 1373, casterName: "Lord of Death", casterSprite: "LORD_OF_DEATH", casterLv: 94, casterMvp: true, category: "mvp", summonCount: 5, respawnsAfterKill: true, targetId: 1509, targetName: "Lude", targetSprite: "LUDE", targetLv: 36, cards: [{ id: 4193, name: "Lude Card", raw: "Lude_Card", rate: 1 }] },
    { casterId: 1093, casterName: "Eclipse", casterSprite: "ECLIPSE", casterLv: 6, casterMvp: false, category: "field", summonCount: 5, respawnsAfterKill: true, targetId: 1063, targetName: "Lunatic", targetSprite: "LUNATIC", targetLv: 3, cards: [{ id: 4006, name: "Lunatic Card", raw: "Lunatic_Card", rate: 1 }] },
    { casterId: 1294, casterName: "Killer Mantis", casterSprite: "KILLER_MANTIS", casterLv: 56, casterMvp: false, category: "field", summonCount: 2, respawnsAfterKill: true, targetId: 1139, targetName: "Mantis", targetSprite: "MANTIS", targetLv: 26, cards: [{ id: 4079, name: "Mantis Card", raw: "Mantis_Card", rate: 1 }] },
    { casterId: 1310, casterName: "Majoruros", casterSprite: "MAJORUROS", casterLv: 66, casterMvp: false, category: "field", summonCount: 2, respawnsAfterKill: true, targetId: 1149, targetName: "Minorous", targetSprite: "MINOROUS", targetLv: 52, cards: [{ id: 4126, name: "Minorous Card", raw: "Minorous_Card", rate: 1 }] },
    { casterId: 1399, casterName: "Baphomet", casterSprite: "EVENT_BAPHO", casterLv: 68, casterMvp: true, category: "event", summonCount: 10, respawnsAfterKill: true, targetId: 1026, targetName: "Munak", targetSprite: "MUNAK", targetLv: 30, cards: [{ id: 4090, name: "Munak Card", raw: "Munak_Card", rate: 1 }] },
    { casterId: 1307, casterName: "Cat o' Nine Tails", casterSprite: "CAT_O_NINE_TAIL", casterLv: 76, casterMvp: false, category: "field", summonCount: 2, respawnsAfterKill: true, targetId: 1180, targetName: "Nine Tail", targetSprite: "NINE_TAIL", targetLv: 51, cards: [{ id: 4159, name: "Nine Tail Card", raw: "Nine_Tail_Card", rate: 1 }] },
    { casterId: 1150, casterName: "Moonlight Flower", casterSprite: "MOONLIGHT", casterLv: 67, casterMvp: true, category: "mvp", summonCount: 3, respawnsAfterKill: false, targetId: 1180, targetName: "Nine Tail", targetSprite: "NINE_TAIL", targetLv: 51, cards: [{ id: 4159, name: "Nine Tail Card", raw: "Nine_Tail_Card", rate: 1 }] },
    { casterId: 1623, casterName: "RSX 0806", casterSprite: "RSX_0806", casterLv: 86, casterMvp: true, category: "mvp", summonCount: 5, respawnsAfterKill: true, targetId: 1620, targetName: "Noxious", targetSprite: "NOXIOUS", targetLv: 35, cards: [{ id: 4334, name: "Noxious Card", raw: "Noxious_Card", rate: 1 }] },
    { casterId: 1399, casterName: "Baphomet", casterSprite: "EVENT_BAPHO", casterLv: 68, casterMvp: true, category: "event", summonCount: 10, respawnsAfterKill: true, targetId: 1044, targetName: "Obeaune", targetSprite: "OBEAUNE", targetLv: 31, cards: [{ id: 4093, name: "Obeaune Card", raw: "Obeaune_Card", rate: 1 }] },
    { casterId: 1190, casterName: "Orc Lord", casterSprite: "ORC_LORD", casterLv: 74, casterMvp: true, category: "mvp", summonCount: 5, respawnsAfterKill: false, targetId: 1189, targetName: "Orc Archer", targetSprite: "ORC_ARCHER", targetLv: 49, cards: [{ id: 4256, name: "Orc Archer Card", raw: "Orc_Archer_Card", rate: 1 }] },
    { casterId: 1686, casterName: "Orc Baby", casterSprite: "ORC_BABY", casterLv: 21, casterMvp: false, category: "field", summonCount: 2, respawnsAfterKill: true, targetId: 1273, targetName: "Orc Lady", targetSprite: "ORC_LADY", targetLv: 31, cards: [{ id: 4255, name: "Orc Lady Card", raw: "Orc_Lady_Card", rate: 1 }] },
    { casterId: 1686, casterName: "Orc Baby", casterSprite: "ORC_BABY", casterLv: 21, casterMvp: false, category: "field", summonCount: 2, respawnsAfterKill: true, targetId: 1023, targetName: "Orc Warrior", targetSprite: "ORK_WARRIOR", targetLv: 24, cards: [{ id: 4066, name: "Orc Warrior Card", raw: "Orc_Warrior_Card", rate: 1 }] },
    { casterId: 1295, casterName: "Owl Baron", casterSprite: "OWL_BARON", casterLv: 75, casterMvp: false, category: "field", summonCount: 2, respawnsAfterKill: true, targetId: 1320, targetName: "Owl Duke", targetSprite: "OWL_DUKE", targetLv: 75, cards: [{ id: 4237, name: "Owl Duke Card", raw: "Owl_Duke_Card", rate: 1 }] },
    { casterId: 1059, casterName: "Mistress", casterSprite: "MISTRESS", casterLv: 74, casterMvp: true, category: "mvp", summonCount: 4, respawnsAfterKill: false, targetId: 1156, targetName: "Petite", targetSprite: "PETIT_", targetLv: 45, cards: [{ id: 4120, name: "Sky Petite Card", raw: "Petit__Card", rate: 1 }] },
    { casterId: 1096, casterName: "Angeling", casterSprite: "ANGELING", casterLv: 20, casterMvp: false, category: "field", summonCount: 5, respawnsAfterKill: true, targetId: 1031, targetName: "Poporing", targetSprite: "POPORING", targetLv: 14, cards: [{ id: 4033, name: "PoPoring Card", raw: "Poporing_Card", rate: 1 }] },
    { casterId: 1766, casterName: "Angeling", casterSprite: "EM_ANGELING", casterLv: 99, casterMvp: false, category: "event", summonCount: 5, respawnsAfterKill: true, targetId: 1031, targetName: "Poporing", targetSprite: "POPORING", targetLv: 14, cards: [{ id: 4033, name: "PoPoring Card", raw: "Poporing_Card", rate: 1 }] },
    { casterId: 1090, casterName: "Mastering", casterSprite: "MASTERING", casterLv: 2, casterMvp: false, category: "field", summonCount: 5, respawnsAfterKill: true, targetId: 1002, targetName: "Poring", targetSprite: "PORING", targetLv: 1, cards: [{ id: 4001, name: "Poring Card", raw: "Poring_Card", rate: 1 }] },
    { casterId: 1373, casterName: "Lord of Death", casterSprite: "LORD_OF_DEATH", casterLv: 94, casterMvp: true, category: "mvp", summonCount: 5, respawnsAfterKill: true, targetId: 1508, targetName: "Quve", targetSprite: "QUVE", targetLv: 40, cards: [{ id: 4294, name: "Quve Card", raw: "Quve_Card", rate: 1 }] },
    { casterId: 1088, casterName: "Vocal", casterSprite: "VOCAL", casterLv: 18, casterMvp: false, category: "field", summonCount: 5, respawnsAfterKill: true, targetId: 1052, targetName: "Rocker", targetSprite: "ROCKER", targetLv: 9, cards: [{ id: 4021, name: "Rocker Card", raw: "Rocker_Card", rate: 1 }] },
    { casterId: 1089, casterName: "Toad", casterSprite: "TOAD", casterLv: 10, casterMvp: false, category: "field", summonCount: 5, respawnsAfterKill: true, targetId: 1012, targetName: "Roda Frog", targetSprite: "RODA_FROG", targetLv: 5, cards: [{ id: 4014, name: "Roda Frog Card", raw: "Roda_Frog_Card", rate: 1 }] },
    { casterId: 1096, casterName: "Angeling", casterSprite: "ANGELING", casterLv: 20, casterMvp: false, category: "field", summonCount: 5, respawnsAfterKill: true, targetId: 1062, targetName: "Santa Poring", targetSprite: "PORING_", targetLv: 3, cards: [{ id: 4005, name: "Santa Poring Card", raw: "Poring__Card", rate: 1 }] },
    { casterId: 1766, casterName: "Angeling", casterSprite: "EM_ANGELING", casterLv: 99, casterMvp: false, category: "event", summonCount: 5, respawnsAfterKill: true, targetId: 1062, targetName: "Santa Poring", targetSprite: "PORING_", targetLv: 3, cards: [{ id: 4005, name: "Santa Poring Card", raw: "Poring__Card", rate: 1 }] },
    { casterId: 1306, casterName: "Leib Olmai", casterSprite: "LEIB_OLMAI", casterLv: 58, casterMvp: false, category: "field", summonCount: 3, respawnsAfterKill: true, targetId: 1243, targetName: "Sasquatch", targetSprite: "SASQUATCH", targetLv: 30, cards: [{ id: 4216, name: "Sasquatch Card", raw: "Sasquatch_Card", rate: 1 }] },
    { casterId: 1311, casterName: "Gullinbursti", casterSprite: "GULLINBURSTI", casterLv: 62, casterMvp: false, category: "field", summonCount: 4, respawnsAfterKill: true, targetId: 1166, targetName: "Savage", targetSprite: "SAVAGE", targetLv: 26, cards: [{ id: 4078, name: "Savage Card", raw: "Savage_Card", rate: 1 }] },
    { casterId: 1975, casterName: "Beholder Master", casterSprite: "BEHOLDER_MASTER", casterLv: 70, casterMvp: false, category: "field", summonCount: 2, respawnsAfterKill: false, targetId: 1774, targetName: "Seeker", targetSprite: "SEEKER", targetLv: 65, cards: [{ id: 4414, name: "Seeker Card", raw: "Seeker_Card", rate: 1 }] },
    { casterId: 1399, casterName: "Baphomet", casterSprite: "EVENT_BAPHO", casterLv: 68, casterMvp: true, category: "event", summonCount: 10, respawnsAfterKill: true, targetId: 1170, targetName: "Sohee", targetSprite: "SOHEE", targetLv: 33, cards: [{ id: 4100, name: "Sohee Card", raw: "Sohee_Card", rate: 1 }] },
    { casterId: 1290, casterName: "Skeleton General", casterSprite: "SKELETON_GENERAL", casterLv: 73, casterMvp: false, category: "field", summonCount: 2, respawnsAfterKill: true, targetId: 1028, targetName: "Soldier Skeleton", targetSprite: "SOLDIER_SKELETON", targetLv: 29, cards: [{ id: 4086, name: "Soldier Skeleton Card", raw: "Soldier_Skeleton_Card", rate: 1 }] },
    { casterId: 1839, casterName: "Byorgue", casterSprite: "BYORGUE", casterLv: 86, casterMvp: false, category: "field", summonCount: 2, respawnsAfterKill: true, targetId: 1829, targetName: "Sword Guardian", targetSprite: "SWORD_GUARDIAN", targetLv: 86, cards: [{ id: 4427, name: "Sword Guardian Card", raw: "Sword_Guardian_Card", rate: 1 }] },
    { casterId: 1086, casterName: "Golden Thief Bug", casterSprite: "GOLDEN_BUG", casterLv: 64, casterMvp: true, category: "mvp", summonCount: 10, respawnsAfterKill: false, targetId: 1054, targetName: "Thief Bug Male", targetSprite: "THIEF_BUG__", targetLv: 19, cards: [{ id: 4050, name: "Male Thiefbug Card", raw: "Thief_Bug_Male_Card", rate: 1 }] },
    { casterId: 1685, casterName: "Vesper", casterSprite: "APOCALIPS_H", casterLv: 97, casterMvp: true, category: "mvp", summonCount: 3, respawnsAfterKill: true, targetId: 1675, targetName: "Venatu", targetSprite: "VENATU", targetLv: 77, cards: [{ id: 4369, name: "Venatu Card", raw: "Venatu_Card", rate: 1 }] },
    { casterId: 1623, casterName: "RSX 0806", casterSprite: "RSX_0806", casterLv: 86, casterMvp: true, category: "mvp", summonCount: 5, respawnsAfterKill: true, targetId: 1621, targetName: "Venomous", targetSprite: "VENOMOUS", targetLv: 42, cards: [{ id: 4333, name: "Venomous Card", raw: "Venomous_Card", rate: 1 }] },
    { casterId: 1623, casterName: "RSX 0806", casterSprite: "RSX_0806", casterLv: 86, casterMvp: true, category: "mvp", summonCount: 5, respawnsAfterKill: false, targetId: 1617, targetName: "Waste Stove", targetSprite: "WASTE_STOVE", targetLv: 68, cards: [{ id: 4332, name: "Waste Stove Card", raw: "Waste_Stove_Card", rate: 1 }] },
    { casterId: 1373, casterName: "Lord of Death", casterSprite: "LORD_OF_DEATH", casterLv: 94, casterMvp: true, category: "mvp", summonCount: 5, respawnsAfterKill: true, targetId: 1179, targetName: "Whisper", targetSprite: "WHISPER", targetLv: 34, cards: [{ id: 4102, name: "Whisper Card", raw: "Whisper_Card", rate: 1 }] },
    { casterId: 1092, casterName: "Vagabond Wolf", casterSprite: "VAGABOND_WOLF", casterLv: 24, casterMvp: false, category: "field", summonCount: 5, respawnsAfterKill: true, targetId: 1013, targetName: "Wolf", targetSprite: "WOLF", targetLv: 25, cards: [{ id: 4029, name: "Wolf Card", raw: "Wolf_Card", rate: 1 }] },
    { casterId: 1112, casterName: "Drake", casterSprite: "DRAKE", casterLv: 70, casterMvp: true, category: "mvp", summonCount: 4, respawnsAfterKill: false, targetId: 1192, targetName: "Wraith", targetSprite: "WRAITH", targetLv: 53, cards: [{ id: 4190, name: "Wraith Card", raw: "Wraith_Card", rate: 1 }] },
    { casterId: 1214, casterName: "Choco", casterSprite: "CHOCO", casterLv: 43, casterMvp: false, category: "field", summonCount: 3, respawnsAfterKill: true, targetId: 1057, targetName: "Yoyo", targetSprite: "YOYO", targetLv: 21, cards: [{ id: 4051, name: "Yoyo Card", raw: "Yoyo_Card", rate: 1 }] },
    { casterId: 1870, casterName: "Necromancer", casterSprite: "NECROMANCER", casterLv: 88, casterMvp: false, category: "field", summonCount: 2, respawnsAfterKill: true, targetId: 1864, targetName: "Zombie Slaughter", targetSprite: "ZOMBIE_SLAUGHTER", targetLv: 77, cards: [{ id: 4435, name: "Zombie Slaughter Card", raw: "Zombie_Slaughter_Card", rate: 1 }] }
  ];

  const ssState = {
    respawnOnly: true,
    showField: true,
    showMvp: true,
    showEvent: false,
    query: '',
    sortKey: 'targetName',
    sortDir: 'asc'
  };

  function esc(s) {
    if (typeof escapeHtml === 'function') return escapeHtml(s);
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function rmsMobUrl(id) {
    return `https://ratemyserver.net/index.php?page=mob_db&mob_id=${id}`;
  }

  function getUnlockEffect(cardId) {
    const unlockList = window.DATA?.itemLists?.find(l => l.name === 'Unlock List');
    const fromList = unlockList?.effects?.[cardId];
    if (fromList) return String(fromList).trim();

    const rawDesc = window.DATA?.items?.[cardId]?.desc;
    if (!rawDesc) return '';
    const clean = (Array.isArray(rawDesc) ? rawDesc.join('\n') : String(rawDesc)).replace(/\^[0-9A-Fa-f]{6}/g, '');
    const m = clean.match(/\[\s*Unlock Effect\s*\]\s*[\r\n]+([^\r\n-]+)/i);
    return m ? m[1].trim() : '';
  }

  function getCardDisplayName(card) {
    const dbItem = window.DATA?.items?.[card.id];
    return (dbItem && dbItem.name) ? dbItem.name : card.name;
  }

  function getFilteredRows() {
    const q = ssState.query.trim().toLowerCase();
    return SLAVE_SUMMONS_DATA.filter(r => {
      if (ssState.respawnOnly && !r.respawnsAfterKill) return false;
      if (r.category === 'field' && !ssState.showField) return false;
      if (r.category === 'mvp' && !ssState.showMvp) return false;
      if (r.category === 'event' && !ssState.showEvent) return false;
      if (q) {
        const cardHay = r.cards.map(c => {
          const dispName = getCardDisplayName(c);
          const unlockEff = getUnlockEffect(c.id);
          return `${c.id} ${dispName} ${c.name} ${c.raw} ${unlockEff}`;
        }).join(' ');
        const hay = [
          r.casterId, r.casterName, r.casterSprite,
          r.targetId, r.targetName, r.targetSprite,
          cardHay
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      let va, vb;
      if (ssState.sortKey === 'card') {
        va = a.cards[0] ? getCardDisplayName(a.cards[0]) : '';
        vb = b.cards[0] ? getCardDisplayName(b.cards[0]) : '';
      } else if (ssState.sortKey === 'unlock') {
        va = a.cards[0] ? getUnlockEffect(a.cards[0].id) : '';
        vb = b.cards[0] ? getUnlockEffect(b.cards[0].id) : '';
      } else {
        va = a[ssState.sortKey];
        vb = b[ssState.sortKey];
      }
      let cmp;
      if (typeof va === 'number' && typeof vb === 'number') {
        cmp = ssState.sortDir === 'asc' ? va - vb : vb - va;
      } else {
        cmp = ssState.sortDir === 'asc'
          ? String(va).localeCompare(String(vb))
          : String(vb).localeCompare(String(va));
      }
      if (cmp !== 0) return cmp;
      return a.targetId - b.targetId || a.casterName.localeCompare(b.casterName);
    });
  }

  function renderCardPillHtml(card) {
    const displayName = getCardDisplayName(card);
    const iconHtml = typeof renderItemIcon === 'function' ? renderItemIcon(card.id, 16) : '';
    const url = typeof itemUrl === 'function' ? itemUrl(card.id) : `?item=${card.id}`;

    return `
      <a class="ss-card-pill" href="${url}" onclick="event.preventDefault(); window.ssNavigateToItem(${card.id});" title="View ${esc(displayName)} (#${card.id}) in Item Database">
        ${iconHtml}
        <span class="ss-card-name">${esc(displayName)}</span>
      </a>`;
  }

  function renderUnlockEffectHtml(card) {
    const unlockEffect = getUnlockEffect(card.id);
    if (!unlockEffect) return '';
    const unlockIconHtml = window.SVG_ICONS?.unlock14 || '';
    return `<div class="ss-unlock-effect" title="Unlock Effect: ${esc(unlockEffect)}"><span class="ss-unlock-label" aria-label="Unlock Effect">${unlockIconHtml}</span><span>${esc(unlockEffect)}</span></div>`;
  }

  function renderResults(rows) {
    const uniqueTargets = new Set(rows.map(r => r.targetId)).size;
    const uniqueCasters = new Set(rows.map(r => r.casterId)).size;

    const statsEl = document.getElementById('ssStatsText');
    if (statsEl) {
      statsEl.innerHTML = `<strong>${rows.length}</strong> pairs · <strong>${uniqueTargets}</strong> real mobs · <strong>${uniqueCasters}</strong> casters`;
    }

    document.querySelectorAll('.ss-table thead th[data-sort]').forEach(th => {
      const ind = th.querySelector('.ss-sort-ind');
      if (!ind) return;
      if (th.dataset.sort === ssState.sortKey) {
        ind.textContent = ssState.sortDir === 'asc' ? '▲' : '▼';
      } else {
        ind.textContent = '';
      }
    });

    const tableWrap = document.getElementById('ssTableWrap');
    const tableBody = document.getElementById('ssTableBody');
    const cardsList = document.getElementById('ssCardsList');
    const emptyState = document.getElementById('ssEmptyState');

    if (!rows.length) {
      if (tableBody) tableBody.innerHTML = '';
      if (cardsList) cardsList.innerHTML = '';
      if (tableWrap) tableWrap.classList.add('ss-is-empty');
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (tableWrap) tableWrap.classList.remove('ss-is-empty');
    if (emptyState) emptyState.style.display = 'none';

    if (tableBody) {
      tableBody.innerHTML = rows.map(r => `
        <tr>
          <td>
            <div class="ss-mob-cell">
              <div class="ss-mob-top">
                <button type="button" class="ss-id-pill" onclick="window.ssCopyText('${r.targetId}')" title="Copy Mob ID (${r.targetId})">${r.targetId}</button>
                <a class="ss-mob-link" href="${rmsMobUrl(r.targetId)}" target="_blank" rel="noopener noreferrer">${esc(r.targetName)}</a>
                ${!r.respawnsAfterKill ? '<span class="ss-badge ss-badge-spawn">Initial Spawn Only</span>' : ''}
              </div>
            </div>
          </td>
          <td>
            <div class="ss-mob-cell">
              <div class="ss-mob-top">
                <button type="button" class="ss-id-pill" onclick="window.ssCopyText('${r.casterId}')" title="Copy Mob ID (${r.casterId})">${r.casterId}</button>
                <a class="ss-mob-link" href="${rmsMobUrl(r.casterId)}" target="_blank" rel="noopener noreferrer">${esc(r.casterName)}</a>
                ${r.casterMvp ? '<span class="ss-badge ss-badge-mvp">MVP</span>' : ''}
                ${r.category === 'event' ? '<span class="ss-badge ss-badge-event">Event</span>' : ''}
              </div>
            </div>
          </td>
          <td>
            <div class="ss-card-drops">
              ${r.cards.map(c => renderCardPillHtml(c)).join('')}
            </div>
          </td>
          <td>
            <div class="ss-card-drops">
              ${r.cards.map(c => renderUnlockEffectHtml(c)).join('') || '<span class="ss-mob-meta">—</span>'}
            </div>
          </td>
          <td class="ss-col-qty"><span class="ss-qty">${r.summonCount}</span></td>
        </tr>
      `).join('');
    }

    if (cardsList) {
      cardsList.innerHTML = rows.map(r => `
        <article class="ss-m-card">
          <div class="ss-m-card-head">
            <div class="ss-mob-cell">
              <div class="ss-mob-top">
                <button type="button" class="ss-id-pill" onclick="window.ssCopyText('${r.targetId}')" title="Copy Mob ID (${r.targetId})">${r.targetId}</button>
                <a class="ss-mob-link" href="${rmsMobUrl(r.targetId)}" target="_blank" rel="noopener noreferrer">${esc(r.targetName)}</a>
                ${!r.respawnsAfterKill ? '<span class="ss-badge ss-badge-spawn">Initial Spawn Only</span>' : ''}
              </div>
            </div>
            <div class="ss-m-qty-badge" title="Summon Quantity">
              <span class="ss-m-qty-label">Qty</span>
              <span class="ss-qty-inline">${r.summonCount}</span>
            </div>
          </div>
          <div class="ss-m-caster-row">
            <div class="ss-m-caster-left">
              <span class="ss-m-arrow">Spawned by</span>
              <button type="button" class="ss-id-pill" onclick="window.ssCopyText('${r.casterId}')" title="Copy Mob ID (${r.casterId})">${r.casterId}</button>
              <a class="ss-mob-link" href="${rmsMobUrl(r.casterId)}" target="_blank" rel="noopener noreferrer">${esc(r.casterName)}</a>
            </div>
            ${(r.casterMvp || r.category === 'event') ? `
              <div class="ss-m-caster-badges">
                ${r.casterMvp ? '<span class="ss-badge ss-badge-mvp">MVP</span>' : ''}
                ${r.category === 'event' ? '<span class="ss-badge ss-badge-event">Event</span>' : ''}
              </div>
            ` : ''}
          </div>
          <div class="ss-m-card-foot">
            <div class="ss-card-drops">
              ${r.cards.map(c => renderCardPillHtml(c)).join('')}
            </div>
            <div class="ss-card-drops">
              ${r.cards.map(c => renderUnlockEffectHtml(c)).join('')}
            </div>
          </div>
        </article>
      `).join('');
    }
  }

  function renderSlavesMain() {
    const main = document.getElementById('mainContent');
    if (!main) return;

    const iconHtml = window.SVG_ICONS?.slaves18
      ? `<span class="lab-section-icon">${window.SVG_ICONS.slaves18}</span>`
      : '';

    main.innerHTML = `
      <div class="lab-section ss-page">
        <div class="lab-section-header">
          <div class="lab-section-title">
            ${iconHtml}
            <span>Real Slave Summons</span>
          </div>
          <div class="lab-section-meta">
            Pre-Renewal monsters using <code>NPC_SUMMONSLAVE</code> that spawn real, card-dropping monsters (excluding fake no-drop slaves like <code>1461</code> <code>G_MINOROUS</code>). Sourced from Hercules <code>db/pre-re</code>.
          </div>
        </div>

        <section class="ss-controls">
          <div class="dt-search-wrapper ss-search-wrapper">
            <span class="dt-search-icon">🔍</span>
            <input id="ssSearchInput" type="search" class="dt-search-input ss-search-input"
              placeholder="Search real mob, caster, ID, card, or unlock effect..."
              value="${esc(ssState.query)}"
              oninput="window.ssHandleSearch(this.value)"
              autocomplete="off" />
            <button id="ssClearSearch" type="button" class="btn btn-sm ss-clear-btn ${ssState.query ? 'visible' : ''}"
              onclick="window.ssClearSearch()" title="Clear search" aria-label="Clear search">×</button>
          </div>
          <div class="ss-chips">
            <button type="button" id="ssRespawnBtn" class="ss-chip ss-chip-green ${ssState.respawnOnly ? 'active' : ''}"
              onclick="window.ssToggleRespawnOnly()"
              title="Excludes monsters that only summon real mobs on initial spawn (MSC_SPAWN) without respawning them after death">
              Respawns After Kill Only
            </button>
            <button type="button" id="ssFieldBtn" class="ss-chip ${ssState.showField ? 'active' : ''}"
              onclick="window.ssToggleCategory('field')">Field Mobs</button>
            <button type="button" id="ssMvpBtn" class="ss-chip ${ssState.showMvp ? 'active' : ''}"
              onclick="window.ssToggleCategory('mvp')">MVPs</button>
            <button type="button" id="ssEventBtn" class="ss-chip ${ssState.showEvent ? 'active' : ''}"
              onclick="window.ssToggleCategory('event')">Event Mobs</button>
            <span class="ss-stats" id="ssStatsText"></span>
          </div>
        </section>

        <div class="ss-table-wrap" id="ssTableWrap">
          <table class="ss-table">
            <thead>
              <tr>
                <th data-sort="targetName" onclick="window.ssHandleSort('targetName')">Real Mob Spawned <span class="ss-sort-ind"></span></th>
                <th data-sort="casterName" onclick="window.ssHandleSort('casterName')">Spawned By (Caster) <span class="ss-sort-ind"></span></th>
                <th data-sort="card" onclick="window.ssHandleSort('card')">Card Drop <span class="ss-sort-ind"></span></th>
                <th data-sort="unlock" onclick="window.ssHandleSort('unlock')">Unlock Effect <span class="ss-sort-ind"></span></th>
                <th class="ss-col-qty" data-sort="summonCount" onclick="window.ssHandleSort('summonCount')">Qty <span class="ss-sort-ind"></span></th>
              </tr>
            </thead>
            <tbody id="ssTableBody"></tbody>
          </table>
        </div>

        <div class="ss-cards-list" id="ssCardsList"></div>
        <div class="ss-empty" id="ssEmptyState" style="display:none;">No matching monsters found.</div>
      </div>
    `;

    renderResults(getFilteredRows());
  }

  window.ssHandleSearch = function (val) {
    ssState.query = val || '';
    const clearBtn = document.getElementById('ssClearSearch');
    if (clearBtn) clearBtn.classList.toggle('visible', ssState.query.length > 0);
    renderResults(getFilteredRows());
  };

  window.ssClearSearch = function () {
    ssState.query = '';
    const input = document.getElementById('ssSearchInput');
    if (input) {
      input.value = '';
      input.focus();
    }
    const clearBtn = document.getElementById('ssClearSearch');
    if (clearBtn) clearBtn.classList.remove('visible');
    renderResults(getFilteredRows());
  };

  window.ssToggleRespawnOnly = function () {
    ssState.respawnOnly = !ssState.respawnOnly;
    const btn = document.getElementById('ssRespawnBtn');
    if (btn) btn.classList.toggle('active', ssState.respawnOnly);
    renderResults(getFilteredRows());
  };

  window.ssToggleCategory = function (cat) {
    if (cat === 'field') {
      ssState.showField = !ssState.showField;
      document.getElementById('ssFieldBtn')?.classList.toggle('active', ssState.showField);
    } else if (cat === 'mvp') {
      ssState.showMvp = !ssState.showMvp;
      document.getElementById('ssMvpBtn')?.classList.toggle('active', ssState.showMvp);
    } else if (cat === 'event') {
      ssState.showEvent = !ssState.showEvent;
      document.getElementById('ssEventBtn')?.classList.toggle('active', ssState.showEvent);
    }
    renderResults(getFilteredRows());
  };

  window.ssHandleSort = function (key) {
    if (ssState.sortKey === key) {
      ssState.sortDir = ssState.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      ssState.sortKey = key;
      ssState.sortDir = 'asc';
    }
    renderResults(getFilteredRows());
  };

  window.ssNavigateToItem = function (itemId) {
    if (typeof navigateToItem === 'function') {
      navigateToItem(itemId);
    }
  };

  window.ssCopyText = function (text) {
    if (!text) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(String(text)).then(() => {
        if (typeof showToast === 'function') showToast(`Copied ID: ${text}`, 'success', 1600);
      }).catch(() => {
        if (typeof showToast === 'function') showToast(`Failed to copy`, 'error', 1600);
      });
    }
  };

  window.registerLabExperiment?.('lab-slaves', {
    tabId:        'lab-slaves',
    title:        'Real Slave Summons',
    sidebarLabel: 'Real Slave Summons',
    sidebarIcon:  window.SVG_ICONS?.slaves14 || '',
    renderMain:   renderSlavesMain,
  });
})();
