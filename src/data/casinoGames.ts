/**
 * Casino Games & Providers Database
 * Only verified THRVEX providers with real CDN images and correct game IDs
 */

export interface CasinoGame {
  name: string;
  img: string;
  category: string;
  isLive?: boolean;
  isNew?: boolean;
  isHot?: boolean;
  provider: string;
  gameId: string;
}

export interface Provider {
  id: string;
  name: string;
  img: string;
  settingKey: string;
  gameCount?: number;
}

export const categories = [
  { id: "all", label: "All Games", icon: "🎰" },
  { id: "live", label: "Live Casino", icon: "🎥" },
  { id: "card", label: "Card Games", icon: "🃏" },
  { id: "table", label: "Table Games", icon: "🎲" },
  { id: "instant", label: "Instant Win", icon: "⚡" },
  { id: "slots", label: "Slots", icon: "🍒" },
  { id: "crash", label: "Crash", icon: "📈" },
  { id: "fishing", label: "Fishing", icon: "🎣" },
  { id: "arcade", label: "Arcade", icon: "🕹️" },
  { id: "virtual", label: "Virtual", icon: "🖥️" },
];

// THRVEX CDN for game images
const T_MAC88 = "https://thrvex.site/providers/MAC88";
const T_SPRIBE = "https://thrvex.site/providers/spribe";
const T_JILI = "https://thrvex.site/providers/jili";
const T_JDB = "https://thrvex.site/providers/jdb";
const T_CQ9 = "https://thrvex.site/providers/cq9";
const T_PGSOFT = "https://thrvex.site/providers/pgsoft";

// Provider logos from THRVEX CDN
export const providers: Provider[] = [
  { id: "MAC88", name: "MAC88", img: "https://thrvex.site/providers-icon/mac88.png", settingKey: "provider_mac88" },
  { id: "Spribe", name: "Spribe", img: "https://thrvex.site/providers/spribe.svg", settingKey: "provider_spribe" },
  { id: "JILI", name: "JILI", img: "https://thrvex.site/providers/jili.svg", settingKey: "provider_jili" },
  { id: "JDB", name: "JDB", img: "https://thrvex.site/providers/jdb.svg", settingKey: "provider_jdb" },
  { id: "CQ9", name: "CQ9", img: "https://thrvex.site/providers/cq9.svg", settingKey: "provider_cq9" },
  { id: "PGSoft", name: "PG Soft", img: "https://thrvex.site/providers/pgsoft.svg", settingKey: "provider_pgsoft" },
];

