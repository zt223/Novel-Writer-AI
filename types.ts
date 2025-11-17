// Inspired by Fanqie Novel Categories (番茄小说分类)

export enum NovelTheme {
  Fantasy = '东方奇幻',
  EasternFantasy = '东方仙侠',
  SciFiFuture = '科幻末世',
  UrbanGaoWu = '都市高武',
  UrbanSupernatural = '悬疑灵异',
  SuspenseBrain = '悬疑脑洞',
  AntiWar = '抗战谍战',
  HistoricalAncient = '历史古代',
  HistoricalBrain = '历史脑洞',
  UrbanFarming = '都市种田',
  UrbanBrain = '都市脑洞',
  UrbanDaily = '都市日常',
  XuanhuanBrain = '玄幻脑洞',
  Wargod = '战神赘婿',
  AnimeDerivative = '动漫衍生',
  GameSports = '游戏体育',
  TraditionalXuanhuan = '传统玄幻',
  UrbanCultivation = '都市修真',
  NewGodDerivative = '新神衍生',
  TenDayDerivative = '十日衍生',
  JourneyToWest = '西游衍生',
  PublicDerivative = '公版衍生',
  RedMansion = '红楼衍生',
  Custom = '自定义... | Custom...',
}

export enum CharacterArchetype {
  MultiFemaleLead = '多女主',
  ZhuiXu = '赘婿', // Son-in-law who lives with wife's family
  Almighty = '全能',
  DaLao = '大佬', // Big shot / boss
  Miss = '大小姐',
  TeGong = '特工', // Secret agent
  GameAnchor = '游戏主播',
  ShenTan = '神探', // Divine detective
  PalaceGuard = '宫廷侯爵',
  Emperor = '皇帝',
  SingleFemaleLead = '单女主',
  SchoolBeauty = '校花',
  NoFemaleLead = '无女主',
  Empress = '女帝',
  SpecialForces = '特种兵',
  Villain = '反派',
  ShenYi = '神医', // Divine doctor
  NaiBa = '奶爸', // Stay-at-home dad
  XueBa = '学霸', // Top student
  Genius = '天才',
  FuHei = '腹黑', // Black-bellied / scheming
  PretendToBeWeak = '扮猪吃虎',
  Custom = '自定义... | Custom...',
}

export enum PlotTrope {
  Derivative = '衍生',
  Invincible = '无敌',
  YiTu = '仕途', // Official career
  ZongYing = '综影视', // Comprehensive film and television
  Apocalypse = '天灾',
  FirstPerson = '第一人称',
  Cyberpunk = '赛博朋克',
  FourthApocalypse = '第四天灾',
  Gourmet = '美食',
  Ancient = '古代',
  Suspense = '悬疑',
  Cthulhu = '克苏鲁',
  UrbanSuperpower = '都市异能',
  ApocalypseSurvival = '末日求生',
  SpiritRevival = '灵气复苏',
  GaoWuWorld = '高武世界',
  OtherWorld = '异世大陆',
  GoToEast = '东方玄幻',
  KeZhan = '课战', // Class battle?
  QingChao = '清朝',
  SongChao = '宋朝',
  DuanCeng = '断层', // Fault line / gap
  WuJiang = '武将', // Military general
  GuoYun = '国运', // National fortune
  ZongZong = '综综', // Comprehensive?
  System = '系统流',
  Custom = '自定义... | Custom...',
}

export enum AuthorStyle {
  Default = '默认风格 | Default',
  WoChiXiHongShi = '我吃西红柿 | I Eat Tomatoes',
  ChenDong = '辰东 | Chen Dong',
  TangJiaSanShao = '唐家三少 | Tang Jia San Shao',
  ErGen = '耳根 | Er Gen',
  Custom = '自定义... | Custom...',
}

export enum NovelLength {
  Short = '短篇 (<5万字)',
  Medium = '中篇 (5-20万字)',
  Long = '长篇 (20-100万字)',
  Epic = '超长篇 (100万字+)',
}

// FIX: Add missing Language enum for LanguageSelector component.
export enum Language {
  EN = 'en',
  ZH = 'zh',
}
