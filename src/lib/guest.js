import { defaultData } from '../data/defaults'

export function readVisit(key, fallback) {
  try { return JSON.parse(sessionStorage.getItem(`kc-visit-${key}`)) ?? fallback } catch { return fallback }
}
export function saveVisit(key, value) {
  try { sessionStorage.setItem(`kc-visit-${key}`, JSON.stringify(value)) } catch { /* Browsing also works without storage. */ }
}

export const copy = {
  en: {
    menu: 'Menu',
    welcome: 'A little Beirut.', warmth: 'A world of warmth.', welcomeText: 'Pull up a chair. The finest moments are shared at the table.',
    enter: 'View the menu', since: 'Since', dine: 'At your table', intro: 'A little tradition. Something to savour.',
    all: 'All', categories: 'Browse categories', search: 'Find something delicious', clear: 'Clear search',
    story: 'Our story', info: 'About your visit', close: 'Close', details: 'View', favourite: 'A house favourite',
    veg: 'Vegetarian', vegan: 'Vegan', gf: 'Gluten free', spicy: 'Spicy', unavailable: 'Currently unavailable',
    browse: 'Explore the menu',
    nothing: 'Nothing on the table just yet.', noResults: 'No dishes found', tryAgain: 'Try another name or explore the whole menu.',
    preparing: 'Our menu is being prepared. Please ask our team for today’s dishes.', results: 'dishes found',
    allergy: 'Allergies & dietary needs', allergyText: 'Please let your waiter know about any allergies or dietary requirements before ordering.',
    service: 'Take your time. We’ll take your order.', serviceText: 'Your waiter is here to help with ingredients, preferences and a little inspiration.',
    return: 'Back to the menu', discover: 'The story of our table', read: 'A little more of our story', less: 'Read less',
    hours: 'Opening hours', location: 'Find us here', signature: 'Lebanese soul. Timeless hospitality.',
    imageMissing: 'Prepared with care',
    dietary: 'Dietary information', availableHelp: 'Our team can help you choose something else.',
  },
  ar: {
    menu: 'القائمة',
    welcome: 'قليل من بيروت.', warmth: 'عالم من الدفء.', welcomeText: 'تفضّل إلى طاولتنا. أجمل اللحظات نتشاركها معاً.',
    enter: 'تصفّح القائمة', since: 'منذ', dine: 'على طاولتك', intro: 'قليل من التراث. والكثير من الطعم.',
    all: 'الكل', categories: 'تصفّح الأقسام', search: 'ابحث عن طبق تحبّه', clear: 'مسح البحث',
    story: 'حكايتنا', info: 'عن زيارتك', close: 'إغلاق', details: 'عرض', favourite: 'من أطباقنا المفضّلة',
    veg: 'نباتي', vegan: 'نباتي صرف', gf: 'خالٍ من الغلوتين', spicy: 'حار', unavailable: 'غير متوفّر حالياً',
    browse: 'تصفّح القائمة',
    nothing: 'نحضّر طاولتك بكلّ محبّة.', noResults: 'لم نجد أطباقاً', tryAgain: 'جرّب اسماً آخر أو تصفّح القائمة كاملة.',
    preparing: 'نحضّر قائمتنا. اسأل فريقنا عن أطباق اليوم.', results: 'أطباق مطابقة',
    allergy: 'الحساسية والاحتياجات الغذائية', allergyText: 'أخبر النادل عن أي حساسية أو احتياجات غذائية قبل الطلب.',
    service: 'خذ وقتك. نحن هنا لخدمتك.', serviceText: 'يساعدك النادل في معرفة المكوّنات واختيار ما يناسب ذوقك.',
    return: 'العودة إلى القائمة', discover: 'حكاية طاولتنا', read: 'المزيد من حكايتنا', less: 'عرض أقل',
    hours: 'ساعات العمل', location: 'موقعنا', signature: 'روح لبنانية. ضيافة لا يغيّرها الزمن.',
    imageMissing: 'محضّر بعناية',
    dietary: 'معلومات غذائية', availableHelp: 'يساعدك فريقنا في اختيار طبق آخر.',
  },
}
const arabicSections = { manakish: ['مناقيش', 'من الفرن'], breakfast: ['فطور', 'طوال اليوم'], coffee: ['قهوة', 'على مهل'], desserts: ['حلويات', 'ختام حلو'] }
const arabicDescriptions = {
  zaatar: 'زعتر بريّ وزيت زيتون بكر وسماق على عجينتنا الطازجة كل يوم.',
  akawi: 'جبنة عكاوي خفيفة، مخبوزة حتى تذوب وتصبح ذهبية على عجينة طريّة بأطراف مقرمشة.',
  labneh: 'لبنة بلدية ناعمة مع زيت زيتون ونعناع وخبز دافئ إلى جانبها.',
  hummus: 'حمّص كريمي مع طحينة وليمون وزيت زيتون، يزيّنه البقدونس والبابريكا.',
  'turkish-coffee': 'قهوة داكنة مطحونة ناعماً، محضّرة على مهل وتُقدّم على الطريقة التقليدية.',
  baklava: 'رقائق عجين مقرمشة وفستق حلبي وقطر معطّر بماء الزهر.',
}
export function dishText(item, language) {
  const original = defaultData.items.find(dish => dish.id === item.id)
  return {
    title: language === 'ar' && item.arabic ? item.arabic : item.title,
    secondary: language === 'ar' ? (item.arabic ? item.title : '') : item.arabic,
    description: language === 'ar' ? item.descriptionArabic || (original?.description === item.description && arabicDescriptions[item.id]) || item.description : item.description,
  }
}
export function sectionText(section, language) {
  const original = defaultData.sections.find(s => s.id === section.id)
  return language === 'ar' ? {
    name: section.arabic || (original?.name === section.name && arabicSections[section.id]?.[0]) || section.name,
    eyebrow: section.eyebrowArabic || (original?.eyebrow === section.eyebrow && arabicSections[section.id]?.[1]) || section.eyebrow,
  } : section
}
export function settingText(settings, key, language) {
  if (language !== 'ar') return settings[key]
  if (settings[`${key}Arabic`]) return settings[`${key}Arabic`]
  if (settings[key] !== defaultData.settings[key]) return settings[key]
  return {
    menuTitle: 'من مطبخنا، بكلّ محبّة.', storyTitle: 'قليل من التراث.\nوالكثير من القلب.',
    storyText: 'بدأت قهوة الشيخ بوعد بسيط: أطباق لبنانية صادقة، وضيافة دافئة، وقهوة تُسكب على مهل. ما زلنا نخبز عجينتنا كل صباح ونستقبل كل ضيف كصديق قديم.',
    branch: 'الأشرفية، بيروت', hours: 'يومياً · ٧:٠٠–٢٣:٠٠', welcomeSince: 'منذ ١٩٩٨', menuNote: copy.ar.allergyText,
  }[key] || settings[key]
}