// ─── ALL GAMES ────────────────────────────────────────────────────────────
export const ALL_GAMES: CasinoGame[] = [
  // ══════════════════════════════════════════════
  // MAC88 - Indian Live Casino & Instant Games
  // ══════════════════════════════════════════════
  { name: "Dragon Tiger", img: `${T_MAC88}/dragon-tiger.png`, category: "live", isHot: true, provider: "MAC88", gameId: "55520a99e27c2c2a8ca837cda66d59be" },
  { name: "Dragon Tiger 2", img: `${T_MAC88}/dragon-tiger-2.png`, category: "live", provider: "MAC88", gameId: "08f3c36deb5a2dda760f59bf99c0c0e4" },
  { name: "Dragon Tiger Lion", img: `${T_MAC88}/dragon-tiger-lion.png`, category: "live", provider: "MAC88", gameId: "e29b63a8bb6376e3566c826386036baa" },
  { name: "Baccarat", img: `${T_MAC88}/baccarat.png`, category: "live", isHot: true, provider: "MAC88", gameId: "4911bff87b46f952d54f4cc07d51862a" },
  { name: "32 Cards", img: `${T_MAC88}/32-cards.png`, category: "card", provider: "MAC88", gameId: "9970d3ec6f0d6d239f30a7c532a7fc9c" },
  { name: "Andar Bahar", img: `${T_MAC88}/andar-bahar.png`, category: "card", isHot: true, provider: "MAC88", gameId: "c57c0ced1fd67c58daa47d3b6004d6cc" },
  { name: "Sic Bo", img: `${T_MAC88}/sic-bo.png`, category: "table", provider: "MAC88", gameId: "1d2b93b90209e1515db2de44f166ae62" },
  { name: "Roulette", img: `${T_MAC88}/roulette.png`, category: "table", isHot: true, provider: "MAC88", gameId: "e7ce60df355cd1b8926d36f06bb6892c" },
  { name: "Speed Auto Roulette", img: `${T_MAC88}/speed-auto-roulette.png`, category: "table", provider: "MAC88", gameId: "e12a9ed677050df19d5f4bf7018e690a" },
  { name: "Poker 20-20", img: `${T_MAC88}/poker-20-20.png`, category: "card", provider: "MAC88", gameId: "d7f85682fe97073dbbb198cf1f3bd4da" },
  { name: "Lucky 7", img: `${T_MAC88}/lucky-7.png`, category: "instant", isNew: true, provider: "MAC88", gameId: "83926ba32b3cb89e542ab3dae151126a" },
  { name: "Hi Lo", img: `${T_MAC88}/hi-lo.png`, category: "instant", provider: "MAC88", gameId: "deaffd5bc53b9c475e62b545a2b7d943" },
  { name: "Teenpatti Joker 20-20", img: `${T_MAC88}/teenpatti-joker-20-20.png`, category: "card", isHot: true, provider: "MAC88", gameId: "f132dfac909bc7f0e27ae35555136aa2" },
  { name: "Teenpatti One Day", img: `${T_MAC88}/teenpatti-one-day.png`, category: "card", provider: "MAC88", gameId: "b187b5c184a4dbd767da247a3ea0729a" },
  { name: "20 20 Teenpatti 2", img: `${T_MAC88}/20-20-teenpatti-2.png`, category: "card", provider: "MAC88", gameId: "4bc3c56df613b843bf5210754b10e0a1" },
  { name: "3 Cards Judgement", img: `${T_MAC88}/3-cards-judgement.png`, category: "card", provider: "MAC88", gameId: "1b72a33d0f799ac4dc75d01e87c51f6b" },
  { name: "Aviator X", img: `${T_MAC88}/aviator-x.png`, category: "crash", isHot: true, provider: "MAC88", gameId: "dbd35d66eb2c8b5277ab3ec88e92b7cf" },
  { name: "Crash X", img: `${T_MAC88}/crash-x.png`, category: "crash", isNew: true, provider: "MAC88", gameId: "6d437ef774817d3d20f076673a219a5b" },
  { name: "Plinko", img: `${T_MAC88}/plinko.png`, category: "instant", isNew: true, provider: "MAC88", gameId: "3eaa8bf137468144cb2c2e2b6731e82e" },
  { name: "Mines", img: `${T_MAC88}/mines.png`, category: "instant", isHot: true, provider: "MAC88", gameId: "966251e51babbd71cfbc64534a2fce22" },
  { name: "Dice", img: `${T_MAC88}/dice.png`, category: "instant", provider: "MAC88", gameId: "894d1ee7814e5894c2e859dd71d21800" },
  { name: "Color Game", img: `${T_MAC88}/color-game.png`, category: "instant", provider: "MAC88", gameId: "7c47de75096ca247e50d0ee688e36e1e" },
  { name: "Coin Flip", img: `${T_MAC88}/coin-flip.png`, category: "instant", provider: "MAC88", gameId: "97d9e3e53ec193d7e62dd4520bdaeb3c" },
  { name: "Fortune Wheel", img: `${T_MAC88}/fortune-wheel.png`, category: "instant", provider: "MAC88", gameId: "71a0492e34fba4262f2a8e1dc9be817d" },
  { name: "Jhandi Munda", img: `${T_MAC88}/jhandi-munda.png`, category: "table", provider: "MAC88", gameId: "209b915020437af4ffec121a1a2ff1da" },
  { name: "Worli Matka", img: `${T_MAC88}/worli-matka.png`, category: "instant", isHot: true, provider: "MAC88", gameId: "e20fd1d5917c8c79d887a08d0a255374" },
  { name: "WINGO", img: `${T_MAC88}/wingo.png`, category: "instant", provider: "MAC88", gameId: "5e8199c43e3bf2e6317cfb47ab5e8070" },
  { name: "Casino War", img: `${T_MAC88}/casino-war.png`, category: "card", provider: "MAC88", gameId: "542a3cd134328c99cca94106889e140e" },
  { name: "Diamonds", img: `${T_MAC88}/diamonds.png`, category: "instant", provider: "MAC88", gameId: "7f0f95e35760e4d7ea6c8b132a80e618" },
  { name: "Limbo", img: `${T_MAC88}/limbo.png`, category: "crash", provider: "MAC88", gameId: "196e9bdd385e9ffa123c396a6b9571a0" },
  { name: "Rock Paper Scissors", img: `${T_MAC88}/rock-paper-scissors.png`, category: "instant", provider: "MAC88", gameId: "857a7f98340d2aee65a63a60b81c3a60" },
  { name: "AK47 Teenpatti", img: `${T_MAC88}/ak47-teenpatti.png`, category: "card", isNew: true, provider: "MAC88", gameId: "14e1e9fff78a3efce3d110b293db50e7" },
  { name: "Pushpa Rani", img: `${T_MAC88}/pushpa-rani.png`, category: "card", provider: "MAC88", gameId: "345a42c0d84ad44d0f3ba9744f95000b" },
  { name: "Queen Race", img: `${T_MAC88}/queen-race.png`, category: "instant", provider: "MAC88", gameId: "58753d0d9856bbc02a8aa4ca45c280c8" },
  { name: "Race 20", img: `${T_MAC88}/race-20.png`, category: "instant", provider: "MAC88", gameId: "53e9e0eec427f802f51c0b5ff04d4688" },
  { name: "Lankesh", img: `${T_MAC88}/lankesh.png`, category: "card", provider: "MAC88", gameId: "35989c76d9a05bc45d564ebd73b8b098" },
  { name: "MAC Excite Lobby", img: `${T_MAC88}/mac-excite-lobby.png`, category: "live", provider: "MAC88", gameId: "749e6234d718903d8595ba3dcf16cf00" },
  { name: "X Roulette", img: `${T_MAC88}/x-roulette.png`, category: "table", provider: "MAC88", gameId: "90aabfc0872d07d348714e16c86f28ff" },
  { name: "Turbo Auto Roulette", img: `${T_MAC88}/turbo-auto-roulette.png`, category: "table", provider: "MAC88", gameId: "7df6270b1e776f1a60f59366842e7f53" },
  { name: "VR Dragon Tiger", img: `${T_MAC88}/vr-dragon-tiger.png`, category: "virtual", provider: "MAC88", gameId: "060a26b27cdffb1bdb140fb400f811ff" },
  { name: "VR Andar Bahar", img: `${T_MAC88}/vr-andar-bahar.png`, category: "virtual", provider: "MAC88", gameId: "cf2b9056bf9274180256168496bd2b0b" },
  { name: "VR Auto Roulette", img: `${T_MAC88}/vr-auto-roulette.png`, category: "virtual", provider: "MAC88", gameId: "7f689894de729784f2d7a3dc946ab861" },
  { name: "VR Lucky 7", img: `${T_MAC88}/vr-lucky-7.png`, category: "virtual", provider: "MAC88", gameId: "e29b43abfe3937db533ec56354bfa4c3" },
  { name: "VR 20-20 Teenpatti", img: `${T_MAC88}/vr-20-20-teenpatti.png`, category: "virtual", provider: "MAC88", gameId: "f6c74af6d71dbb3924148c68c92c4b88" },
  { name: "VR 32 Cards", img: `${T_MAC88}/vr-32-cards.png`, category: "virtual", provider: "MAC88", gameId: "9489f8da408ac6ee09f0917b264a70fc" },
  { name: "VR Poker", img: `${T_MAC88}/vr-poker.png`, category: "virtual", provider: "MAC88", gameId: "52ee41ddbbb329ac9d6144d345e018fd" },
  { name: "VR High low", img: `${T_MAC88}/vr-high-low.png`, category: "virtual", provider: "MAC88", gameId: "19d57727e61818b68675915e2f78e0e6" },
  { name: "VR Bollywood Casino", img: `${T_MAC88}/vr-bollywood-casino.png`, category: "virtual", provider: "MAC88", gameId: "8d0a4b8d791e2061627b7def7ba63956" },
  { name: "Jet XT", img: `${T_MAC88}/jet-xt.png`, category: "crash", provider: "MAC88", gameId: "6ed76a12fd215a978d9fdf483d1d450d" },
  { name: "Kitex", img: `${T_MAC88}/kitex.png`, category: "crash", provider: "MAC88", gameId: "3c286558bcca2aade3ded558b889f2e4" },
  { name: "Sky fall", img: `${T_MAC88}/sky-fall.png`, category: "crash", provider: "MAC88", gameId: "0a952bf0d6024f2a0ec84b9597c93399" },
  { name: "Twist X", img: `${T_MAC88}/twist-x.png`, category: "crash", provider: "MAC88", gameId: "e11a2739cce3071337aace92d84bcd3e" },
  { name: "Chicken Road Cross", img: `${T_MAC88}/chicken-road-cross.png`, category: "instant", provider: "MAC88", gameId: "98f5d119d84614777c3a371bd8e0df6f" },
  { name: "Amar Akbar Anthony", img: `${T_MAC88}/amar-akbar-anthony.png`, category: "card", provider: "MAC88", gameId: "b2002b98c6c1546fbf7d83bcd6032d62" },
  { name: "K3 Lottery 1", img: `${T_MAC88}/k3-lottery-1.png`, category: "instant", provider: "MAC88", gameId: "59e0125cf12c8dad5d94b6ed6de35282" },
  { name: "5D Lottery 1", img: `${T_MAC88}/5d-lottery-1.png`, category: "instant", provider: "MAC88", gameId: "17b65eb1bb2f86a891d69e580633e0a7" },
  { name: "Trade88 BTCUSD", img: `${T_MAC88}/trade88-btcusd.png`, category: "instant", provider: "MAC88", gameId: "acf41ccab7997c115808c87c6faf6721" },
  { name: "Trade88 GOLD", img: `${T_MAC88}/trade88-gold.png`, category: "instant", provider: "MAC88", gameId: "3fcc6a9348b35092e32afad119e80858" },

  // ══════════════════════════════════════════════
  // Spribe - Crash & Instant Games
  // ══════════════════════════════════════════════
  { name: "Aviator", img: `${T_SPRIBE}/aviator.png`, category: "crash", isHot: true, provider: "Spribe", gameId: "a04d1f3eb8ccec8a4823bdf18e3f0e84" },
  { name: "Balloon", img: `${T_SPRIBE}/balloon.png`, category: "crash", provider: "Spribe", gameId: "de88f202c5a8beeaccabbd944f8acfbf" },
  { name: "Crystal Fall", img: `${T_SPRIBE}/crystal-fall.png`, category: "instant", isNew: true, provider: "Spribe", gameId: "8fa279cd15052eeffa7038df803f8c49" },
  { name: "Dice", img: `${T_SPRIBE}/dice.png`, category: "instant", provider: "Spribe", gameId: "8a87aae7a3624d284306e9c6fe1b3e9c" },
  { name: "Gates of Egypt", img: `${T_SPRIBE}/gates-of-egypt.png`, category: "slots", provider: "Spribe", gameId: "56d299921450cce8c4a07212cc5c64ca" },
  { name: "Goal", img: `${T_SPRIBE}/goal.png`, category: "instant", provider: "Spribe", gameId: "c68a515f0b3b10eec96cf6d33299f4e2" },
  { name: "Hi Lo", img: `${T_SPRIBE}/hi-lo.png`, category: "instant", provider: "Spribe", gameId: "a669c993b0e1f1b7da100fcf95516bdf" },
  { name: "Hotline", img: `${T_SPRIBE}/hotline.png`, category: "instant", provider: "Spribe", gameId: "b31720b3cd65d917a1a96ef61a72b672" },
  { name: "Keno", img: `${T_SPRIBE}/keno.png`, category: "instant", provider: "Spribe", gameId: "c311eb4bbba03b105d150504931f2479" },
  { name: "Keno 80", img: `${T_SPRIBE}/keno-80.png`, category: "instant", isNew: true, provider: "Spribe", gameId: "7a762edbe411ebc9be416870a734bd03" },
  { name: "Mines", img: `${T_SPRIBE}/mines.png`, category: "instant", isHot: true, provider: "Spribe", gameId: "5c4a12fb0a9b296d9b0d5f9e1cd41d65" },
  { name: "Mini Roulette", img: `${T_SPRIBE}/mini-roulette.png`, category: "table", provider: "Spribe", gameId: "9dc7ac6155c5a19c1cc204853e426367" },
  { name: "Neo Vegas", img: `${T_SPRIBE}/neo-vegas.png`, category: "slots", isNew: true, provider: "Spribe", gameId: "0f03d2c034a16431a9a4a2b0009c2203" },
  { name: "Pilot Chicken", img: `${T_SPRIBE}/pilot-chicken.png`, category: "crash", provider: "Spribe", gameId: "ef323466f031cc0d206fd20ca8149f42" },
  { name: "Plinko", img: `${T_SPRIBE}/plinko.png`, category: "instant", isHot: true, provider: "Spribe", gameId: "6ab7a4fe5161936012d6b06143918223" },
  { name: "Trader", img: `${T_SPRIBE}/trader.png`, category: "instant", provider: "Spribe", gameId: "ad5973a7625b5d18257e64340fe22ca1" },

  // ══════════════════════════════════════════════
  // JDB Gaming - Slots, Fishing & Card
  // ══════════════════════════════════════════════
  { name: "Andar Bahar", img: `${T_JDB}/andar-bahar.png`, category: "card", isHot: true, provider: "JDB", gameId: "c35a9edab6fef481c60851d6ea7c6fec" },
  { name: "Aviator Extra Bet", img: `${T_JDB}/aviator-extra-bet.png`, category: "crash", isNew: true, provider: "JDB", gameId: "2cb0f27d6690031bf682bc1703792738" },
  { name: "Banana Saga", img: `${T_JDB}/banana-saga.png`, category: "slots", provider: "JDB", gameId: "77f407b50f00ec4569249b008a5adca0" },
  { name: "Big Three Dragons", img: `${T_JDB}/big-three-dragons.png`, category: "slots", isHot: true, provider: "JDB", gameId: "600c338d3fca2da208f1bba2c9d29059" },
  { name: "Billionaire", img: `${T_JDB}/billionaire.png`, category: "slots", provider: "JDB", gameId: "16b1418fe87a6fa5628eec8cb40da056" },
  { name: "Birds Party", img: `${T_JDB}/birds-party.png`, category: "slots", provider: "JDB", gameId: "7b497c4d19f87c86ea29910c12129edc" },
  { name: "Blossom Of Wealth", img: `${T_JDB}/blossom-of-wealth.png`, category: "slots", provider: "JDB", gameId: "ed6fbaeb7a104dd7ed96fa1683a48669" },
  { name: "Book Of Mystery", img: `${T_JDB}/book-of-mystery.png`, category: "slots", isNew: true, provider: "JDB", gameId: "13072a6eb2111c1b5202fe6155227e94" },
  { name: "Boom Fiesta", img: `${T_JDB}/boom-fiesta.png`, category: "slots", provider: "JDB", gameId: "1ffb31ff605f1a7862a138f5cd712056" },
  { name: "Cai Shen Fishing", img: `${T_JDB}/cai-shen-fishing.png`, category: "fishing", isHot: true, provider: "JDB", gameId: "6df463eabe5fcdaa033e1c89b9ffd162" },
  { name: "Caishen Coming", img: `${T_JDB}/caishen-coming.png`, category: "slots", provider: "JDB", gameId: "45ecec5dd5077785e7a09988b95bbd24" },
  { name: "Chef Panda", img: `${T_JDB}/chef-panda.png`, category: "slots", provider: "JDB", gameId: "078a7876afc6553fd0c0c9d1cbe0b04a" },
  { name: "Classic Mario", img: `${T_JDB}/classic-mario.png`, category: "slots", isHot: true, provider: "JDB", gameId: "627148e0dd36ff12df432fc920a0c59f" },
  { name: "Dragon Tiger", img: `${T_JDB}/dragon-tiger.png`, category: "card", isHot: true, provider: "JDB", gameId: "067d540d7ece7e7dfcfcadf11f25a71d" },
  { name: "Fortune Mouse", img: `${T_JDB}/fortune-mouse.png`, category: "slots", isHot: true, provider: "JDB", gameId: "b8282ffc6ea5a5ab75c826b9c268acba" },
  { name: "Golden Dragon", img: `${T_JDB}/golden-dragon.png`, category: "slots", provider: "JDB", gameId: "735fcdbf9f5e6042132cc01e9860723f" },
  { name: "Lucky Bats", img: `${T_JDB}/lucky-bats.png`, category: "slots", provider: "JDB", gameId: "b8282ffc6ea5a5ab75c826b9c268acba" },
  { name: "Money Tree", img: `${T_JDB}/money-tree.png`, category: "slots", provider: "JDB", gameId: "b8282ffc6ea5a5ab75c826b9c268acba" },
  { name: "Open Sesame", img: `${T_JDB}/open-sesame.png`, category: "slots", isNew: true, provider: "JDB", gameId: "b8282ffc6ea5a5ab75c826b9c268acba" },
  { name: "Treasure Bowl", img: `${T_JDB}/treasure-bowl.png`, category: "slots", provider: "JDB", gameId: "b8282ffc6ea5a5ab75c826b9c268acba" },
  { name: "Triple Monkey", img: `${T_JDB}/triple-monkey.png`, category: "slots", isHot: true, provider: "JDB", gameId: "b8282ffc6ea5a5ab75c826b9c268acba" },

  // ══════════════════════════════════════════════
  // JILI Gaming - Slots, Fishing & Card
  // ══════════════════════════════════════════════
  { name: "Super Ace", img: `${T_JILI}/super-ace.png`, category: "slots", isHot: true, provider: "JILI", gameId: "bdfb23c974a2517198c5443adeea77a8" },
  { name: "Fortune Gems", img: `${T_JILI}/fortune-gems.png`, category: "slots", isHot: true, provider: "JILI", gameId: "a990de177577a2e6a889aaac5f57b429" },
  { name: "Fortune Gems 2", img: `${T_JILI}/fortune-gems-2.png`, category: "slots", isNew: true, provider: "JILI", gameId: "664fba4da609ee82b78820b1f570f4ad" },
  { name: "Fortune Gems 3", img: `${T_JILI}/india-poker-fortune-gems-3.png`, category: "slots", provider: "JILI", gameId: "63927e939636f45e9d6d0b3717b3b1c1" },
  { name: "Boxing King", img: `${T_JILI}/boxing-king.png`, category: "slots", isNew: true, provider: "JILI", gameId: "981f5f9675002fbeaaf24c4128b938d7" },
  { name: "Money Coming", img: `${T_JILI}/money-coming.png`, category: "slots", provider: "JILI", gameId: "db249defce63610fccabfa829a405232" },
  { name: "Crazy777", img: `${T_JILI}/crazy777.png`, category: "slots", isHot: true, provider: "JILI", gameId: "8c62471fd4e28c084a61811a3958f7a1" },
  { name: "Golden Empire", img: `${T_JILI}/golden-empire.png`, category: "slots", isHot: true, provider: "JILI", gameId: "490096198e28f770a3f85adb6ee49e0f" },
  { name: "Charge Buffalo", img: `${T_JILI}/charge-buffalo.png`, category: "slots", provider: "JILI", gameId: "984615c9385c42b3dad0db4a9ef89070" },
  { name: "Jungle King", img: `${T_JILI}/jungle-king.png`, category: "slots", provider: "JILI", gameId: "4db0ec24ff55a685573c888efed47d7f" },
  { name: "Ali Baba", img: `${T_JILI}/ali-baba.png`, category: "slots", provider: "JILI", gameId: "cc686634b4f953754b306317799f1f39" },
  { name: "Lucky Coming", img: `${T_JILI}/lucky-coming.png`, category: "slots", provider: "JILI", gameId: "ba858ec8e3b5e2b4da0d16b3a2330ca7" },
  { name: "All-star Fishing", img: `${T_JILI}/fish-all-star-fishing.png`, category: "fishing", isHot: true, provider: "JILI", gameId: "9ec2a18752f83e45ccedde8dfeb0f6a7" },
  { name: "Mega Fishing", img: `${T_JILI}/fish-mega-fishing.png`, category: "fishing", isNew: true, provider: "JILI", gameId: "caacafe3f64a6279e10a378ede09ff38" },
  { name: "Jackpot Fishing", img: `${T_JILI}/fish-jackpot-fishing.png`, category: "fishing", provider: "JILI", gameId: "3cf4a85cb6dcf4d8836c982c359cd72d" },
  { name: "Happy Fishing", img: `${T_JILI}/fish-happy-fishing.png`, category: "fishing", provider: "JILI", gameId: "71c68a4ddb63bdc8488114a08e603f1c" },
  { name: "Dinosaur Tycoon", img: `${T_JILI}/fish-dinosaur-tycoon.png`, category: "fishing", isHot: true, provider: "JILI", gameId: "eef3e28f0e3e7b72cbca61e7924d00f1" },
  { name: "Super Ace Deluxe", img: `${T_JILI}/super-ace-deluxe.png`, category: "slots", provider: "JILI", gameId: "80aad2a10ae6a95068b50160d6c78897" },
  { name: "Pharaoh Treasure", img: `${T_JILI}/pharaoh-treasure.png`, category: "slots", provider: "JILI", gameId: "c7a69ab382bd1ff0e6eb65b90a793bdd" },
  { name: "Gem Party", img: `${T_JILI}/gem-party.png`, category: "slots", provider: "JILI", gameId: "756cf3c73a323b4bfec8d14864e3fada" },
  { name: "Hot Chilli", img: `${T_JILI}/hot-chilli.png`, category: "slots", provider: "JILI", gameId: "c845960c81d27d7880a636424e53964d" },
  { name: "Dragon Treasure", img: `${T_JILI}/dragon-treasure.png`, category: "slots", provider: "JILI", gameId: "c6955c14f6c28a6c2a0c28274fec7520" },
  { name: "Color Game", img: `${T_JILI}/table-color-game.png`, category: "instant", isHot: true, provider: "JILI", gameId: "2ac4917fbc8b2034307b0c3cdd90d416" },
  { name: "TeenPatti 20-20", img: `${T_JILI}/india-poker-teenpatti-20-20.png`, category: "card", isHot: true, provider: "JILI", gameId: "1afa7db588d05de7b9abca4664542765" },
  { name: "Andar Bahar", img: `${T_JILI}/india-poker-andar-bahar.png`, category: "card", isHot: true, provider: "JILI", gameId: "6f48b3aa0b64c79a2dc320ea021148b5" },
  { name: "Mines", img: `${T_JILI}/crash-mines.png`, category: "instant", provider: "JILI", gameId: "bdfb23c974a2517198c5443adeea77a8" },
  { name: "Plinko", img: `${T_JILI}/crash-plinko.png`, category: "instant", provider: "JILI", gameId: "bdfb23c974a2517198c5443adeea77a8" },

  // ══════════════════════════════════════════════
  // CQ9 - Slots & Table
  // ══════════════════════════════════════════════
  { name: "777", img: `${T_CQ9}/777.png`, category: "slots", isHot: true, provider: "CQ9", gameId: "521c3e444d06b25dc5ed6b6768200d44" },
  { name: "888", img: `${T_CQ9}/888.png`, category: "slots", provider: "CQ9", gameId: "708c6a3de19dd4d7674efea3ef2fe40f" },
  { name: "5 God Beasts", img: `${T_CQ9}/5-god-beasts.png`, category: "slots", isHot: true, provider: "CQ9", gameId: "7148d1ecd2f6787e3d4cfae4580a7b86" },
  { name: "168 Lucky Bag", img: `${T_CQ9}/168-lucky-bag.png`, category: "slots", provider: "CQ9", gameId: "ddc3887d612ebb2442b0391f42ef1cc7" },
  { name: "Apollo", img: `${T_CQ9}/apollo.png`, category: "slots", provider: "CQ9", gameId: "9f6d5cad4677d3aa3feeb7b907d9a93a" },
  { name: "Baseball Fever", img: `${T_CQ9}/baseball-fever.png`, category: "slots", isNew: true, provider: "CQ9", gameId: "1b2895c147b842611771c9815000aaa4" },
  { name: "5 Boxing", img: `${T_CQ9}/5-boxing.png`, category: "slots", provider: "CQ9", gameId: "6075420770ec2fe9c31b48159729299c" },
  { name: "6 Toros", img: `${T_CQ9}/6-toros.png`, category: "slots", provider: "CQ9", gameId: "4b4d1cb0e676f342db428ac898d5a3ac" },
  { name: "888 Cai Shen", img: `${T_CQ9}/888-cai-shen.png`, category: "slots", provider: "CQ9", gameId: "28a39e51864bae9fcebdbc6f738815de" },
  { name: "Acrobatics", img: `${T_CQ9}/acrobatics.png`, category: "slots", provider: "CQ9", gameId: "b8f1a2b30586584ac0f20b9ba426ee60" },
  { name: "All Star Team", img: `${T_CQ9}/all-star-team.png`, category: "slots", isHot: true, provider: "CQ9", gameId: "8677aafb4968ee948c42ef31cbcc6c66" },
  { name: "All Wilds", img: `${T_CQ9}/all-wilds.png`, category: "slots", provider: "CQ9", gameId: "bb5c0ea65687c2ee63980f644045f9e4" },
  { name: "Apsaras", img: `${T_CQ9}/apsaras.png`, category: "slots", provider: "CQ9", gameId: "feb4444198c8146d213f9594325ff7d7" },
  { name: "3 2 1Go!", img: `${T_CQ9}/3-2-1go.png`, category: "slots", isNew: true, provider: "CQ9", gameId: "c002f8b5cd124abe27b50d5e082364f4" },

  // ══════════════════════════════════════════════
  // PG Soft - Slots
  // ══════════════════════════════════════════════
  { name: "Fortune Tiger", img: `${T_PGSOFT}/fortune-tiger.png`, category: "slots", isHot: true, provider: "PGSoft", gameId: "9a8482565ce343ad3ea7fc4bc42cb043" },
  { name: "Mahjong Ways", img: `${T_PGSOFT}/mahjong-ways.png`, category: "slots", isHot: true, provider: "PGSoft", gameId: "1189baca156e1bbbecc3b26651a63565" },
  { name: "Fortune Ox", img: `${T_PGSOFT}/fortune-ox.png`, category: "slots", isNew: true, provider: "PGSoft", gameId: "8db4eb6d781f915eebab2a26133db0e9" },
  { name: "Mahjong Ways 2", img: `${T_PGSOFT}/mahjong-ways-2.png`, category: "slots", isHot: true, provider: "PGSoft", gameId: "ba2adf72179e1ead9e3dae8f0a7d4c07" },
  { name: "Lucky Neko", img: `${T_PGSOFT}/lucky-neko.png`, category: "slots", provider: "PGSoft", gameId: "e1b4c6b95746d519228744771f15fe4b" },
  { name: "Treasures of Aztec", img: `${T_PGSOFT}/treasures-of-aztec.png`, category: "slots", provider: "PGSoft", gameId: "2fa9a84d096d6ff0bab53f81b79876c8" },
  { name: "Wild Bandito", img: `${T_PGSOFT}/wild-bandito.png`, category: "slots", isNew: true, provider: "PGSoft", gameId: "95fc290bb05c07b5aad1a054eba4dcc4" },
  { name: "Ganesha Gold", img: `${T_PGSOFT}/ganesha-gold.png`, category: "slots", isHot: true, provider: "PGSoft", gameId: "8dcea650a5a4d96530a77e6df8f61923" },
  { name: "Caishen Wins", img: `${T_PGSOFT}/caishen-wins.png`, category: "slots", provider: "PGSoft", gameId: "82a810ba99a5fb3e23fc514afebd6314" },
  { name: "Double Fortune", img: `${T_PGSOFT}/double-fortune.png`, category: "slots", provider: "PGSoft", gameId: "3810e528e0abb8ce1cd7ddc2ece005c0" },
  { name: "Fortune Rabbit", img: `${T_PGSOFT}/fortune-rabbit.png`, category: "slots", isNew: true, provider: "PGSoft", gameId: "e175cdd3215a02f5539cc8354a149b75" },
  { name: "Ganesha Fortune", img: `${T_PGSOFT}/ganesha-fortune.png`, category: "slots", provider: "PGSoft", gameId: "c4b57c6dcfac5c8a31b9174523103c8c" },
  { name: "Fortune Mouse", img: `${T_PGSOFT}/fortune-mouse.png`, category: "slots", provider: "PGSoft", gameId: "8e5a4dd7da06fb68165d13f8bcd06328" },
  { name: "Dragon Hatch", img: `${T_PGSOFT}/dragon-hatch.png`, category: "slots", provider: "PGSoft", gameId: "4afef91d3addb9ce5107abaf3342b9a5" },
  { name: "Butterfly Blossom", img: `${T_PGSOFT}/butterfly-blossom.png`, category: "slots", provider: "PGSoft", gameId: "116989bb267a72035bd01818c5496126" },
];
