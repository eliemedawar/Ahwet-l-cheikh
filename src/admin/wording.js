import { copyKeys } from '../lib/guest'

/**
 * How the wording editor groups and labels the built-in strings. Keys are
 * grouped for browsing only — any key missing from this map still gets an
 * editor, under "Everything else", so nothing on the storefront is unreachable.
 */
const GROUPS = [
  {
    title: 'Welcome screen',
    hint: 'the full-screen intro guests land on',
    keys: {
      welcome: ['Headline, line 1', 'large serif'],
      warmth: ['Headline, line 2', 'shown in gold'],
      welcomeText: ['Paragraph', ''],
      signature: ['Signature line', 'under the button'],
      enter: ['Button label', 'used when the Content tab button label is blank'],
      languageSwitch: ['Language button', 'names the language it switches to'],
      languageSwitchShort: ['Language button, short', 'the one in the menu header'],
    },
  },
  {
    title: 'Menu page',
    hint: 'headings, chips and search',
    keys: {
      menu: ['Menu', 'sheet title and skip link'],
      dine: ['Eyebrow above the heading', ''],
      intro: ['Intro line', ''],
      brandLocation: ['City beside the year', 'under the logo, header and footer'],
      all: ['“All” chip', ''],
      categories: ['Browse categories', 'button label'],
      wholeMenu: ['“The whole menu” row', 'in the categories sheet'],
      search: ['Search placeholder', ''],
      clear: ['Clear search', ''],
      results: ['Results suffix', 'follows the number found'],
    },
  },
  {
    title: 'Dishes',
    hint: 'cards, badges and the dish sheet',
    keys: {
      details: ['“View” label', 'read out by screen readers'],
      favourite: ['Featured badge', ''],
      featuredExplore: ['Featured teaser', 'the link under the featured dish'],
      veg: ['Vegetarian badge', ''],
      vegan: ['Vegan badge', ''],
      gf: ['Gluten free badge', ''],
      spicy: ['Spicy badge', ''],
      unavailable: ['Sold out badge', ''],
      availableHelp: ['Sold out help text', ''],
      dietary: ['Dietary information', ''],
      imageMissing: ['Missing photo caption', 'shown if a photo fails to load'],
    },
  },
  {
    title: 'When there is nothing to show',
    hint: 'empty menu and empty search',
    keys: {
      nothing: ['Empty menu heading', ''],
      preparing: ['Empty menu text', ''],
      noResults: ['No search results heading', ''],
      tryAgain: ['No search results text', ''],
      browse: ['Back to browsing button', ''],
    },
  },
  {
    title: 'Service & allergies',
    hint: 'the notes guests tap for reassurance',
    keys: {
      allergy: ['Allergy heading', ''],
      allergyText: ['Allergy text', ''],
      service: ['Service heading', ''],
      serviceText: ['Service text', ''],
    },
  },
  {
    title: 'Our story',
    hint: 'the about block and its photo',
    keys: {
      story: ['Story link label', ''],
      discover: ['Eyebrow', ''],
      read: ['Expand link', ''],
      less: ['Collapse link', ''],
      storyPhotoAlt: ['Photo description', 'for screen readers'],
      storyPhotoCity: ['Photo caption city', ''],
    },
  },
  {
    title: 'About your visit',
    hint: 'the info sheet',
    keys: {
      info: ['Sheet title', ''],
      location: ['Location heading', ''],
      hours: ['Opening hours heading', ''],
      since: ['“Since” word', ''],
      close: ['Close button', ''],
      return: ['Back to the menu', ''],
    },
  },
]

const claimed = new Set(GROUPS.flatMap((group) => Object.keys(group.keys)))

/** The groups above, plus a catch-all so every key in `copy` is editable. */
export const wordingGroups = [
  ...GROUPS.map((group) => ({
    title: group.title,
    hint: group.hint,
    fields: Object.entries(group.keys).map(([key, [label, hint]]) => ({ key, label, hint })),
  })),
  ...(() => {
    const rest = copyKeys.filter((key) => !claimed.has(key))
    return rest.length
      ? [{ title: 'Everything else', hint: 'not yet grouped', fields: rest.map((key) => ({ key, label: key, hint: '' })) }]
      : []
  })(),
]

/** Long strings get a textarea rather than a single line. */
export const isLongText = (defaultValue) => String(defaultValue || '').length > 44
