// 前綴：保留臺南特色並新增奇幻與現代元素
const prefixes: string[] = [
  // 原有臺南特色
  "赤崁",
  "安平",
  "億載",
  "七股",
  "鹽田",
  "四草",
  "天后",
  "孔廟",
  "花園",
  "老街",
  "南科",
  "西港",
  "關廟",
  "學甲",
  "新化",
  "麻豆",
  "善化",
  "白河",
  "玉井",
  "楠西",
  "東山",
  "鹽水",
  "大內",
  "永康",
  "大灣",
  "隆田",
  "北門",
  "後壁",
  "南化",
  "新營",
  "中西區",
  "樹林街",
  "南門路",
  "新市",
  "新化",
  "仁德",
  "大橋",
  "學府",
  
  // 臺南的文化與歷史景點
  "赤崁樓",
  "安平",
  "古堡",
  "奇美",
  "神農街",
  "臺文館",
  "天壇",
  "七股",
  "鹽山",
  "林百貨",
  "河樂",
  "友愛",
  "南門",
  "永樂",
  "新美",
  "國華",
  "南美館",
  "蝸牛巷",
  "巴克禮",
  "新天地",
  "南紡",
  "武聖",
  "大東",
  "普濟",
  "延平",
  "吳園",
  "海安",
  "鴉母寮",
  "鶯料理",
  "鷲嶺",
  "府城",
  "山川臺",
  "山仔尾",
  "開山",
  "五條港",
  "米街",

  // 新增自然與景觀特色
  "柳營",
  "台江",
  "曾文",
  "藍晒圖",
  "沙崙",
  "灣裡",
  "虎頭埤",
  
  // 新增與臺南特色相關的奇幻風元素
  "古堡",
  "海潮",
  "漁光",
  "北門",
  "九份子",
];

// 形容詞：新增奇幻、風趣、現代風格
const adjectives: string[] = [
  // 原有形容詞
  "隱秘的",
  "古老的",
  "金色的",
  "靜謐的",
  "熱情的",
  "神秘的",
  "勇敢的",
  "悠久的",
  "美味的",
  "自然的",
  "聖潔的",
  "繁榮的",
  "堅毅的",
  "溫暖的",
  "傳奇的",
  
  // 奇幻風
  "魔法",
  "詛咒的",
  "星光的",
  "虛空的",
  "不滅的",
  "咒印的",
  "焰火的",
  "黑霧的",
  "幽暗的",
  "冰冷的",
  "天空的",
  "翅膀的",
  "魔幻的",
  "精靈的",
  "妖精的",
  "神奇的",
  "破碎的",
  
  // 風趣風
  "搗亂的",
  "愛吃",
  "貪睡的",
  "暴走的",
  "迷糊的",
  "爆笑的",
  "捉弄的",
  "正經的",
  "調皮的",
  "瘋狂的",
  "銷魂的",
  
  // 現代風
  "雲端的",
  "潮流的",
  "虛擬的",
  "數位的",
  "科技的",
  "智能的",
  "未來的",
  "網路的",
  "極限的",
  "光速的",
  "超現實",
  "創新的",
  "機械的",
  "無限的",
  "科幻的",
];

// 後綴：新增奇幻、風趣、現代風格
const suffixes: string[] = [
  // 原有後綴
  "黑輪使者",
  "米血旅人",
  "魚丸戰士",
  "碗粿賢者",
  "肉丸獵手",
  "臭豆腐王",
  "擔仔",
  "蝦捲",
  "碗粿",
  "鹹粥",
  "古堡",
  "潟湖",
  "琵鷺",
  "綠隧",
  "夜市",
  "意麵之魂",
  "蔥餅祭司",
  "豬血湯",
  "漁夫",
  "擔仔麵",
  "農夫",
  "煉金師",
  "牛肉湯",
  "牛肉",
  "肉燥",
  "鮮魚湯",
  "蝦仁飯",
  "滷味",
  "蛋餅",
  "砂鍋魚頭",
  "台南大師",
  "古都使者",
  "田園大亨",
  
  // 奇幻風
  "乾麵騎士",
  "青菜精靈",
  "蚵仔煎",
  "春捲忍者",
  "鴨肉咒術",
  "迎風之舞",
  "夜市巫師",
  "麻醬使者",
  "餛飩大師",
  "白河使",
  "黑暗料理",
  "冰火波羅",
  "貢丸族",
  "食物老師",
  
  // 風趣風
  "臭豆腐俠",
  "棺材板怪",
  "蚵仔煎霸",
  "雞腿大俠",
  "碗粿笑匠",
  "草地高手",
  "鮮奶哥",
  "濃湯小子",
  "老街玩家",
  "米粉",
  "番薯大王",
  "火鍋英雄",
  "豆花騎士",
  "宵夜神",
  "烤雞霸王",
  "美食巨擘",
  "蚵嗲先鋒",
  "飲料之王",
  "甜食教主",
  "甜點大師",
  
  // 現代風
  "明日之星",
  "智慧達人",
  "社群明星",
  "流行家",
];

// 隨機選擇元素的函數
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// 生成隨機角色名稱
export function generateTainanCharacterName(): string {
  return `${getRandomItem(prefixes)}${getRandomItem(adjectives)}${getRandomItem(
    suffixes
  )}`;
}
