// ─── CDN環境用 (import不要・React/ReactDOMはindex.htmlで読み込み済み) ──────
const { useState, useEffect, useCallback, useRef } = React;

// ─── window.storage polyfill (Claude.ai環境外ではlocalStorageを使用) ──────────
if (!window.storage) {
  window.storage = {
    get: (key) => Promise.resolve(
      localStorage.getItem(key) ? { key, value: localStorage.getItem(key) } : null
    ),
    set: (key, value) => {
      localStorage.setItem(key, value);
      return Promise.resolve({ key, value });
    },
    delete: (key) => { localStorage.removeItem(key); return Promise.resolve({ key, deleted: true }); },
    list: (prefix="") => {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
      return Promise.resolve({ keys });
    },
  };
}


// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  bg:"#0e0c07", surface:"#1c1609", surface2:"#241b0c",
  gold:"#C8A84B", gold2:"#e6c96a", sand:"#d4b483", sand2:"#f0dfc0",
  text:"#e8d8b8", muted:"#9a8060", border:"rgba(200,168,75,0.22)", red:"#8B3A1A",
};
const FH = "'Cinzel','Palatino Linotype',serif";
const FB = "'Georgia','Times New Roman',serif";

const STARS = Array.from({length:55},(_,i)=>({
  id:i, left:(i*137.508)%100, top:(i*97.3)%68,
  size:0.4+(i%5)*0.35, dur:2.5+(i%8)*0.5, del:(i%10)*0.5,
}));

const CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{background:#0e0c07;color:#e8d8b8;min-height:100vh;overflow-x:hidden;}
  ::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:#0e0c07;}::-webkit-scrollbar-thumb{background:#C8A84B;border-radius:3px;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
  @keyframes twinkle{0%,100%{opacity:0.1;}50%{opacity:0.75;}}
  @keyframes drift{from{transform:translateX(0);}to{transform:translateX(-50%);}}
  @keyframes glow{0%,100%{box-shadow:0 0 6px rgba(200,168,75,0.15);}50%{box-shadow:0 0 22px rgba(200,168,75,0.45);}}
  @keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
`;

const REVIEW_KEY = "egypt-quiz-review-v1";

// ─── Data ─────────────────────────────────────────────────────────────────────
const DATA = {
  ja: {
    appName:"Sands of Time", appSub:"砂に刻まれた時の記憶", langToggle:"EN",
    nav:{home:"ホーム",themes:"テーマ",timeline:"年表",quiz:"クイズ",archive:"アーカイブ",review:"復習"},
    hero:{title:"ファラオの世界へ",sub:"古王国からプトレマイオス朝まで、3000年の歴史を探索せよ",cta:"学習を始める"},
    back:"← 戻る",
    themes:{
      title:"テーマ別に学ぶ",
      flipHint:"カードをタップ・クリックすると詳細が表示されます",
      items:[
        {id:"architecture",icon:"△",label:"建築・ピラミッド",desc:"ギザの三大ピラミッドから神殿建築の変遷まで",
         cards:[
           {title:"マスタバと階段ピラミッド",body:"古王国初期のマスタバ（矩形墓）を発展させ、建築家イムホテプがサッカラに6層の階段ピラミッドを完成（BC2650年頃）。石積み大建造物の世界的な始まりとされる。"},
           {title:"ギザの三大ピラミッド",body:"クフ・カフラー・メンカウラー王の三大ピラミッド（BC2589〜2504年頃）。クフ王ピラミッドは高さ約146m、230万個超の石灰岩ブロックで構成。古代七不思議で唯一現存する建造物。"},
           {title:"スフィンクス",body:"カフラー王のピラミッド群に隣接する全長約73mの石灰岩像。ファラオの顔と獅子の体を持ち、王の神性と力を象徴する。年代・制作者については現在も研究が続いている。"},
           {title:"カルナック神殿",body:"新王国時代（BC1550年〜）に2000年以上かけて増築されたカルナック神殿は現存最大の宗教建築群。大柱廊室の134本の巨柱は圧倒的で、ルクソール神殿とはスフィンクス参道で結ばれる。"},
           {title:"アブ・シンベル神殿",body:"ラメセス2世（BC1279〜1213年）がヌビアに彫った岩窟神殿。高さ20m超の坐像が4体並ぶ正面が有名。1960年代にユネスコ主導の国際救済キャンペーンで現在地へ移設された。"},
         ]},
        {id:"pharaoh",icon:"♛",label:"王朝・ファラオ",desc:"古王国からクレオパトラまでの王統の系譜",
         cards:[
           {title:"ファラオとは",body:"「ファラオ」は古代エジプト語「ペル・アア（大きな家）」が語源。ラーの息子・神の代理人として、ナイルの管理から神殿儀式まで担った神聖な王。死後はオシリスと同一視された。"},
           {title:"クフ王",body:"第4王朝クフ王（BC2589〜2566年頃）はギザに史上最大のピラミッドを建設。現存する記録は少なく、唯一の肖像とされる象牙製坐像は高さわずか7.5cm。建設者は奴隷ではなく組織化された労働者と現在は考えられている。"},
           {title:"ハトシェプスト",body:"第18王朝の女性ファラオ（BC1473〜1458年頃）。男性の王装束をまとい20年以上統治。デイル・エル＝バハリの葬祭殿やプント国への交易遠征で名高い。後継者トトメス3世によって多くの記念碑から名前が削除された。"},
           {title:"アクエンアテンとアマルナ改革",body:"第18王朝アクエンアテン（BC1353〜1336年頃）は太陽円盤アテン神への崇拝を強く推進し、新都アマルナを建設。独自の芸術様式も生まれたが、死後まもなく改革は撤回され都も放棄された。"},
           {title:"ラメセス2世・大王",body:"66年以上にわたって統治した（BC1279〜1213年）エジプト史上最も有名なファラオの一人。カデシュの戦い後に現存最古の平和条約を締結。アブ・シンベルをはじめ多数の神殿と自像を全土に残した。"},
           {title:"クレオパトラ7世",body:"プトレマイオス朝最後の君主（BC51〜30年）。エジプト語を話せた同朝唯一の支配者とされる。複数の言語と哲学・天文学・数学に長けた知性派。カエサル・アントニウスとの政治的関係でも知られ、BC30年にローマに敗れ自ら命を絶った。"},
         ]},
        {id:"religion",icon:"☥",label:"神話・宗教",desc:"ラー、オシリス、イシス――神々の世界",
         cards:[
           {title:"エジプト多神教",body:"2000以上の神々が共存する豊かな多神教体系。動物・人間・その混合形で表され、自然現象や社会機能を司った。地域ごとに主神が異なり、統一後も各地の神話が融合・併存するのがエジプト宗教の特徴。"},
           {title:"ラー：太陽神",body:"最高神の一柱で、鷹頭の人間として表される。昼は太陽の舟で天空を渡り、夜は地下世界（ドゥアト）を旅する。古王国のファラオは「ラーの息子」を称号に含め太陽神との直系を主張した。"},
           {title:"オシリスとイシス",body:"豊穣神オシリスは弟セトに殺されバラバラにされたが、妻イシスが遺体を集めてミイラ化し復活させた。このオシリス神話が来世信仰の基盤となり、死者はオシリスと同一視されて審判を受けるとされた。"},
           {title:"アヌビスと心臓の審判",body:"ジャッカル頭のアヌビスはミイラ制作とネクロポリスの守護神。死者の審判では心臓と真理の女神マアトの羽根を天秤にかけ、心臓が軽ければ楽園「ヤルの野」への入場が許されるとされた。"},
           {title:"ホルスとセト",body:"鷹頭のホルス（王権の守護神）は混沌・砂漠の神セトとエジプトの支配権を争い最終的に勝利。この神話はファラオの統治正当性を示す物語として機能した。ファラオはホルスの地上における化身とされた。"},
         ]},
        {id:"writing",icon:"✦",label:"文字・知識",desc:"ヒエログリフとロゼッタストーンの秘密",
         cards:[
           {title:"ヒエログリフとは",body:"「神聖文字」を意味するギリシャ語が語源。BC3200年頃に発生した表意文字・表音文字・限定符からなる複合文字体系。神殿の壁・柱・パピルスなど様々な媒体に用いられ、BC4世紀頃まで使用された。"},
           {title:"ロゼッタストーン",body:"1799年ナポレオン遠征隊がロゼッタで発見。BC196年プトレマイオス5世の勅令がヒエログリフ・デモティック・ギリシャ語の3言語で刻まれており、1822年シャンポリオンによる解読の鍵となった。"},
           {title:"ヒエラティックとデモティック",body:"ヒエログリフは神聖な正式文字だが、日常記録には草書体「ヒエラティック（神官文字）」が使われ、後期にはさらに簡略化した「デモティック（民衆文字）」が商取引・法律文書に広まった。"},
           {title:"書記という職業",body:"書記（セシュ）は10年以上の訓練を要する高地位専門職。農民や職人より豊かな生活が保証され、その地位の高さから書記の像は必ずパピルスを膝に広げた坐像スタイルで制作された。"},
         ]},
        {id:"burial",icon:"◈",label:"埋葬・来世",desc:"ミイラ、王家の谷、死者の書",
         cards:[
           {title:"ミイラ制作の技術",body:"70日間の精密工程。臓器を取り出し（肺・胃・腸・肝臓はカノポス壺に保存、心臓のみ体内に残す）、乾燥剤ナトロンで40日間乾燥後、香料・樹脂・リネン包帯で仕上げる。3000年以上保存されたミイラが多数現存する。"},
           {title:"死者の書",body:"「昼に出ることについての書」が語源。死者が来世を安全に旅するための呪文集（200以上）で、BC1550年頃から棺と共にパピルスに記されて埋葬された。最重要の第125章は心臓の審判の場面を描く。"},
           {title:"王家の谷",body:"新王国時代（BC1550〜1070年）のファラオが選んだルクソール西岸の岩盤墓穴群。60以上の墓が確認されている。1922年ハワード・カーターが発見したツタンカーメン墓（KV62）はほぼ手つかずで残されていた稀有な例。"},
           {title:"カーとバー：魂の概念",body:"「カー」は生命力・分身で墓に残り供物を受ける。「バー」は人面鳥の姿で死後も自由に飛び回る魂。「アク」は変容を遂げた完全な霊体。これら全てが機能するために精巧な埋葬儀式が必要とされた。"},
         ]},
        {id:"military",icon:"⚔",label:"軍事・外交",desc:"ラメセス2世とヒッタイト帝国との激突",
         cards:[
           {title:"エジプト軍の変遷",body:"古王国は農業閑散期に農民を徴兵する体制だったが、新王国時代に常備軍制度が確立。ヌビア人・シリア人の外国人傭兵も多数採用された。BC1600年頃の戦車部隊導入が機動力を大幅に向上させた。"},
           {title:"ヒクソスとの戦争",body:"BC1650年頃、馬と戦車を持つヒクソス人がエジプト北部を征服。約100年の支配の後、テーベのカモセ王とアフモーゼ1世が撃退し新王国時代を開いた。この経験がエジプト軍に戦車戦術と青銅器兵器をもたらした。"},
           {title:"カデシュの戦いと現存最古の平和条約",body:"BC1274年、ラメセス2世がヒッタイト王ムワタリ2世と激突。決定的な決着はつかなかったが、その後BC1259年頃に現存する最古の平和条約「カデシュ条約」が締結された。"},
           {title:"アレキサンドロスの征服",body:"BC332年、マケドニアのアレキサンドロス大王がエジプトを征服。エジプトの神々を尊重し、ファラオの称号を受けた。地中海沿岸に「アレキサンドリア」を建設し、後のヘレニズム文化の拠点となった。"},
         ]},
      ],
    },
    timeline:{
      title:"王朝の流れ", sub:"クリック・タップで詳細を表示",
      periods:[
        {id:"predynastic",label:"先王朝時代",bc:"5000-3100",bcLabel:"5000–3100 BC",color:"#5C4A1A",pharaohs:["ナカダ文化"],fact:"ナイル川流域に農耕文化が発展。上下エジプトが独立した王国として形成され、土器・石器の技術が高度化。後の文明の基盤が築かれた時代。"},
        {id:"early",label:"初期王朝",bc:"3100-2686",bcLabel:"3100–2686 BC",color:"#7A5C10",pharaohs:["ナルメル","デン","カセケムウィ"],fact:"ナルメル（メネス）がエジプトを統一し最初の王朝を開いた。メンフィスが首都となり、ヒエログリフの初期形態と宗教儀礼が確立した。"},
        {id:"old",label:"古王国",bc:"2686-2181",bcLabel:"2686–2181 BC",color:"#C8A84B",pharaohs:["ジョセル","スネフェル","クフ","カフラー","メンカウラー"],fact:"「ピラミッドの時代」。強大な中央集権国家が成立し、ギザの大ピラミッドなど巨大建造物が次々建設。ファラオの神格化が頂点に達した。"},
        {id:"first_int",label:"第1中間期",bc:"2181-2055",bcLabel:"2181–2055 BC",color:"#5A4020",pharaohs:["地方豪族の分裂統治"],fact:"中央集権が崩壊し地方豪族による分裂統治。干ばつや飢饉が社会不安を引き起こしたとも言われる。複数の王朝が並立した混乱期。"},
        {id:"middle",label:"中王国",bc:"2055-1650",bcLabel:"2055–1650 BC",color:"#A07840",pharaohs:["メンチュヘテプ2世","アメンエムハト1世","センウセレト3世"],fact:"テーベのメンチュヘテプ2世が再統一。「中エジプト語」の古典文学が生まれ、文学・芸術が黄金期を迎えた。ヌビアへの遠征も活発だった。"},
        {id:"second_int",label:"第2中間期",bc:"1650-1550",bcLabel:"1650–1550 BC",color:"#4A3818",pharaohs:["ヒクソス王朝","カモセ"],fact:"西アジアからのヒクソス人がエジプト北部を支配。馬・戦車・青銅器をもたらした。テーベの王朝が抵抗を続け、最終的にヒクソスを撃退した。"},
        {id:"new",label:"新王国",bc:"1550-1070",bcLabel:"1550–1070 BC",color:"#D4B060",pharaohs:["アフモーゼ1世","ハトシェプスト","トトメス3世","アクエンアテン","ツタンカーメン","ラメセス2世"],fact:"エジプト史の絶頂期。シリア・ヌビアまで領土を拡大。カルナック神殿の増築、アマルナ改革、カデシュ条約など歴史的事件が集中した。"},
        {id:"third_int",label:"第3中間期",bc:"1070-664",bcLabel:"1070–664 BC",color:"#6A5030",pharaohs:["タニス王朝","リビア系王朝","クシュ王朝"],fact:"中央集権の弱体化とリビア人・ヌビア人・アッシリア人などの台頭。複数の王朝が並立した複雑な政治状況が続いた。"},
        {id:"late",label:"末期王朝",bc:"664-332",bcLabel:"664–332 BC",color:"#9E7A38",pharaohs:["プサメティコス1世","ネコ2世","アマシス2世"],fact:"アッシリアを退けてサイス朝が復活するもペルシャに征服。ギリシャとの交流が盛んになり、ヘレニズムの影響が入り始めた時代。"},
        {id:"ptolemaic",label:"プトレマイオス朝",bc:"305-30",bcLabel:"305–30 BC",color:"#6E5828",pharaohs:["プトレマイオス1世","クレオパトラ3世","クレオパトラ7世"],fact:"アレキサンドロス大王の部将プトレマイオスが建てたギリシャ系王朝。アレキサンドリアは地中海世界の学術・文化の中心地に。クレオパトラ7世の死でローマに併合された。"},
      ],
    },
    quiz:{
      title:"クイズに挑戦", sub:"AIが生成する古代エジプト史クイズ",
      diffLabel:"難易度", topicLabel:"トピック", typeLabel:"形式",
      genBtn:"クイズ生成", nextBtn:"次の問題", judgeBtn:"答え合わせ",
      correct:"正解！", wrong:"不正解", corrAns:"正解:", expl:"解説:",
      partialMatch:"部分一致でも正解とします",
      scoreLabel:"スコア", loading:"生成中...",
      errMsg:"問題の生成に失敗しました。もう一度お試しください。",
      diffs:["初級","中級","上級"],
      topics:["全体","建築","ファラオ","神話","文字","埋葬","軍事","博物館","ピラミッド"],
      types:["4択問題","穴埋め問題"],
      sys:`あなたは古代エジプト史の専門家です。以下の条件でクイズを1問だけJSON形式で出力してください。前置き・説明・コードブロックは不要です。JSONのみ出力してください。

4択問題の場合:
{"type":"multiple","question":"問題文","choices":["選択肢A","選択肢B","選択肢C","選択肢D"],"answer":"正解（choicesの文字列と完全一致）","explanation":"80〜120字の解説"}

穴埋め問題の場合:
{"type":"fill","question":"___に入る語句は何ですか？という形式の問題文","answer":"答え（10字以内のキーワード）","hint":"ヒント（20字以内）","explanation":"80〜120字の解説"}`,
    },
    archive:{
      title:"アーカイブ", sub:"古代エジプトの記録",
      cats:["ファラオ","神々","遺跡","秘宝","博物館","ピラミッド"],
      pharaohs:[
        {id:"khufu",name:"クフ王",sub:"在位 BC2589–2566 / 第4王朝",icon:"♛",body:"ギザの大ピラミッドを建設したファラオ。現存する唯一の肖像は小さな象牙の坐像（高さ7.5cm）のみ。建設には約2万人の組織化された労働者が20年以上従事したとされる。"},
        {id:"hatshepsut",name:"ハトシェプスト",sub:"在位 BC1473–1458 / 第18王朝",icon:"♚",body:"エジプト史上最も成功した女性ファラオの一人。男装してファラオとして20年以上統治。デイル・エル＝バハリの葬祭殿建設とプント国への交易遠征で名高い。死後、後継者トトメス3世に記念碑から名前を削られた。"},
        {id:"akhenaten",name:"アクエンアテン",sub:"在位 BC1353–1336 / 第18王朝",icon:"☀",body:"太陽円盤アテン神崇拝を強力に推進したファラオ。アマルナ芸術という独自様式を生み、新都アマルナを建設。死後改革はまもなく撤回され、名前は多くの記念碑から削除された。"},
        {id:"tutankhamun",name:"ツタンカーメン",sub:"在位 BC1332–1323 / 第18王朝",icon:"◈",body:"幼くして即位し約10年で亡くなった少年王。1922年のハワード・カーターによる墓（KV62）発見は20世紀最大の考古学的発見の一つ。黄金マスクに象徴される豊かな副葬品がほぼ完全に残されていた。"},
        {id:"ramesses2",name:"ラメセス2世",sub:"在位 BC1279–1213 / 第19王朝",icon:"⚔",body:"66年以上統治したエジプト最長在位クラスのファラオ。現存最古の平和条約（カデシュ条約）締結、アブ・シンベル神殿・ラムセウムなど多数の記念建造物を残した大王。"},
        {id:"cleopatra",name:"クレオパトラ7世",sub:"在位 BC51–30 / プトレマイオス朝",icon:"✦",body:"プトレマイオス朝最後の君主。エジプト語を話せた同朝唯一の支配者とされる。複数の言語に精通し哲学・数学・天文学にも長けた知性派。カエサル・アントニウスとの政治的関係でも知られ、BC30年に自ら命を絶った。"},
      ],
      gods:[
        {id:"ra",name:"ラー",sub:"太陽神・最高神",icon:"☀",body:"エジプト最高神の一柱。鷹の頭を持つ人間の姿で表される。昼間は太陽の舟で天空を渡り、夜は地下世界（ドゥアト）を旅して朝に再び誕生するという太陽の循環を象徴。古王国期にファラオはラーの息子を称号とした。"},
        {id:"osiris",name:"オシリス",sub:"来世・豊穣・死の神",icon:"◎",body:"弟セトに殺されて復活した再生の神。緑の肌に白い包帯を巻き、王冠と王笏を持つ姿で表される。すべての死者の王として来世の審判を司り、死後の復活と永遠の命を象徴する重要な神格。"},
        {id:"isis",name:"イシス",sub:"魔法・母性・癒しの女神",icon:"✧",body:"オシリスの妻でホルスの母。鷹の翼を広げた姿、または頭上に玉座の象形文字を載せた姿で表される。魔法と医術に長け、死者の復活に関わる最重要女神。その信仰はローマ帝国全土にまで広まった。"},
        {id:"anubis",name:"アヌビス",sub:"死者・ミイラ制作の神",icon:"◆",body:"ジャッカルの頭を持つ死者の神。ミイラ制作の守護神であり、死者の審判で心臓の重さを量る「真理の秤」の儀式を司る。ネクロポリス（墓地）の守護者として広く崇拝された。"},
        {id:"horus",name:"ホルス",sub:"王権・空の神",icon:"△",body:"鷹または鷹頭の人間として表される王権の守護神。オシリスとイシスの息子で、叔父セトとの争いに勝利しエジプトの支配権を獲得した。ファラオはホルスの化身とされ、即位時にホルス名を冠した。"},
        {id:"thoth",name:"トト",sub:"知恵・文字・月の神",icon:"✦",body:"トキの頭または月を載せたヒヒの姿で表される知恵の神。ヒエログリフの発明者とされ、死者の審判の場で書記として記録を司る。医学・数学・天文学の守護神でもあり、ギリシャのヘルメスと同一視された。"},
        {id:"set",name:"セト",sub:"混沌・砂漠・嵐の神",icon:"◇",body:"独特の複合動物の頭を持つ混沌と砂漠の神。オシリスを殺害した悪神として描かれる一方、太陽の舟を守る守護者でもある二面的な神格。戦争・嵐・異国の象徴として複雑な崇拝を受けた。"},
        {id:"hathor",name:"ハトホル",sub:"愛・美・音楽の女神",icon:"♥",body:"雌牛の頭または頭上に牛の角と太陽円盤を持つ姿で表される愛と美の女神。女性・喜び・音楽・踊り・豊穣を司り、死者の来世の旅も支援する。ギリシャのアフロディーテと同一視された。"},
      ],
      sites:[
        {id:"giza",name:"ギザのピラミッド群",sub:"古王国 BC2589年頃 / カイロ郊外",icon:"△",body:"クフ・カフラー・メンカウラーの三大ピラミッドとスフィンクスからなる、古代世界七不思議で唯一現存する建造物。カイロ中心部から約13km。現在も発掘が続けられ、新たな発見が報告されている。"},
        {id:"karnak",name:"カルナック神殿",sub:"新王国 BC2055年〜 / ルクソール",icon:"☥",body:"現存最大の宗教建築群。アメン神を祀る主神殿を中心に2000年以上かけて増築が続けられた。大柱廊室の134本の円柱（最大高さ約23m）は圧巻。世界最大規模の宗教建築の一つ。"},
        {id:"valley",name:"王家の谷",sub:"新王国 BC1550年〜 / ルクソール西岸",icon:"◈",body:"新王国時代のファラオたちが選んだルクソール西岸の岩盤墓穴群。60以上の墓が確認されており、ツタンカーメン墓（KV62）が最も有名。現在も発掘調査が進行中の考古学の宝庫。"},
        {id:"abu_simbel",name:"アブ・シンベル神殿",sub:"新王国 BC1264年頃 / アスワン南方",icon:"♛",body:"ラメセス2世がヌビアに建設した岩窟神殿。年2回（2月22日・10月22日頃）、ラメセス坐像の顔に朝日が当たる天文学的設計で知られる。1960年代にユネスコの国際協力で現在地へ移設された。"},
        {id:"alexandria",name:"アレキサンドリア",sub:"プトレマイオス朝 BC331年〜 / 地中海沿岸",icon:"✦",body:"アレキサンドロス大王が建設した港湾都市。古代世界最高の学術機関ムセイオン（図書館・研究所）が置かれ、エラトステネス・ユークリッドらが活躍。現代もエジプト第2の都市として栄える。"},
        {id:"saqqara",name:"サッカラ階段ピラミッド",sub:"古王国 BC2650年頃 / メンフィス郊外",icon:"◎",body:"世界最古の大型石造建造物。第3王朝ジョセル王のために建築家イムホテプが設計した6層の階段ピラミッド（高さ約60m）。2020年にも新たな埋葬室群が発見されるなど現在も発掘が続く。"},
      ],
      treasures:[
        {id:"goldmask",name:"ツタンカーメンの黄金マスク",sub:"BC1323年頃 / カイロ・エジプト博物館",icon:"◈",body:"1922年発見のツタンカーメン棺を覆う純金製マスク。重さ約11kg、ラピスラズリ・カーネリアン・トルコ石などの宝石で装飾。古代エジプト美術の最高傑作と称される。現在はカイロ博物館に展示。"},
        {id:"rosetta",name:"ロゼッタストーン",sub:"BC196年 / 大英博物館所蔵",icon:"✦",body:"ヒエログリフ・デモティック・ギリシャ語の3言語で刻まれた石碑。1799年ナポレオン遠征隊が発見し、1822年シャンポリオンによる解読の鍵となった。現在は大英博物館の最重要展示品の一つ。"},
        {id:"nefertiti",name:"ネフェルティティの胸像",sub:"BC1345年頃 / ベルリン新博物館",icon:"♚",body:"アクエンアテン王妃の彩色石灰岩胸像。1912年ドイツ隊がアマルナで発見。その洗練された美しさから「古代エジプト美の象徴」と称される。エジプトとドイツの間で返還交渉が続いている。"},
        {id:"canopic",name:"カノポス壺セット",sub:"新王国時代 / 各地博物館",icon:"◆",body:"ミイラ制作時に取り出した内臓を保存する4つの壺。人頭のイムセティ（肝臓）・猿頭のハピ（肺）・犬頭のドゥアムテフ（胃）・鷹頭のケベフセヌフ（腸）がそれぞれ守護する。"},
        {id:"bookdead",name:"アニのパピルス（死者の書）",sub:"BC1250年頃 / 大英博物館",icon:"✧",body:"書記アニのために作られた死者の書の最高傑作の一つ。精緻な挿絵と78ページにわたる呪文群が記されたパピルス。心臓の審判の場面など古代エジプトの来世観を視覚的に伝える。"},
        {id:"palette",name:"ナルメルのパレット",sub:"BC3000年頃 / カイロ・エジプト博物館",icon:"△",body:"エジプト統一を記念した儀礼用化粧板（長さ63cm）。一面に下エジプトを征服するナルメル王、反対面に勝利の行進が浮彫りで刻まれる。エジプト美術最古の傑作の一つ。"},
      ],
      museums:[
        {id:"cairo",name:"カイロ・エジプト博物館",sub:"カイロ、タハリール広場",icon:"◎",body:"1902年開館。世界最大規模のエジプト古代コレクション。ツタンカーメンの黄金マスクをはじめ15万点以上の収蔵品を誇る。現在はグランド・エジプシャン・ミュージアム（GEM）への移管が進行中。"},
        {id:"gem",name:"グランド・エジプシャン・ミュージアム",sub:"ギザ、ピラミッド近郊",icon:"△",body:"2023年部分開館した世界最大規模の考古学博物館。延床面積約9万㎡、収蔵品10万点以上。ツタンカーメン関連遺物の完全展示が目玉。ギザのピラミッドを望む立地に建設された。"},
        {id:"british",name:"大英博物館（エジプトコレクション）",sub:"ロンドン、イギリス",icon:"✦",body:"ロゼッタストーン・アニのパピルス・アメンホテプ3世の頭部像など世界屈指のエジプトコレクション。100室以上にわたる展示はエジプト学の研究拠点でもある。常設展は入館無料。"},
        {id:"louvre",name:"ルーブル美術館（エジプト部門）",sub:"パリ、フランス",icon:"◈",body:"5万点以上のエジプト古代遺物コレクション。シャンポリオンが初代キュレーターを務めた歴史ある部門。古王国から末期王朝まで網羅した展示が充実している。"},
        {id:"metropolitan",name:"メトロポリタン美術館（エジプト部門）",sub:"ニューヨーク、アメリカ",icon:"✧",body:"ヌビアから移設されたデンドゥール神殿の展示が圧巻。26000点以上の収蔵品でアメリカ最大のエジプトコレクション。100年以上にわたる発掘調査の成果が展示されている。"},
        {id:"berlin",name:"ベルリン新博物館",sub:"ベルリン、ドイツ",icon:"♚",body:"ネフェルティティの胸像を所蔵することで世界的に有名。ドイツ発掘隊がアマルナで収集したコレクションが充実。ユネスコ世界遺産のムゼウムスインゼル（博物館島）内に位置する。"},
      ],
      pyramids:[
        {id:"khufu_pyr",name:"クフ王のピラミッド（大ピラミッド）",sub:"BC2589〜2566年頃 / ギザ",icon:"△",body:"高さ約146m（現在は138.5m）、底辺約230m。230万個以上の石灰岩ブロック（平均2.5t）で構成。内部には王の間・王妃の間・大回廊などが存在。建設方法については現在も研究が続く。"},
        {id:"khafre_pyr",name:"カフラー王のピラミッド",sub:"BC2558〜2532年頃 / ギザ",icon:"△",body:"高さ約136m。頂上付近に当時の白石灰岩の外装が残る。隣接するスフィンクスはカフラー王の顔を持つとする説が有力。ピラミッド複合体の中で最も保存状態が良いとされる神殿群を持つ。"},
        {id:"menkaure_pyr",name:"メンカウラー王のピラミッド",sub:"BC2532〜2504年頃 / ギザ",icon:"△",body:"高さ約65m（三大ピラミッド中最小）。下部に赤花崗岩の外装が残る。内部から3体の精巧なトライアド像（ファラオ・ハトホル・地方神の三者像）が発見された。現在はカイロ博物館に収蔵。"},
        {id:"djoser_pyr",name:"ジョセル王の階段ピラミッド",sub:"BC2650年頃 / サッカラ",icon:"◎",body:"世界最古の大型石造建造物（高さ約60m、6層）。建築家イムホテプの設計によるマスタバを積み重ねた革命的構造。ユネスコ世界遺産「メンフィスとその墓地遺跡」の一部。"},
        {id:"bent",name:"屈折ピラミッド",sub:"BC2600年頃 / ダハシュール",icon:"◇",body:"スネフェル王が建設。建設途中で傾斜角が変更されたため上部と下部で角度が異なる（54°→43°）。構造上の問題から設計変更した説が有力。外装の石灰岩が多く残る珍しいピラミッド。"},
        {id:"red",name:"赤のピラミッド",sub:"BC2590年頃 / ダハシュール",icon:"◆",body:"スネフェル王がダハシュールに建設した世界初の真正ピラミッド（正四角錐形）。高さ約105m。赤みがかった石灰岩から命名。内部は比較的容易に見学できることで知られる。"},
      ],
    },
  },
};

// English — reuse ja structure, override text
DATA.en = {
  appName:"Sands of Time", appSub:"Echoes of Ancient Egypt", langToggle:"日本語",
  nav:{home:"Home",themes:"Themes",timeline:"Timeline",quiz:"Quiz",archive:"Archive",review:"Review"},
  hero:{title:"Enter the World of the Pharaohs",sub:"3,000 years from the Old Kingdom to the Ptolemaic Dynasty",cta:"Begin Your Journey"},
  back:"← Back",
  themes:{
    title:"Learn by Theme",
    flipHint:"Tap or click a card to reveal details",
    items:[
      {id:"architecture",icon:"△",label:"Architecture",desc:"From the Great Pyramids to temple complexes across millennia",
       cards:[
         {title:"Mastaba to Step Pyramid",body:"Early Old Kingdom tombs were rectangular mastabas. Architect Imhotep stacked six mastabas to create the Step Pyramid at Saqqara (~2650 BC), the world's first large-scale stone structure."},
         {title:"The Great Pyramids of Giza",body:"Built for Khufu, Khafre, and Menkaure (~2589–2504 BC). Khufu's pyramid originally stood 146m tall, built from 2.3 million+ limestone blocks. The only surviving wonder of the ancient world."},
         {title:"The Sphinx",body:"A ~73-meter limestone statue adjacent to Khafre's complex, combining a pharaoh's face with a lion's body. Its exact age and builder remain subjects of ongoing scholarly research and debate."},
         {title:"Karnak Temple",body:"The world's largest surviving religious complex, expanded over 2,000 years. The Great Hypostyle Hall's 134 columns (tallest ~23m) are breathtaking. Connected to Luxor Temple by a sphinx-lined avenue."},
         {title:"Abu Simbel",body:"Rock-cut temples carved for Ramesses II in Nubia. Famous for their solar alignment: sunlight illuminates the inner sanctuary twice a year. UNESCO coordinated their relocation in the 1960s to save them from Lake Nasser."},
       ]},
      {id:"pharaoh",icon:"♛",label:"Pharaohs",desc:"Royal lineages from the Old Kingdom to Cleopatra",
       cards:[
         {title:"What is a Pharaoh?",body:"'Pharaoh' derives from Egyptian per-aa (great house). Pharaohs were divine intermediaries between gods and humans, managing the Nile floods and temple rites. After death they were identified with Osiris."},
         {title:"Khufu",body:"Builder of the Great Pyramid (~2589–2566 BC). Surprisingly few records survive; his only known portrait is a tiny 7.5cm ivory statuette. Modern archaeology suggests builders were organized workers, not slaves."},
         {title:"Hatshepsut",body:"One of ancient Egypt's most successful female rulers (~1473–1458 BC). Governed in male regalia for 20+ years. Known for the Deir el-Bahri mortuary temple and the Punt expedition. Her successor erased many of her monuments."},
         {title:"Akhenaten & the Amarna Period",body:"18th dynasty pharaoh (~1353–1336 BC) who strongly promoted the worship of Aten and built the new city of Amarna. His unique artistic style also emerged in this period. His reforms were reversed shortly after his death."},
         {title:"Ramesses II",body:"One of ancient Egypt's most celebrated pharaohs, ruling for 66+ years (~1279–1213 BC). Signed the world's oldest surviving peace treaty (Kadesh Treaty). Built Abu Simbel, the Ramesseum, and monuments across the empire."},
         {title:"Cleopatra VII",body:"Last Ptolemaic ruler (~51–30 BC) and the only in her dynasty known to have spoken Egyptian. Skilled in multiple languages and knowledgeable in philosophy, astronomy, and mathematics. Allied with Caesar and Antony before her death in 30 BC."},
       ]},
      {id:"religion",icon:"☥",label:"Mythology",desc:"Ra, Osiris, Isis — the living world of Egyptian gods",
       cards:[
         {title:"Egyptian Polytheism",body:"A rich system of over 2,000 gods depicted as animals, humans, or hybrids. Each governed natural phenomena or social functions. Local deities coexisted and merged across Egypt's unified territory."},
         {title:"Ra: The Sun God",body:"Supreme solar deity depicted as a falcon-headed man. By day he sailed the solar barque across the sky; by night he journeyed through the Duat. Old Kingdom pharaohs called themselves 'Son of Ra'."},
         {title:"Osiris & Isis",body:"Osiris, god of fertility, was killed and dismembered by his brother Set. His wife Isis gathered his body and brought him back to life. This myth became the foundation of Egyptian afterlife belief."},
         {title:"Anubis & the Judgment",body:"Jackal-headed Anubis guarded mummification and necropoli. In the Hall of Two Truths, the deceased's heart was weighed against Ma'at's feather; a light heart granted entry to paradise."},
         {title:"Horus vs. Set",body:"Falcon-headed Horus, son of Osiris and Isis, fought his uncle Set for Egypt's rulership and ultimately prevailed. Every pharaoh was considered the living manifestation of Horus."},
       ]},
      {id:"writing",icon:"✦",label:"Hieroglyphs",desc:"The secrets of Egyptian writing and the Rosetta Stone",
       cards:[
         {title:"What Are Hieroglyphs?",body:"Greek for 'sacred carvings.' This writing system (~3200 BC) combines logograms, phonograms, and determinatives. Used on temple walls, columns, and papyrus for over 3,000 years."},
         {title:"The Rosetta Stone",body:"Discovered by Napoleon's expedition at Rosetta in 1799. Ptolemy V's decree (~196 BC) in hieroglyphs, Demotic, and Greek enabled Champollion's 1822 decipherment."},
         {title:"Hieratic & Demotic",body:"Hieratic was a cursive script for administrative and religious use. The even more simplified Demotic later spread for everyday commerce and legal documents, especially in the Late and Ptolemaic periods."},
         {title:"The Scribal Profession",body:"Scribes (sesh) held high social status requiring 10+ years of training. Their privileged life was commemorated in sculpture: scribe statues always show a seated figure with papyrus unrolled across the lap."},
       ]},
      {id:"burial",icon:"◈",label:"Burial Rites",desc:"Mummies, Valley of the Kings, the Book of the Dead",
       cards:[
         {title:"Mummification",body:"A 70-day process. Organs were removed (stored in canopic jars except the heart), the body was dehydrated with natron for 40 days, then wrapped with linen and resins. Thousands of mummies survive today."},
         {title:"The Book of the Dead",body:"'The Book of Coming Forth by Day' — a collection of 200+ spells enabling safe passage through the afterlife. Written on papyrus and placed in coffins from ~1550 BC. Chapter 125 (the Judgment) is the most important."},
         {title:"Valley of the Kings",body:"Rock-cut tombs of New Kingdom pharaohs on Luxor's west bank. 60+ tombs identified. Tutankhamun's tomb (KV62), discovered in 1922 by Howard Carter, is the only royal burial found largely intact."},
         {title:"Ka, Ba & Akh: The Soul",body:"Ka (life force) remained in the tomb to receive offerings. Ba (human-headed bird) could fly freely after death. Akh was the fully transformed spirit. All three required elaborate funerary rites to function properly."},
       ]},
      {id:"military",icon:"⚔",label:"Military",desc:"Ramesses II and the epic Battle of Kadesh",
       cards:[
         {title:"The Egyptian Army",body:"The Old Kingdom relied on seasonal conscripts; the New Kingdom developed a professional standing army. Foreign mercenaries (Nubian, Syrian) were common. Chariot warfare, introduced ~1600 BC, transformed military capability."},
         {title:"War with the Hyksos",body:"The Hyksos conquered northern Egypt ~1650 BC, introducing horses, chariots, and bronze. After ~100 years of occupation, Theban king Ahmose I expelled them and founded the New Kingdom (~1550 BC)."},
         {title:"Kadesh & the World's Oldest Surviving Peace Treaty",body:"In 1274 BC, Ramesses II clashed with Hittite king Muwatalli II. The outcome was inconclusive, but both sides eventually signed the Kadesh Treaty (~1259 BC) — the world's oldest surviving peace treaty."},
         {title:"Alexander's Conquest",body:"In 332 BC, Alexander the Great conquered Egypt without major resistance. He honored Egyptian gods, received the title of pharaoh, and founded Alexandria on the Mediterranean coast."},
       ]},
    ],
  },
  timeline:{
    title:"Dynasties of Egypt", sub:"Click or tap a period for details",
    periods:DATA.ja.timeline.periods.map(p=>({...p,
      label:{predynastic:"Predynastic",early:"Early Dynastic",old:"Old Kingdom",first_int:"First Intermediate",middle:"Middle Kingdom",second_int:"Second Intermediate",new:"New Kingdom",third_int:"Third Intermediate",late:"Late Period",ptolemaic:"Ptolemaic"}[p.id]||p.label,
      pharaohs:{predynastic:["Naqada Culture"],early:["Narmer","Den","Khasekhemwy"],old:["Djoser","Sneferu","Khufu","Khafre","Menkaure"],first_int:["Regional rulers"],middle:["Mentuhotep II","Amenemhat I","Senusret III"],second_int:["Hyksos dynasty","Kamose"],new:["Ahmose I","Hatshepsut","Thutmose III","Akhenaten","Tutankhamun","Ramesses II"],third_int:["Tanis dynasty","Libyan dynasties","Kushite dynasty"],late:["Psamtik I","Necho II","Amasis II"],ptolemaic:["Ptolemy I","Cleopatra III","Cleopatra VII"]}[p.id]||p.pharaohs,
      fact:{predynastic:"Agricultural civilizations developed along the Nile. Upper and Lower Egypt formed as independent kingdoms. Advanced pottery and stone tools laid the foundation for the civilization to come.",early:"Narmer (Menes) unified Egypt and founded the first dynasty. Memphis became the capital. Early hieroglyphs and religious rituals were established.",old:"The Age of Pyramids. A powerful centralized state emerged. The Great Pyramids of Giza and other massive structures were built. The pharaoh's divine status reached its peak.",first_int:"Centralized power collapsed; Egypt was ruled by regional lords. Droughts and famines are thought to have caused social unrest. Multiple competing dynasties arose simultaneously.",middle:"Mentuhotep II of Thebes reunified Egypt. Classical Middle Egyptian literature flourished. Nubian campaigns expanded Egypt's southern territory.",second_int:"The Hyksos from western Asia ruled northern Egypt, introducing horses, chariots, and bronze. The Theban dynasty resisted and ultimately expelled them.",new:"Egypt's golden age. Territory expanded into Syria and Nubia. The Karnak temple was greatly enlarged. The Amarna revolution, Kadesh treaty, and other landmark events occurred.",third_int:"Weakened central power led to competition from Libyan, Nubian, and Assyrian forces. Multiple dynasties ruled simultaneously in a complex political landscape.",late:"The Saite dynasty restored native rule after Assyria, only for Egypt to fall to Persia. Growing Greek influence began reshaping Egyptian culture and commerce.",ptolemaic:"Greek dynasty founded by Ptolemy, a general of Alexander the Great. Alexandria became the Mediterranean world's hub of learning. Cleopatra VII's death ended Egypt's independence."}[p.id]||p.fact,
    })),
  },
  quiz:{
    title:"Test Your Knowledge", sub:"AI-Generated Ancient Egypt Quiz",
    diffLabel:"Difficulty", topicLabel:"Topic", typeLabel:"Format",
    genBtn:"Generate Quiz", nextBtn:"Next Question", judgeBtn:"Check Answer",
    correct:"Correct!", wrong:"Incorrect", corrAns:"Answer:", expl:"Explanation:",
    partialMatch:"Partial match accepted",
    scoreLabel:"Score", loading:"Generating...",
    errMsg:"Failed to generate a question. Please try again.",
    saveWrong:"Wrong answer saved to review ◈",
    reviewTitle:"Review Notes",
    reviewSub:"Retry the questions you got wrong",
    reviewEmpty:"No wrong answers yet. Try the quiz!",
    reviewCount:"questions",
    reviewRetry:"Retry",
    reviewDelete:"Remove",
    reviewClear:"Clear all",
    reviewTopic:"Topic",
    reviewAnswered:"Your answer:",
    reviewCorrect:"Correct:",
    reviewDone:"Correct! Mastered ✓",
    diffs:["Easy","Medium","Hard"],
    topics:["All","Architecture","Pharaohs","Mythology","Writing","Burial","Military","Museums","Pyramids"],
    types:["4-Choice","Fill-in"],
    sys:`You are an expert in ancient Egyptian history. Output exactly 1 quiz question as JSON only. No preamble, no code blocks, no markdown — raw JSON only.

For "4-Choice":
{"type":"multiple","question":"question text","choices":["A","B","C","D"],"answer":"exact matching choice text","explanation":"80-120 char explanation"}

For "Fill-in":
{"type":"fill","question":"Question — what word/name goes in ___?","answer":"short keyword answer (max 15 chars)","hint":"short hint","explanation":"80-120 char explanation"}`,
  },
  archive:{
    title:"Archive", sub:"Records of Ancient Egypt",
    cats:["Pharaohs","Gods","Sites","Treasures","Museums","Pyramids"],
    pharaohs:DATA.ja.archive.pharaohs.map(p=>({...p,sub:{khufu:"Reign BC2589–2566 / Dynasty 4",hatshepsut:"Reign BC1473–1458 / Dynasty 18",akhenaten:"Reign BC1353–1336 / Dynasty 18",tutankhamun:"Reign BC1332–1323 / Dynasty 18",ramesses2:"Reign BC1279–1213 / Dynasty 19",cleopatra:"Reign BC51–30 / Ptolemaic"}[p.id],body:{khufu:"Builder of the Great Pyramid. Only known portrait is a 7.5cm ivory statuette. ~20,000 organized workers labored for 20+ years on his monument.",hatshepsut:"One of ancient Egypt's most successful female rulers. Governed for 20+ years in male regalia. Famous for the Deir el-Bahri temple and the Punt expedition. Her successor erased many of her monuments.",akhenaten:"Pharaoh who strongly promoted Aten worship and built the new city of Amarna, generating a unique artistic style. His reforms were reversed shortly after his death.",tutankhamun:"Boy king who took the throne young and died after ~10 years. Howard Carter's 1922 discovery of his nearly intact tomb (KV62) was one of the 20th century's greatest archaeological finds.",ramesses2:"One of Egypt's most celebrated pharaohs (66+ year reign). Signed the world's oldest surviving peace treaty, built Abu Simbel and the Ramesseum, and placed his statues across Egypt.",cleopatra:"Last Ptolemaic ruler and the only one in her dynasty known to have spoken Egyptian. Skilled in multiple languages and knowledgeable in philosophy and science. Died in 30 BC after defeat by Rome."}[p.id]||p.body})),
    gods:DATA.ja.archive.gods.map(g=>({...g,sub:{ra:"Sun God / Supreme Deity",osiris:"God of the Afterlife & Fertility",isis:"Goddess of Magic & Motherhood",anubis:"God of the Dead & Mummification",horus:"God of Kingship & the Sky",thoth:"God of Wisdom, Writing & the Moon",set:"God of Chaos, Deserts & Storms",hathor:"Goddess of Love, Beauty & Music"}[g.id],body:{ra:"Supreme solar deity, depicted as a falcon-headed man. By day he sailed the solar barque; by night he journeyed through the Duat. Old Kingdom pharaohs bore the title 'Son of Ra'.",osiris:"God of resurrection, depicted as a green-skinned mummy. As king of the dead he presided over the judgment of souls, promising eternal life to the worthy.",isis:"Wife of Osiris, mother of Horus. Goddess of magic and healing, depicted with falcon wings. Her cult spread throughout the Roman Empire.",anubis:"Jackal-headed god of embalming and the necropolis. He oversaw the weighing of the heart against Ma'at's feather in the Hall of Two Truths.",horus:"Falcon-headed god of kingship, son of Osiris and Isis. His victory over Set legitimized pharaonic rule; every pharaoh was considered the living Horus.",thoth:"Ibis-headed god credited with inventing hieroglyphs, patron of scribes. Associated with medicine, mathematics, and astronomy; equated with Greek Hermes.",set:"God of chaos, deserts, and storms. Murderer of Osiris, yet also protector of the solar barque — a complex deity symbolizing Egypt's uneasy relationship with the desert.",hathor:"Goddess of love, beauty, and music, depicted as a cow or woman with cow horns and a solar disk. She also guided the dead in the afterlife; equated with Greek Aphrodite."}[g.id]||g.body})),
    sites:DATA.ja.archive.sites.map(s=>({...s,sub:{giza:"Old Kingdom ~BC2589 / Near Cairo",karnak:"New Kingdom BC2055– / Luxor",valley:"New Kingdom BC1550– / Luxor West Bank",abu_simbel:"New Kingdom ~BC1264 / South of Aswan",alexandria:"Ptolemaic BC331– / Mediterranean Coast",saqqara:"Old Kingdom ~BC2650 / Near Memphis"}[s.id],body:{giza:"The only surviving wonder of the ancient world. Three great pyramids and the Sphinx, ~13km from Cairo. Active excavations continue to uncover new findings.",karnak:"The world's largest surviving religious complex, expanded over 2,000 years. The Great Hypostyle Hall's 134 columns (tallest ~23m) are breathtaking.",valley:"Rock-cut tombs of New Kingdom pharaohs on Luxor's west bank. 60+ tombs identified. Tutankhamun's tomb (KV62) was the only royal burial found largely intact.",abu_simbel:"Rock temples carved for Ramesses II. Famous for solar alignment twice a year. Relocated by UNESCO in the 1960s to save them from Lake Nasser flooding.",alexandria:"City founded by Alexander the Great. Home to the Mouseion (Library of Alexandria), where Euclid, Eratosthenes, and others worked. Still Egypt's second-largest city.",saqqara:"World's oldest large stone structure — Imhotep's six-tiered Step Pyramid (~60m). New burial chambers were discovered as recently as 2020."}[s.id]||s.body})),
    treasures:DATA.ja.archive.treasures.map(t=>({...t,sub:{goldmask:"~BC1323 / Cairo Egyptian Museum",rosetta:"BC196 / British Museum",nefertiti:"~BC1345 / Neues Museum Berlin",canopic:"New Kingdom / Various Museums",bookdead:"~BC1250 / British Museum",palette:"~BC3000 / Cairo Egyptian Museum"}[t.id],body:{goldmask:"Solid gold death mask (~11kg) decorated with lapis lazuli, carnelian, and turquoise. Widely regarded as the masterpiece of ancient Egyptian art.",rosetta:"Ptolemy V's decree (~196 BC) in three scripts. Discovered in 1799, it enabled Champollion's 1822 decipherment of hieroglyphs. One of the British Museum's most visited objects.",nefertiti:"Painted limestone bust of Akhenaten's queen, discovered in Amarna in 1912. Celebrated as a symbol of ancient beauty. Egypt continues to request its return from Berlin.",canopic:"Four jars storing mummified organs: Imsety (liver), Hapy (lungs), Duamutef (stomach), Qebehsenuef (intestines), each under the protection of one of Horus's four sons.",bookdead:"The finest surviving Book of the Dead, made for the scribe Ani. 78 pages of illustrated spells; the Hall of Judgment scene offers our clearest view of Egyptian afterlife beliefs.",palette:"Ceremonial palette (63cm) commemorating Egypt's unification. One side shows Narmer smiting a foe; the other a victory procession. One of the earliest masterpieces of Egyptian art."}[t.id]||t.body})),
    museums:DATA.ja.archive.museums.map(m=>({...m,sub:{cairo:"Cairo, Tahrir Square",gem:"Giza, near the Pyramids",british:"London, United Kingdom",louvre:"Paris, France",metropolitan:"New York, USA",berlin:"Berlin, Germany"}[m.id],body:{cairo:"Opened 1902. World-class Egyptian antiquities collection with 150,000+ objects, including Tutankhamun's gold mask. Collection being transferred to the new Grand Egyptian Museum.",gem:"Partially opened 2023. World's largest archaeological museum (~90,000 m²). Complete Tutankhamun collection and Giza Pyramid views are the main highlights.",british:"Home to the Rosetta Stone, Ani Papyrus, and Amenhotep III bust. One of the world's finest Egyptian collections. Permanent galleries are free to enter.",louvre:"50,000+ Egyptian objects. Champollion was its first curator. Covers Old Kingdom through Late Period. One of the world's most historically significant Egyptian collections.",metropolitan:"Features the relocated Temple of Dendur from Nubia. 26,000+ objects — America's largest Egyptian collection built on a century of fieldwork.",berlin:"World-famous for the Nefertiti Bust. Rich Amarna-period finds from German excavations. Located in the UNESCO-listed Museumsinsel."}[m.id]||m.body})),
    pyramids:DATA.ja.archive.pyramids.map(p=>({...p,sub:{khufu_pyr:"BC2589–2566 / Giza",khafre_pyr:"BC2558–2532 / Giza",menkaure_pyr:"BC2532–2504 / Giza",djoser_pyr:"~BC2650 / Saqqara",bent:"~BC2600 / Dahshur",red:"~BC2590 / Dahshur"}[p.id],body:{khufu_pyr:"Originally 146m tall (now 138.5m), base ~230m. Built from 2.3 million+ limestone blocks (~2.5t avg). Interior: King's Chamber, Queen's Chamber, Grand Gallery. Construction methods still debated.",khafre_pyr:"~136m tall. Preserves original white limestone casing near the apex. The adjacent Sphinx is widely believed to bear Khafre's face. Best-preserved mortuary and valley temples in the Giza complex.",menkaure_pyr:"~65m — smallest of the three Giza pyramids. Lower courses retain red granite casing. Three exquisite triads (Menkaure with Hathor and a nome deity) were found inside; now in the Cairo Museum.",djoser_pyr:"World's oldest large stone structure (60m, 6 tiers). Designed by Imhotep by stacking mastabas. Part of the Memphis UNESCO World Heritage Site; the surrounding complex contains the earliest stone columns.",bent:"Built by Sneferu. Slope changes midway (54°→43°), likely due to structural concerns. Retains much of its original casing. One of two large Dahshur pyramids attributed to Sneferu.",red:"The world's first true smooth-sided pyramid, also by Sneferu. ~105m tall, named for its reddish limestone. Interior is relatively accessible and offers one of the best pyramid-visit experiences."}[p.id]||p.body})),
  },
};

// ─── SVG ──────────────────────────────────────────────────────────────────────
const EyeOfRa = ({size=40,color=C.gold,opacity=1}) => (
  <svg width={size} height={size*0.6} viewBox="0 0 100 60" fill="none" style={{opacity,flexShrink:0,display:"block"}}>
    <ellipse cx="50" cy="30" rx="40" ry="24" stroke={color} strokeWidth="2.5" fill="none"/>
    <circle cx="50" cy="30" r="10" fill={color} opacity="0.9"/>
    <circle cx="50" cy="30" r="5" fill="#0e0c07"/>
    <path d="M10 30 Q30 6 50 8 Q70 6 90 30" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M40 40 L35 56 M50 43 L50 58 M60 40 L65 56" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const Ankh = ({size=20,color=C.gold,opacity=0.7}) => (
  <svg width={size} height={size*1.45} viewBox="0 0 20 29" style={{opacity,flexShrink:0,display:"block"}}>
    <ellipse cx="10" cy="7" rx="6" ry="4.5" stroke={color} strokeWidth="1.8" fill="none"/>
    <line x1="10" y1="11.5" x2="10" y2="29" stroke={color} strokeWidth="1.8"/>
    <line x1="3" y1="18" x2="17" y2="18" stroke={color} strokeWidth="1.8"/>
  </svg>
);
const PyramidsBg = ({opacity=0.06}) => (
  <svg width="100%" height="100%" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMax meet"
    style={{position:"absolute",bottom:0,left:0,opacity,pointerEvents:"none"}}>
    <polygon points="500,20 80,500 920,500" fill={C.gold}/>
    <polygon points="830,140 600,500 1060,500" fill={C.gold} opacity="0.5"/>
    <polygon points="140,230 10,500 370,500" fill={C.gold} opacity="0.35"/>
  </svg>
);

// ─── Shared UI ────────────────────────────────────────────────────────────────
const GLYPHS = "☥ ✦ △ ◈ ♛ ⚔ ☀ ◇ ★ ✧ ⬡ ◎ ✶ ⬢ ✴ ◉ ⊕ ✺ ◆ ✷";
const Ticker = () => (
  <div style={{overflow:"hidden",height:24,borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,background:"rgba(200,168,75,0.03)"}}>
    <div style={{display:"inline-flex",gap:24,whiteSpace:"nowrap",animation:"drift 28s linear infinite",fontSize:11,color:C.gold,opacity:0.3,lineHeight:"24px",letterSpacing:"0.3em"}}>
      {[0,1,2,3,4].map(i=><span key={i}>{GLYPHS}</span>)}
    </div>
  </div>
);
const Divider = ({label,sub}) => (
  <div style={{textAlign:"center",marginBottom:sub?36:44}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:14,marginBottom:12}}>
      <div style={{height:1,width:50,background:`linear-gradient(to right,transparent,${C.gold})`}}/>
      <Ankh size={13} color={C.gold} opacity={0.7}/>
      <div style={{height:1,width:50,background:`linear-gradient(to left,transparent,${C.gold})`}}/>
    </div>
    <h2 style={{fontFamily:FH,fontWeight:700,fontSize:"clamp(17px,2.6vw,24px)",color:C.sand2,letterSpacing:"0.13em"}}>{label}</h2>
    {sub&&<p style={{marginTop:8,fontSize:12,color:C.muted,fontStyle:"italic"}}>{sub}</p>}
  </div>
);
const GoldCard = ({children,onClick,style={}}) => {
  const [hov,setHov]=useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:hov&&onClick?C.surface2:C.surface,border:`1px solid ${hov&&onClick?"rgba(200,168,75,0.4)":C.border}`,borderRadius:6,transition:"all 0.25s",transform:hov&&onClick?"translateY(-2px)":"none",cursor:onClick?"pointer":"default",position:"relative",overflow:"hidden",...style}}>
      <div style={{position:"absolute",top:0,right:0,width:14,height:14,borderTop:`1.5px solid ${C.gold}`,borderRight:`1.5px solid ${C.gold}`,opacity:hov?0.6:0.15,transition:"opacity 0.3s"}}/>
      <div style={{position:"absolute",bottom:0,left:0,width:14,height:14,borderBottom:`1.5px solid ${C.gold}`,borderLeft:`1.5px solid ${C.gold}`,opacity:hov?0.6:0.15,transition:"opacity 0.3s"}}/>
      {children}
    </div>
  );
};
const BackBtn = ({label,onClick}) => (
  <button onClick={onClick} style={{background:"none",border:"none",color:C.muted,fontFamily:FH,fontSize:11,letterSpacing:"0.1em",cursor:"pointer",marginBottom:28,padding:0,display:"block"}}>{label}</button>
);
const TabBar = ({tabs,active,onChange}) => (
  <div style={{display:"flex",justifyContent:"center",gap:7,marginBottom:32,flexWrap:"wrap"}}>
    {tabs.map((tab,i)=>(
      <button key={i} onClick={()=>onChange(i)} style={{background:active===i?"rgba(200,168,75,0.12)":"transparent",border:`1px solid ${active===i?C.gold:C.border}`,borderRadius:4,color:active===i?C.gold2:C.muted,fontFamily:FH,fontSize:11,letterSpacing:"0.1em",padding:"6px 16px",cursor:"pointer",transition:"all 0.2s"}}>{tab}</button>
    ))}
  </div>
);

// FIX #8: Sel defined outside QuizPage to avoid re-creation on each render
const QuizSelBtn = ({opts,val,set}) => (
  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
    {opts.map((o,i)=>(
      <button key={i} onClick={()=>set(i)} style={{background:val===i?"rgba(200,168,75,0.15)":"transparent",border:`1px solid ${val===i?C.gold:C.border}`,borderRadius:4,color:val===i?C.gold2:C.muted,fontFamily:FH,fontSize:10,letterSpacing:"0.07em",padding:"4px 10px",cursor:"pointer",transition:"all 0.2s"}}>{o}</button>
    ))}
  </div>
);

// ─── NAV ──────────────────────────────────────────────────────────────────────
const Nav = ({t,lang,setLang,active,setActive}) => {
  const [scrolled,setScrolled]=useState(false);
  useEffect(()=>{const fn=()=>setScrolled(window.scrollY>40);window.addEventListener("scroll",fn,{passive:true});return()=>window.removeEventListener("scroll",fn);},[]);
  return (
    <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:200,background:scrolled?"rgba(14,12,7,0.97)":"transparent",backdropFilter:scrolled?"blur(12px)":"none",borderBottom:`1px solid ${scrolled?C.border:"transparent"}`,transition:"background 0.4s,border-color 0.4s"}}>
      <Ticker/>
      <div style={{maxWidth:1080,margin:"0 auto",display:"flex",alignItems:"center",padding:"9px 20px",gap:2}}>
        <button onClick={()=>setActive("home")} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,marginRight:"auto",padding:0}}>
          <EyeOfRa size={26}/>
          <div style={{textAlign:"left"}}>
            <div style={{fontFamily:FH,fontWeight:700,fontSize:13,color:C.gold,letterSpacing:"0.14em"}}>{t.appName}</div>
            <div style={{fontSize:9,color:C.muted,letterSpacing:"0.06em"}}>{t.appSub}</div>
          </div>
        </button>
        {Object.entries(t.nav).map(([key,label])=>(
          <button key={key} onClick={()=>setActive(key)} style={{background:"none",border:"none",cursor:"pointer",fontFamily:FH,fontSize:10,letterSpacing:"0.1em",color:active===key?C.gold2:C.muted,padding:"6px 9px",position:"relative",transition:"color 0.2s"}}>
            {label}
            {active===key&&<div style={{position:"absolute",bottom:1,left:"50%",transform:"translateX(-50%)",width:14,height:1.5,background:C.gold,borderRadius:1}}/>}
          </button>
        ))}
        <button onClick={()=>setLang(l=>l==="ja"?"en":"ja")} style={{marginLeft:10,background:"transparent",border:`1px solid ${C.border}`,borderRadius:3,color:C.gold,fontFamily:FH,fontSize:9,letterSpacing:"0.1em",padding:"3px 8px",cursor:"pointer"}}>{t.langToggle}</button>
      </div>
    </nav>
  );
};

// ─── HERO ─────────────────────────────────────────────────────────────────────
const Hero = ({t,setActive}) => (
  <section style={{minHeight:"100vh",position:"relative",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",background:"radial-gradient(ellipse 90% 55% at 50% 88%,#2e1c05 0%,#0e0c07 60%)"}}>
    {STARS.map(s=><div key={s.id} style={{position:"absolute",left:`${s.left}%`,top:`${s.top}%`,width:s.size,height:s.size,borderRadius:"50%",background:"white",animation:`twinkle ${s.dur}s ease-in-out ${s.del}s infinite`,pointerEvents:"none"}}/>)}
    <PyramidsBg opacity={0.07}/>
    <div style={{position:"absolute",bottom:0,left:0,right:0,height:200,background:"linear-gradient(to top,rgba(180,100,10,0.1),transparent)",pointerEvents:"none"}}/>
    <div style={{position:"relative",zIndex:1,textAlign:"center",padding:"110px 24px 60px",maxWidth:680}}>
      <div style={{display:"flex",justifyContent:"center",marginBottom:28,animation:"fadeUp 0.8s ease both"}}><EyeOfRa size={56}/></div>
      <h1 style={{fontFamily:FH,fontWeight:900,fontSize:"clamp(30px,5.5vw,60px)",color:C.sand2,letterSpacing:"0.07em",lineHeight:1.18,marginBottom:20,animation:"fadeUp 0.9s ease 0.1s both",textShadow:"0 2px 40px rgba(200,168,75,0.3)"}}>{t.hero.title}</h1>
      <p style={{fontSize:"clamp(13px,1.7vw,16px)",color:C.muted,lineHeight:1.85,marginBottom:44,animation:"fadeUp 0.9s ease 0.2s both",fontStyle:"italic",fontFamily:FB}}>{t.hero.sub}</p>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:14,marginBottom:40,animation:"fadeUp 0.9s ease 0.3s both"}}>
        <div style={{height:1,width:48,background:`linear-gradient(to right,transparent,${C.gold})`}}/>
        <Ankh size={13} opacity={0.85}/>
        <div style={{height:1,width:48,background:`linear-gradient(to left,transparent,${C.gold})`}}/>
      </div>
      <button onClick={()=>setActive("themes")} style={{background:"transparent",border:`1px solid ${C.gold}`,color:C.gold2,fontFamily:FH,fontWeight:600,fontSize:11,letterSpacing:"0.22em",padding:"12px 44px",cursor:"pointer",transition:"all 0.3s",animation:"fadeUp 0.9s ease 0.4s both, glow 3.5s ease-in-out 2s infinite"}}
        onMouseEnter={e=>{e.currentTarget.style.background="rgba(200,168,75,0.1)";e.currentTarget.style.letterSpacing="0.28em";}}
        onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.letterSpacing="0.22em";}}>{t.hero.cta}</button>
    </div>
    <div style={{position:"absolute",bottom:24,left:"50%",transform:"translateX(-50%)",width:1,height:40,background:`linear-gradient(to bottom,${C.gold},transparent)`,opacity:0.35}}/>
  </section>
);

// ─── FLIP CARD ────────────────────────────────────────────────────────────────
const FlipCard = ({card, index}) => {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      onClick={() => setFlipped(f => !f)}
      style={{
        perspective: 900,
        height: 180,
        cursor: "pointer",
        animation: `fadeUp 0.5s ease ${index * 0.06}s both`,
      }}
    >
      <div style={{
        position: "relative", width: "100%", height: "100%",
        transformStyle: "preserve-3d",
        transition: "transform 0.55s cubic-bezier(0.4,0.2,0.2,1)",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
      }}>
        {/* Front */}
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden",
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 6, padding: "20px 18px",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}>
          <div style={{ position:"absolute", top:0, right:0, width:14, height:14, borderTop:`1.5px solid ${C.gold}`, borderRight:`1.5px solid ${C.gold}`, opacity:0.2, borderRadius:"0 6px 0 0" }}/>
          <div style={{ position:"absolute", bottom:0, left:0, width:14, height:14, borderBottom:`1.5px solid ${C.gold}`, borderLeft:`1.5px solid ${C.gold}`, opacity:0.2, borderRadius:"0 0 0 6px" }}/>
          <h3 style={{ fontFamily:FH, fontSize:13, color:C.gold2, letterSpacing:"0.08em", lineHeight:1.4 }}>{card.title}</h3>
          <div style={{ fontSize:10, color:C.muted, fontFamily:FH, letterSpacing:"0.1em", opacity:0.6, textAlign:"right" }}>タップして詳細 →</div>
        </div>
        {/* Back */}
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          background: C.surface2, border: `1px solid rgba(200,168,75,0.4)`,
          borderRadius: 6, padding: "16px 16px",
          overflow: "hidden",
        }}>
          <p style={{ fontSize:12, color:C.text, lineHeight:1.82, fontFamily:FB }}>{card.body}</p>
        </div>
      </div>
    </div>
  );
};

// ─── THEMES PAGE ──────────────────────────────────────────────────────────────
const ThemesPage = ({t, setActive, setQuizTopic}) => {
  const [sel, setSel] = useState(null);

  if (sel) {
    const theme = t.themes.items.find(x => x.id === sel);
    // Map theme id to quiz topic index
    const topicMap = {architecture:1, pharaoh:2, religion:3, writing:4, burial:5, military:6};
    const topicIdx = topicMap[sel] ?? 0;
    const quizLabel = t.quiz?.genBtn || "クイズ";
    return (
      <div style={{maxWidth:1000, margin:"0 auto", padding:"100px 24px 80px"}}>
        <BackBtn label={t.back} onClick={() => setSel(null)}/>
        {/* Header */}
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16, marginBottom:32}}>
          <div style={{display:"flex", alignItems:"center", gap:14}}>
            <span style={{fontSize:28, color:C.gold}}>{theme.icon}</span>
            <h1 style={{fontFamily:FH, fontWeight:700, fontSize:"clamp(18px,3vw,26px)", color:C.sand2, letterSpacing:"0.1em"}}>{theme.label}</h1>
          </div>
          {/* Quiz shortcut button */}
          <button
            onClick={() => { setQuizTopic(topicIdx); setActive("quiz"); }}
            style={{background:"transparent", border:`1px solid ${C.gold}`, color:C.gold2, fontFamily:FH, fontSize:10, letterSpacing:"0.15em", padding:"8px 20px", borderRadius:3, cursor:"pointer", transition:"all 0.25s", whiteSpace:"nowrap"}}
            onMouseEnter={e => e.currentTarget.style.background="rgba(200,168,75,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background="transparent"}
          >
            {theme.icon} {quizLabel}
          </button>
        </div>
        {/* Instruction */}
        <p style={{fontSize:12, color:C.muted, fontStyle:"italic", marginBottom:24, fontFamily:FB}}>
          {t.themes.flipHint || "カードをタップ・クリックすると詳細が表示されます"}
        </p>
        {/* Flip cards grid */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16}}>
          {theme.cards.map((card, i) => <FlipCard key={i} card={card} index={i}/>)}
        </div>
        {/* Bottom quiz CTA */}
        <div style={{marginTop:48, padding:"28px 24px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16}}>
          <div>
            <div style={{fontFamily:FH, fontSize:13, color:C.sand2, letterSpacing:"0.08em", marginBottom:4}}>{theme.label} — クイズに挑戦</div>
            <div style={{fontSize:12, color:C.muted, fontFamily:FB}}>学んだ知識をすぐに試してみよう</div>
          </div>
          <button
            onClick={() => { setQuizTopic(topicIdx); setActive("quiz"); }}
            style={{background:C.gold, color:"#0e0c07", fontFamily:FH, fontWeight:700, fontSize:10, letterSpacing:"0.18em", padding:"10px 28px", border:"none", borderRadius:2, cursor:"pointer", transition:"background 0.2s", whiteSpace:"nowrap"}}
            onMouseEnter={e => e.currentTarget.style.background=C.gold2}
            onMouseLeave={e => e.currentTarget.style.background=C.gold}
          >{quizLabel} →</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{maxWidth:1080, margin:"0 auto", padding:"100px 24px 80px"}}>
      <Divider label={t.themes.title}/>
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16}}>
        {t.themes.items.map((item, i) => (
          <GoldCard key={item.id} onClick={() => setSel(item.id)} style={{padding:"22px 20px", animation:`fadeUp 0.6s ease ${i*0.06}s both`}}>
            <div style={{fontSize:22, marginBottom:11, color:C.gold}}>{item.icon}</div>
            <div style={{fontFamily:FH, fontWeight:600, fontSize:13, color:C.sand2, letterSpacing:"0.07em", marginBottom:8}}>{item.label}</div>
            <div style={{fontSize:13, color:C.muted, lineHeight:1.7, marginBottom:16, fontFamily:FB}}>{item.desc}</div>
            <div style={{fontSize:10, color:C.gold, fontFamily:FH, letterSpacing:"0.1em", opacity:0.7}}>カードを見る →</div>
          </GoldCard>
        ))}
      </div>
    </div>
  );
};

// ─── TIMELINE PAGE ────────────────────────────────────────────────────────────
const TimelinePage = ({t}) => {
  const [sel,setSel]=useState(null);
  const tl=t.timeline;
  const SPAN=5000-30;
  const pct=yr=>((5000-yr)/SPAN)*100;
  const period=tl.periods.find(p=>p.id===sel);
  return (
    <div style={{maxWidth:1080,margin:"0 auto",padding:"100px 24px 80px"}}>
      <Divider label={tl.title} sub={tl.sub}/>
      <div style={{position:"relative",height:10,borderRadius:5,background:"rgba(200,168,75,0.08)",marginBottom:8}}>
        {tl.periods.map(p=>{
          const [s,e]=p.bc.split("-").map(Number);
          const l=pct(s),w=Math.abs(pct(e)-l);
          return <div key={p.id} onClick={()=>setSel(sel===p.id?null:p.id)} title={p.label}
            style={{position:"absolute",left:`${l}%`,width:`${w}%`,top:0,bottom:0,borderRadius:5,background:p.color,opacity:sel===p.id?1:0.55,transition:"opacity 0.2s,transform 0.2s",cursor:"pointer",transform:sel===p.id?"scaleY(1.5)":"scaleY(1)",transformOrigin:"center"}}/>;
        })}
      </div>
      <div style={{position:"relative",height:18,marginBottom:20}}>
        {["5000","3100","2686","2055","1550","664","305","30"].map(yr=>{
          const p=pct(Number(yr));
          return <div key={yr} style={{position:"absolute",left:`${p}%`,transform:"translateX(-50%)",fontSize:8,color:C.muted}}>{yr}BC</div>;
        })}
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:28}}>
        {tl.periods.map(p=>(
          <div key={p.id} onClick={()=>setSel(sel===p.id?null:p.id)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",border:`1px solid ${sel===p.id?p.color:"transparent"}`,borderRadius:4,cursor:"pointer",transition:"border-color 0.2s",background:sel===p.id?"rgba(200,168,75,0.04)":"transparent"}}>
            <div style={{width:8,height:8,borderRadius:2,background:p.color,flexShrink:0}}/>
            <span style={{fontFamily:FH,fontSize:10,color:sel===p.id?C.sand2:C.sand,letterSpacing:"0.06em"}}>{p.label}</span>
            <span style={{fontSize:9,color:C.muted}}>{p.bcLabel}</span>
          </div>
        ))}
      </div>
      {period&&(
        <GoldCard style={{padding:"22px 26px",animation:"fadeUp 0.28s ease both"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <div style={{width:10,height:10,borderRadius:2,background:period.color,flexShrink:0}}/>
            <span style={{fontFamily:FH,fontWeight:700,fontSize:15,color:C.sand2}}>{period.label}</span>
            <span style={{fontSize:11,color:C.muted,fontStyle:"italic"}}>{period.bcLabel}</span>
          </div>
          <p style={{fontSize:14,color:C.text,lineHeight:1.85,marginBottom:16,fontFamily:FB}}>{period.fact}</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
            {period.pharaohs.map(ph=><span key={ph} style={{fontSize:10,fontFamily:FH,letterSpacing:"0.06em",padding:"2px 9px",borderRadius:10,border:`1px solid ${period.color}`,color:C.sand,opacity:0.9}}>{ph}</span>)}
          </div>
        </GoldCard>
      )}
    </div>
  );
};

// ─── QUIZ ROTATION TABLES ────────────────────────────────────────────────────
// Sub-topics per category, used to force rotation so questions never repeat
const ROTATION_SUBTOPICS = {
  0: [ // 全体 / All — すべてのテーマからバランスよく出題
    "ギザのピラミッド建設","ファラオの神格化","オシリスとイシスの神話",
    "ヒエログリフと書記","ミイラ制作の工程","ヒクソスとの戦争",
    "クレオパトラとローマ","スフィンクスの謎","カルナック神殿","王家の谷の発見",
    "アマルナ改革","ロゼッタストーン","死者の書","新王国の対外遠征","プトレマイオス朝",
    "カイロ博物館とツタンカーメン遺物","大英博物館のエジプトコレクション",
    "屈折ピラミッドと赤のピラミッド","ジョセル王の階段ピラミッド",
  ],
  1: [ // 建築
    "階段ピラミッド","ギザ大ピラミッドの構造","スフィンクスの謎","カルナック神殿の増築",
    "アブ・シンベル神殿の移設","ルクソール神殿","マスタバと墓の変遷","屈折ピラミッド",
    "赤のピラミッド","デンデラ神殿","ピラミッドの内部構造","神殿建築の様式",
  ],
  2: [ // ファラオ
    "クフ王","ハトシェプスト","アクエンアテン","ツタンカーメン","ラメセス2世",
    "クレオパトラ7世","ジョセル王","トトメス3世","ナルメル","スネフェル",
    "センウセレト3世","アフモーゼ1世","プトレマイオス1世","ネコ2世",
  ],
  3: [ // 神話・宗教
    "ラー神","オシリス","イシス","アヌビス","ホルス","トト","セト","ハトホル",
    "アテン神","マアト","エジプトの創造神話","オシリス神話","死後の審判",
  ],
  4: [ // 文字・知識
    "ヒエログリフの構造","ロゼッタストーン","ヒエラティック","デモティック",
    "書記の役割","パピルスの製造","シャンポリオンの解読","象形文字の歴史",
    "神官文字の使用例","コプト語とエジプト語の関係","アレキサンドリア図書館",
  ],
  5: [ // 埋葬・来世
    "ミイラ制作の70日工程","カノポス壺の種類","死者の書の内容","王家の谷の発見",
    "心臓の審判の場面","カーとバーの概念","アク（霊体）","ナトロン乾燥法",
    "棺の素材と種類","ツタンカーメン墓KV62","アマルナの王墓","第125章",
  ],
  6: [ // 軍事・外交
    "ヒクソスの侵攻と撃退","カデシュの戦い","アフモーゼ1世の統一","戦車部隊の導入",
    "ヌビア遠征の歴史","カデシュ条約の意義","アレキサンドロス大王の征服",
    "ペルシャによるエジプト支配","海の民との衝突","傭兵制度と外国人兵士",
  ],
  7: [ // 博物館
    "カイロ・エジプト博物館の収蔵品","グランド・エジプシャン・ミュージアム",
    "大英博物館のロゼッタストーン","ルーブル美術館のエジプト部門",
    "メトロポリタン美術館のデンドゥール神殿","ベルリン新博物館のネフェルティティ",
    "ツタンカーメンの黄金マスク","アニのパピルス（死者の書）",
    "ナルメルのパレット","カノポス壺セット","ネフェルティティ胸像の返還問題",
    "博物館とエジプト考古学の歴史",
  ],
  8: [ // ピラミッド
    "クフ王のピラミッドの規模と構造","カフラー王のピラミッドとスフィンクス",
    "メンカウラー王のピラミッドのトライアド像","ジョセル王の階段ピラミッド",
    "屈折ピラミッドの設計変更","赤のピラミッド（世界初の真正ピラミッド）",
    "ピラミッドの建設方法と労働者","ピラミッドテキストの意味",
    "ピラミッドの内部構造（王の間・大回廊）","ダハシュールのピラミッド群",
    "ギザのピラミッド群とスフィンクスの配置","ピラミッドの外装石と現状",
  ],
};

// ─── QUIZ PAGE ────────────────────────────────────────────────────────────────
const QuizPage = ({t, initialTopic=0}) => {
  const q=t.quiz;
  const [diff,setDiff]=useState(0);
  const [topic,setTopic]=useState(initialTopic);
  const [type,setType]=useState(0);
  const [loading,setLoading]=useState(false);
  const [question,setQuestion]=useState(null);
  const [chosen,setChosen]=useState(null);
  const [fill,setFill]=useState("");
  const [revealed,setRevealed]=useState(false);
  const [score,setScore]=useState({c:0,n:0});
  const [err,setErr]=useState("");

  // ── Anti-repeat state ──────────────────────────────────────────────────────
  // history: stores {answer, keywords} of past 8 questions (FIFO)
  const historyRef = useRef([]);
  // rotationIdx: tracks which sub-topic to use next per topic
  const rotationRef = useRef({});

  // Pick next sub-topic in rotation, wrapping around
  const nextSubtopic = useCallback((topicIdx) => {
    const subtopics = ROTATION_SUBTOPICS[topicIdx] || ROTATION_SUBTOPICS[0];
    const cur = rotationRef.current[topicIdx] ?? Math.floor(Math.random() * subtopics.length);
    const next = (cur + 1) % subtopics.length;
    rotationRef.current[topicIdx] = next;
    return subtopics[cur];
  }, []);

  // Extract keywords from a question string (words 3+ chars)
  const extractKeywords = (text) =>
    (text || "").replace(/[。、？！「」『』（）]/g,"")
      .split(/[\s　]+/)
      .filter(w => w.length >= 3)
      .slice(0, 4);

  // Build the forbidden list from history (cap at 5 to keep prompt short)
  const buildForbidden = () => {
    const h = historyRef.current;
    if (!h.length) return "";
    const answers  = [...new Set(h.slice(-5).map(x => x.answer))].join("、");
    const keywords = [...new Set(h.slice(-5).flatMap(x => x.keywords))].slice(0, 10).join("、");
    return `

【禁止】直近の出題済み答え: ${answers}
避けるべきキーワード: ${keywords}`;
  };

  // Update history after a question is generated
  const pushHistory = (q) => {
    const entry = {
      answer: q.answer,
      keywords: extractKeywords(q.question),
    };
    historyRef.current = [...historyRef.current.slice(-7), entry]; // keep last 8
  };

  // Flexible answer matching
  const isCorrect = useCallback(() => {
    if (!question) return false;
    if (question.type === "multiple") return chosen === question.answer;
    const userAns    = fill.trim().toLowerCase().replace(/[　\s]+/g, " ");
    const correctAns = question.answer.toLowerCase();
    return userAns === correctAns
      || correctAns.includes(userAns)
      || userAns.includes(correctAns);
  }, [question, chosen, fill]);

  const generate = useCallback(async () => {
    setLoading(true); setQuestion(null); setChosen(null); setFill(""); setRevealed(false); setErr("");

    // ── Algorithm (decided by 10-engineer discussion) ──────────────────────
    // 1. Rotation: force a specific sub-topic so output always shifts
    // 2. Forbidden list: pass answered keywords from history to block repeats
    // 3. Timestamp seed: makes each request string unique even with same settings
    const subtopic  = nextSubtopic(topic);
    const forbidden = buildForbidden();
    const ts        = Date.now(); // unique per call, prevents prompt caching

    const prompt =
      `[ts:${ts}]
` +
      `難易度: ${q.diffs[diff]}
` +
      `トピック: ${q.topics[topic]}
` +
      `今回の出題対象: 「${subtopic}」に関する問題を作成してください
` +
      `形式: ${q.types[type]}` +
      forbidden;

    try {
      // Claude.ai環境では直接API呼び出し、デプロイ環境ではVercel Edge Function経由
      const isClaudeEnv = typeof window !== "undefined" && window.location.hostname === "claude.ai";
      const apiUrl = isClaudeEnv
        ? "https://api.anthropic.com/v1/messages"
        : "/api/quiz";

      const body = isClaudeEnv
        ? JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:1024, system:q.sys, messages:[{role:"user",content:prompt}] })
        : JSON.stringify({ system:q.sys, messages:[{role:"user",content:prompt}], max_tokens:1024 });

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${errBody.slice(0,120)}`);
      }
      const d   = await res.json();
      const txt = d.content?.[0]?.text || "";
      // Match outermost JSON object (greedy)
      const m   = txt.match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = JSON.parse(m[0]);
        if (parsed.type && parsed.question && parsed.answer) {
          pushHistory(parsed);   // record for next call's forbidden list
          setQuestion(parsed);
        } else throw new Error("Invalid structure");
      } else throw new Error("No JSON");
    } catch (e) {
      console.error(e);
      setErr(q.errMsg);
    }
    setLoading(false);
  }, [diff, topic, type, q.sys, q.diffs, q.topics, q.types, q.errMsg, nextSubtopic]);

  const [savedMsg, setSavedMsg] = useState("");

  const judge = async () => {
    const ok = isCorrect();
    setRevealed(true);
    setScore(s => ({c: s.c + (ok ? 1 : 0), n: s.n + 1}));

    // Save wrong answers to persistent storage (zero extra API tokens)
    if (!ok && question) {
      try {
        const existing = await window.storage.get(REVIEW_KEY).catch(() => null);
        let list = [];
        if (existing?.value) {
          try { list = JSON.parse(existing.value); } catch { list = []; }
        }
        const entry = {
          id: Date.now(),
          question: question.question,
          type: question.type,
          choices: question.choices || null,
          answer: question.answer,
          explanation: question.explanation || "",
          hint: question.hint || "",
          userAnswer: question.type === "multiple" ? chosen : fill,
          topic: q.topics[topic],
          diff: q.diffs[diff],
          savedAt: new Date().toLocaleDateString("ja-JP"),
          mastered: false,
        };
        // Avoid exact duplicate questions
        const deduped = list.filter(x => x.question !== entry.question);
        await window.storage.set(REVIEW_KEY, JSON.stringify([...deduped, entry]));
        setSavedMsg(q.saveWrong);
        setTimeout(() => setSavedMsg(""), 2500);
      } catch (e) {
        console.error("Storage save failed:", e);
      }
    }
  };

  return (
    <div style={{maxWidth:700,margin:"0 auto",padding:"100px 24px 80px"}}>
      <Divider label={q.title} sub={q.sub}/>
      <GoldCard style={{padding:"18px 22px",marginBottom:24}}>
        {[{label:q.diffLabel,opts:q.diffs,val:diff,set:setDiff},{label:q.topicLabel,opts:q.topics,val:topic,set:setTopic},{label:q.typeLabel,opts:q.types,val:type,set:setType}].map(({label,opts,val,set})=>(
          <div key={label} style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap",marginBottom:10}}>
            <span style={{fontFamily:FH,fontSize:10,color:C.muted,letterSpacing:"0.08em",width:56,flexShrink:0}}>{label}</span>
            <QuizSelBtn opts={opts} val={val} set={set}/>
          </div>
        ))}
      </GoldCard>

      {score.n>0&&<div style={{textAlign:"center",marginBottom:16,color:C.gold,fontFamily:FH,fontSize:12,letterSpacing:"0.1em"}}>{q.scoreLabel}: {score.c}/{score.n}</div>}

      <div style={{textAlign:"center",marginBottom:28}}>
        <button onClick={generate} disabled={loading} style={{background:loading?"rgba(200,168,75,0.1)":C.gold,color:loading?C.gold:"#0e0c07",fontFamily:FH,fontWeight:700,fontSize:11,letterSpacing:"0.2em",padding:"11px 40px",border:"none",borderRadius:2,cursor:loading?"not-allowed":"pointer",transition:"all 0.25s"}}>
          {loading
            ?<span style={{display:"flex",alignItems:"center",gap:8,color:C.gold}}><span style={{display:"inline-block",width:13,height:13,border:`2px solid ${C.gold}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>{q.loading}</span>
            :q.genBtn}
        </button>
      </div>

      {/* FIX #7: error display */}
      {err&&<div style={{textAlign:"center",color:C.red,fontSize:13,fontFamily:FB,marginBottom:16,fontStyle:"italic"}}>{err}</div>}

      {question&&(
        <GoldCard style={{padding:"26px 22px",animation:"fadeUp 0.4s ease both"}}>
          <p style={{fontFamily:FB,fontSize:16,color:C.sand2,lineHeight:1.75,marginBottom:22}}>{question.question}</p>

          {question.type==="multiple"&&(
            <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:22}}>
              {(question.choices||[]).map((ch,i)=>{
                let bg="transparent",bc=C.border,col=C.text;
                if(revealed){if(ch===question.answer){bg="rgba(200,168,75,0.12)";bc=C.gold;col=C.gold2;}else if(ch===chosen){bg="rgba(139,58,26,0.15)";bc=C.red;col=C.muted;}}
                else if(ch===chosen){bg="rgba(200,168,75,0.1)";bc=C.gold;col=C.gold2;}
                return(
                  <button key={i} onClick={()=>!revealed&&setChosen(ch)}
                    style={{background:bg,border:`1px solid ${bc}`,borderRadius:4,color:col,fontFamily:FB,fontSize:14,textAlign:"left",padding:"9px 14px",cursor:revealed?"default":"pointer",transition:"all 0.2s"}}>
                    <span style={{fontFamily:FH,fontSize:9,color:C.gold,marginRight:8,opacity:0.7}}>{String.fromCharCode(65+i)}.</span>{ch}
                  </button>
                );
              })}
            </div>
          )}

          {question.type==="fill"&&(
            <div style={{marginBottom:22}}>
              {question.hint&&!revealed&&<p style={{fontSize:12,color:C.muted,fontStyle:"italic",marginBottom:8}}>Hint: {question.hint}</p>}
              <input value={fill} onChange={e=>!revealed&&setFill(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&!revealed&&fill.trim()&&judge()}
                disabled={revealed}
                style={{width:"100%",background:"rgba(200,168,75,0.05)",border:`1px solid ${C.border}`,borderRadius:4,padding:"9px 12px",color:C.text,fontFamily:FB,fontSize:15,outline:"none"}} placeholder="..."/>
            </div>
          )}

          {!revealed&&(
            <button onClick={judge} disabled={question.type==="multiple"?!chosen:!fill.trim()}
              style={{background:C.gold,color:"#0e0c07",fontFamily:FH,fontWeight:700,fontSize:11,letterSpacing:"0.15em",padding:"9px 28px",border:"none",borderRadius:2,cursor:"pointer",opacity:(question.type==="multiple"?!chosen:!fill.trim())?0.4:1}}>
              {q.judgeBtn}
            </button>
          )}

          {revealed&&(
            <div style={{animation:"fadeUp 0.3s ease both"}}>
              {savedMsg && (
                <div style={{padding:"8px 14px",borderRadius:4,background:"rgba(200,168,75,0.08)",border:`1px solid ${C.border}`,marginBottom:12,fontSize:11,color:C.gold,fontFamily:FH,letterSpacing:"0.08em"}}>
                  ✦ {savedMsg}
                </div>
              )}
              {(()=>{const ok=isCorrect();return(
              <div>
                <div style={{padding:"10px 14px",borderRadius:4,background:ok?"rgba(200,168,75,0.1)":"rgba(139,58,26,0.12)",border:`1px solid ${ok?C.gold:C.red}`,marginBottom:14}}>
                  <span style={{fontFamily:FH,fontSize:12,color:ok?C.gold2:C.red,letterSpacing:"0.1em"}}>{ok?q.correct:q.wrong}</span>
                  {!ok&&<p style={{fontSize:13,color:C.muted,marginTop:4}}>{q.corrAns} <span style={{color:C.sand}}>{question.answer}</span></p>}
                </div>
                <p style={{fontSize:13,color:C.muted,fontStyle:"italic",lineHeight:1.7,marginBottom:18,fontFamily:FB}}>{q.expl} {question.explanation}</p>
                <button type="button" onClick={generate} style={{background:"transparent",border:`1px solid ${C.gold}`,color:C.gold,fontFamily:FH,fontSize:10,letterSpacing:"0.15em",padding:"8px 22px",borderRadius:2,cursor:"pointer"}}>{q.nextBtn}</button>
              </div>
              );})()}
            </div>
          )}
        </GoldCard>
      )}
    </div>
  );
};

// ─── REVIEW PAGE ─────────────────────────────────────────────────────────────
const ReviewPage = ({t}) => {
  const q = t.quiz;
  const [list, setList] = useState(null);
  const cacheRef = useRef(null); // write-through cache
  const [retrying, setRetrying] = useState(null);
  const [fill, setFill] = useState("");
  const [chosen, setChosen] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [filterTopic, setFilterTopic] = useState("all");

  useEffect(() => {
    window.storage.get(REVIEW_KEY)
      .then(r => {
        if (!r?.value) return setList([]);
        try {
          const parsed = JSON.parse(r.value);
          cacheRef.current = parsed;
          setList(parsed);
        } catch { setList([]); }
      })
      .catch(() => setList([]));
  }, []);

  // Write-through: update cache + state + async persist
  const save = (updated) => {
    cacheRef.current = updated;
    setList(updated);
    window.storage.set(REVIEW_KEY, JSON.stringify(updated)).catch(console.error);
  };

  const deleteEntry = (id) => save((cacheRef.current || []).filter(x => x.id !== id));
  const clearAll   = () => save([]);

  const startRetry = (entry) => {
    setRetrying(entry);
    setFill(""); setChosen(null); setRevealed(false);
  };

  const isCorrect = () => {
    if (!retrying) return false;
    if (retrying.type === "multiple") return chosen === retrying.answer;
    const u = fill.trim().toLowerCase().replace(/[　\s]+/g," ");
    const a = retrying.answer.toLowerCase();
    return u === a || a.includes(u) || u.includes(a);
  };

  // Fix 6: 2-consecutive-correct = mastered (Engineer 7 recommendation)
  const judgeRetry = () => {
    const ok = isCorrect();
    setRevealed(true);
    if (ok) {
      const updated = (cacheRef.current || []).map(x => {
        if (x.id !== retrying.id) return x;
        const streak = (x.correctStreak || 0) + 1;
        return {...x, correctStreak: streak, mastered: streak >= 2};
      });
      save(updated);
    }
  };

  if (list === null) {
    return (
      <div style={{minHeight:"60vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{color:C.muted,fontFamily:FH,fontSize:12,letterSpacing:"0.1em"}}>Loading…</span>
      </div>
    );
  }

  // ── Retry view
  if (retrying) {
    const ok = revealed ? isCorrect() : null;
    const streak = (list.find(x=>x.id===retrying.id)?.correctStreak||0);
    return (
      <div style={{maxWidth:680,margin:"0 auto",padding:"100px 24px 80px"}}>
        <BackBtn label={t.back} onClick={() => setRetrying(null)}/>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
          <span style={{fontSize:9,fontFamily:FH,letterSpacing:"0.08em",padding:"2px 8px",borderRadius:10,border:`1px solid ${C.border}`,color:C.muted}}>{retrying.topic}</span>
          <span style={{fontSize:9,fontFamily:FH,letterSpacing:"0.08em",padding:"2px 8px",borderRadius:10,border:`1px solid ${C.border}`,color:C.muted}}>{retrying.diff}</span>
          {streak>0&&<span style={{fontSize:9,color:C.gold,fontFamily:FH}}>✦ {streak}/2 正解</span>}
        </div>
        <GoldCard style={{padding:"26px 22px"}}>
          <p style={{fontFamily:FB,fontSize:16,color:C.sand2,lineHeight:1.75,marginBottom:20}}>{retrying.question}</p>
          {!revealed && retrying.userAnswer && (
            <p style={{fontSize:11,color:C.red,fontFamily:FB,fontStyle:"italic",marginBottom:16,opacity:0.75}}>
              {q.reviewAnswered} <span style={{textDecoration:"line-through"}}>{retrying.userAnswer}</span>
            </p>
          )}
          {retrying.type === "multiple" && (
            <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:20}}>
              {(retrying.choices||[]).map((ch,i) => {
                let bg="transparent",bc=C.border,col=C.text;
                if (revealed) {
                  if (ch === retrying.answer) { bg="rgba(200,168,75,0.12)"; bc=C.gold; col=C.gold2; }
                  else if (ch === chosen)     { bg="rgba(139,58,26,0.15)"; bc=C.red;  col=C.muted; }
                } else if (ch === chosen) { bg="rgba(200,168,75,0.1)"; bc=C.gold; col=C.gold2; }
                return (
                  <button type="button" key={i} onClick={() => !revealed && setChosen(ch)}
                    style={{background:bg,border:`1px solid ${bc}`,borderRadius:4,color:col,fontFamily:FB,fontSize:14,textAlign:"left",padding:"9px 14px",cursor:revealed?"default":"pointer",transition:"all 0.2s"}}>
                    <span style={{fontFamily:FH,fontSize:9,color:C.gold,marginRight:8,opacity:0.7}}>{String.fromCharCode(65+i)}.</span>{ch}
                  </button>
                );
              })}
            </div>
          )}
          {retrying.type === "fill" && (
            <div style={{marginBottom:20}}>
              {retrying.hint && !revealed && (
                <p style={{fontSize:12,color:C.muted,fontStyle:"italic",marginBottom:8}}>Hint: {retrying.hint}</p>
              )}
              <input value={fill} onChange={e => !revealed && setFill(e.target.value)}
                onKeyDown={e => e.key==="Enter" && !revealed && fill.trim() && judgeRetry()}
                disabled={revealed}
                style={{width:"100%",background:"rgba(200,168,75,0.05)",border:`1px solid ${C.border}`,borderRadius:4,padding:"9px 12px",color:C.text,fontFamily:FB,fontSize:15,outline:"none"}} placeholder="..."/>
            </div>
          )}
          {!revealed && (
            <button type="button" onClick={judgeRetry}
              disabled={retrying.type==="multiple" ? !chosen : !fill.trim()}
              style={{background:C.gold,color:"#0e0c07",fontFamily:FH,fontWeight:700,fontSize:11,letterSpacing:"0.15em",padding:"9px 28px",border:"none",borderRadius:2,cursor:"pointer",opacity:(retrying.type==="multiple"?!chosen:!fill.trim())?0.4:1}}>
              {q.judgeBtn}
            </button>
          )}
          {revealed && (()=>{return(
            <div style={{animation:"fadeUp 0.3s ease both"}}>
              <div style={{padding:"10px 14px",borderRadius:4,background:ok?"rgba(200,168,75,0.1)":"rgba(139,58,26,0.12)",border:`1px solid ${ok?C.gold:C.red}`,marginBottom:12}}>
                <span style={{fontFamily:FH,fontSize:12,color:ok?C.gold2:C.red,letterSpacing:"0.1em"}}>
                  {ok ? (streak>=2 ? q.reviewDone : `✦ 1/2 正解 — もう1回正解でマスター`) : q.wrong}
                </span>
                {!ok && <p style={{fontSize:13,color:C.muted,marginTop:4}}>{q.reviewCorrect} <span style={{color:C.sand}}>{retrying.answer}</span></p>}
              </div>
              {retrying.explanation && (
                <p style={{fontSize:13,color:C.muted,fontStyle:"italic",lineHeight:1.7,marginBottom:16,fontFamily:FB}}>{q.expl} {retrying.explanation}</p>
              )}
              <button type="button" onClick={() => setRetrying(null)}
                style={{background:"transparent",border:`1px solid ${C.gold}`,color:C.gold,fontFamily:FH,fontSize:10,letterSpacing:"0.12em",padding:"7px 20px",borderRadius:2,cursor:"pointer"}}>
                {t.back}
              </button>
            </div>
          );})()}
        </GoldCard>
      </div>
    );
  }

  // Fix 7: topic filter (Engineer 7)
  const allTopics = ["all", ...new Set((list||[]).map(x=>x.topic))];
  const filtered = filterTopic==="all" ? list : list.filter(x=>x.topic===filterTopic);
  const pending  = filtered.filter(x => !x.mastered);
  const mastered = filtered.filter(x =>  x.mastered);

  return (
    <div style={{maxWidth:800,margin:"0 auto",padding:"100px 24px 80px"}}>
      <Divider label={q.reviewTitle} sub={q.reviewSub}/>

      {list.length === 0 ? (
        <div style={{textAlign:"center",padding:"60px 0"}}>
          <EyeOfRa size={44} opacity={0.2}/>
          <p style={{marginTop:20,color:C.muted,fontFamily:FB,fontStyle:"italic",fontSize:14}}>{q.reviewEmpty}</p>
        </div>
      ) : (
        <>
          {/* Stats + clear */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:20}}>
            <div style={{display:"flex",gap:20}}>
              <span style={{fontFamily:FH,fontSize:11,color:C.muted,letterSpacing:"0.08em"}}>
                未習得 <span style={{color:C.red,fontWeight:700}}>{list.filter(x=>!x.mastered).length}</span>
              </span>
              <span style={{fontFamily:FH,fontSize:11,color:C.muted,letterSpacing:"0.08em"}}>
                習得済 <span style={{color:C.gold,fontWeight:700}}>{list.filter(x=>x.mastered).length}</span>
              </span>
              <span style={{fontFamily:FH,fontSize:11,color:C.muted,letterSpacing:"0.08em"}}>
                合計 <span style={{color:C.sand2,fontWeight:700}}>{list.length}</span>
              </span>
            </div>
            <button type="button" onClick={clearAll}
              style={{background:"transparent",border:`1px solid rgba(139,58,26,0.5)`,color:C.red,fontFamily:FH,fontSize:9,letterSpacing:"0.1em",padding:"4px 12px",borderRadius:3,cursor:"pointer",opacity:0.7}}>
              {q.reviewClear}
            </button>
          </div>

          {/* Progress bar */}
          <div style={{height:4,borderRadius:2,background:"rgba(200,168,75,0.12)",marginBottom:20,overflow:"hidden"}}>
            <div style={{height:"100%",borderRadius:2,background:C.gold,width:`${(list.filter(x=>x.mastered).length/list.length)*100}%`,transition:"width 0.5s ease"}}/>
          </div>

          {/* Topic filter */}
          {allTopics.length > 2 && (
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:24}}>
              {allTopics.map(tp=>(
                <button type="button" key={tp} onClick={()=>setFilterTopic(tp)}
                  style={{background:filterTopic===tp?"rgba(200,168,75,0.12)":"transparent",border:`1px solid ${filterTopic===tp?C.gold:C.border}`,borderRadius:4,color:filterTopic===tp?C.gold2:C.muted,fontFamily:FH,fontSize:9,letterSpacing:"0.08em",padding:"3px 10px",cursor:"pointer",transition:"all 0.2s"}}>
                  {tp==="all"?"全て":tp}
                </button>
              ))}
            </div>
          )}

          {/* Pending */}
          {pending.length > 0 && (
            <>
              <div style={{fontFamily:FH,fontSize:10,color:C.muted,letterSpacing:"0.12em",marginBottom:12}}>── 未習得 ({pending.length})</div>
              <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:32}}>
                {pending.map((entry,i) => (
                  <GoldCard key={entry.id} style={{padding:"16px 18px",animation:`fadeUp 0.4s ease ${i*0.04}s both`}}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8,flexWrap:"wrap"}}>
                          <span style={{fontSize:9,fontFamily:FH,letterSpacing:"0.07em",padding:"2px 8px",borderRadius:10,border:`1px solid ${C.border}`,color:C.muted}}>{entry.topic}</span>
                          <span style={{fontSize:9,fontFamily:FH,letterSpacing:"0.07em",padding:"2px 8px",borderRadius:10,border:`1px solid ${C.border}`,color:C.muted}}>{entry.diff}</span>
                          <span style={{fontSize:9,color:C.muted}}>{entry.savedAt}</span>
                          {(entry.correctStreak||0)>0&&<span style={{fontSize:9,color:C.gold}}>✦ {entry.correctStreak}/2</span>}
                        </div>
                        <p style={{fontSize:13,color:C.text,lineHeight:1.7,fontFamily:FB,marginBottom:8}}>{entry.question}</p>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                          <span style={{fontSize:11,color:C.muted,fontFamily:FB,fontStyle:"italic"}}>
                            {q.reviewAnswered} <span style={{color:C.red,textDecoration:"line-through"}}>{entry.userAnswer||"—"}</span>
                          </span>
                          <span style={{fontSize:11,color:C.gold,fontFamily:FB}}>→ {entry.answer}</span>
                        </div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
                        <button type="button" onClick={()=>startRetry(entry)}
                          style={{background:C.gold,color:"#0e0c07",fontFamily:FH,fontWeight:700,fontSize:9,letterSpacing:"0.12em",padding:"5px 12px",border:"none",borderRadius:2,cursor:"pointer"}}>
                          {q.reviewRetry}
                        </button>
                        <button type="button" onClick={()=>deleteEntry(entry.id)}
                          style={{background:"transparent",border:`1px solid rgba(139,58,26,0.4)`,color:C.red,fontFamily:FH,fontSize:9,letterSpacing:"0.08em",padding:"4px 12px",borderRadius:2,cursor:"pointer",opacity:0.7}}>
                          {q.reviewDelete}
                        </button>
                      </div>
                    </div>
                  </GoldCard>
                ))}
              </div>
            </>
          )}

          {/* Mastered */}
          {mastered.length > 0 && (
            <>
              <div style={{fontFamily:FH,fontSize:10,color:C.gold,letterSpacing:"0.12em",marginBottom:12,opacity:0.7}}>── 習得済み ({mastered.length}) ✦</div>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {mastered.map((entry,i) => (
                  <div key={entry.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",background:C.surface,border:`1px solid rgba(200,168,75,0.15)`,borderRadius:6,gap:12,animation:`fadeUp 0.4s ease ${i*0.03}s both`}}>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:12,color:C.muted,fontFamily:FB,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{entry.question}</p>
                      <span style={{fontSize:10,color:C.gold,fontFamily:FH,opacity:0.7}}>{entry.answer}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                      <span style={{fontSize:10,color:C.gold,opacity:0.5}}>✦✦</span>
                      <button type="button" onClick={()=>deleteEntry(entry.id)}
                        style={{background:"transparent",border:"none",color:C.muted,fontSize:11,cursor:"pointer",padding:"2px 4px",opacity:0.5}}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

// ─── ARCHIVE PAGE ─────────────────────────────────────────────────────────────
const ArchivePage = ({t}) => {
  const ar=t.archive;
  const [cat,setCat]=useState(0);
  const [detail,setDetail]=useState(null);
  const lists=[ar.pharaohs,ar.gods,ar.sites,ar.treasures,ar.museums,ar.pyramids];
  const items=lists[cat]||[];

  if(detail){
    return (
      <div style={{maxWidth:700,margin:"0 auto",padding:"100px 24px 80px"}}>
        <BackBtn label={t.back} onClick={()=>setDetail(null)}/>
        <div style={{display:"flex",alignItems:"flex-start",gap:18,marginBottom:16}}>
          <span style={{fontSize:40,color:C.gold,lineHeight:1}}>{detail.icon}</span>
          <div>
            <h2 style={{fontFamily:FH,fontWeight:700,fontSize:"clamp(18px,2.8vw,26px)",color:C.sand2,letterSpacing:"0.08em"}}>{detail.name}</h2>
            {detail.sub&&<p style={{fontSize:12,color:C.muted,fontStyle:"italic",marginTop:5}}>{detail.sub}</p>}
          </div>
        </div>
        <div style={{height:1,background:`linear-gradient(to right,${C.gold},transparent)`,margin:"18px 0",opacity:0.25}}/>
        <p style={{fontFamily:FB,fontSize:15,color:C.text,lineHeight:1.9}}>{detail.body}</p>
      </div>
    );
  }

  return (
    <div style={{maxWidth:1080,margin:"0 auto",padding:"100px 24px 80px"}}>
      <Divider label={ar.title} sub={ar.sub}/>
      <TabBar tabs={ar.cats} active={cat} onChange={i=>{setCat(i);setDetail(null);}}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:13}}>
        {items.map((item,i)=>(
          <GoldCard key={item.id} onClick={()=>setDetail(item)} style={{padding:"18px 16px",animation:`fadeUp 0.5s ease ${i*0.04}s both`}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:9}}>
              <span style={{fontSize:22,color:C.gold,opacity:0.85,lineHeight:1}}>{item.icon}</span>
              <div>
                <div style={{fontFamily:FH,fontSize:12,color:C.sand2,letterSpacing:"0.06em"}}>{item.name}</div>
                {item.sub&&<div style={{fontSize:10,color:C.muted,marginTop:2,fontStyle:"italic"}}>{item.sub}</div>}
              </div>
            </div>
            <p style={{fontSize:12,color:C.muted,lineHeight:1.68,fontFamily:FB}}>{item.body.slice(0,72)}…</p>
          </GoldCard>
        ))}
      </div>
    </div>
  );
};

// ─── HOME EXTRA ───────────────────────────────────────────────────────────────
const HomeExtra = ({t,setActive}) => (
  <>
    <section style={{padding:"88px 24px",maxWidth:1080,margin:"0 auto"}}>
      <Divider label={t.themes.title}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:14}}>
        {t.themes.items.map((item,i)=>(
          <GoldCard key={item.id} onClick={()=>setActive("themes")} style={{padding:"20px 18px",animation:`fadeUp 0.6s ease ${i*0.06}s both`}}>
            <div style={{fontSize:20,marginBottom:10,color:C.gold}}>{item.icon}</div>
            <div style={{fontFamily:FH,fontWeight:600,fontSize:12,color:C.sand2,letterSpacing:"0.07em",marginBottom:7}}>{item.label}</div>
            <div style={{fontSize:12,color:C.muted,lineHeight:1.68,fontFamily:FB}}>{item.desc}</div>
          </GoldCard>
        ))}
      </div>
    </section>
    <section style={{padding:"60px 24px 88px"}}>
      <div style={{maxWidth:680,margin:"0 auto",background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"42px 36px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        {[{top:12,left:14},{top:12,right:14},{bottom:12,left:14},{bottom:12,right:14}].map((pos,i)=>(
          <div key={i} style={{position:"absolute",fontSize:20,color:C.gold,opacity:0.06,...pos}}>{["☥","✦","◈","△"][i]}</div>
        ))}
        <h2 style={{fontFamily:FH,fontWeight:700,fontSize:"clamp(16px,2.5vw,22px)",color:C.sand2,letterSpacing:"0.1em",marginBottom:9}}>{t.quiz.title}</h2>
        <p style={{color:C.muted,fontSize:13,marginBottom:24,fontStyle:"italic",fontFamily:FB}}>{t.quiz.sub}</p>
        <button onClick={()=>setActive("quiz")} style={{background:C.gold,color:"#0e0c07",fontFamily:FH,fontWeight:700,fontSize:11,letterSpacing:"0.2em",padding:"11px 40px",border:"none",borderRadius:2,cursor:"pointer",transition:"background 0.25s"}}
          onMouseEnter={e=>e.currentTarget.style.background=C.gold2}
          onMouseLeave={e=>e.currentTarget.style.background=C.gold}>{t.quiz.genBtn}</button>
      </div>
    </section>
  </>
);

const Footer = ({t}) => (
  <footer style={{borderTop:`1px solid ${C.border}`,paddingBottom:28}}>
    <Ticker/>
    <div style={{textAlign:"center",marginTop:18,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
      <EyeOfRa size={16} opacity={0.3}/>
      <span style={{fontFamily:FH,fontSize:10,color:C.muted,letterSpacing:"0.14em"}}>{t.appName} · {t.appSub}</span>
    </div>
  </footer>
);

// ─── Page components defined OUTSIDE App (FIX #5 — prevents unmount on every render)
const HomePage   = ({t,setActive}) => <><Hero t={t} setActive={setActive}/><HomeExtra t={t} setActive={setActive}/></>;

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [lang,setLang]=useState("ja");
  const [active,setActive]=useState("home");
  const [quizTopic,setQuizTopic]=useState(0);
  const t=DATA[lang];

  useEffect(()=>{
    const link=document.createElement("link");
    link.rel="stylesheet";link.href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&display=swap";
    document.head.appendChild(link);
    const style=document.createElement("style");style.textContent=CSS;document.head.appendChild(style);
    return()=>{document.head.removeChild(link);document.head.removeChild(style);};
  },[]);

  useEffect(()=>{window.scrollTo(0,0);},[active]);

  // FIX #5: renderPage is a function call, not a component — no re-mount issue
  const renderPage = () => {
    switch(active){
      case "home":     return <HomePage t={t} setActive={setActive}/>;
      case "themes":   return <ThemesPage t={t} setActive={setActive} setQuizTopic={setQuizTopic}/>;
      case "timeline": return <TimelinePage t={t}/>;
      case "quiz":     return <QuizPage t={t} initialTopic={quizTopic}/>;
      case "archive":  return <ArchivePage t={t}/>;
      case "review":   return <ReviewPage t={t}/>;
      default:         return <HomePage t={t} setActive={setActive}/>;
    }
  };

  return (
    <div style={{minHeight:"100vh",background:"#0e0c07"}}>
      <Nav t={t} lang={lang} setLang={setLang} active={active} setActive={setActive}/>
      <main>{renderPage()}</main>
      <Footer t={t}/>
    </div>
  );
}

// ─── Mount ───────────────────────────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
if (typeof window.__hideSplash === "function") {
  setTimeout(window.__hideSplash, 400);
}

