/** Cascading India location options for school forms. */
export const INDIA_LOCATIONS: Record<
  string,
  Record<string, string[]>
> = {
  'Andhra Pradesh': {
    'Anantapur': ['Anantapur', 'Hindupur', 'Guntakal'],
    'Chittoor': ['Chittoor', 'Tirupati', 'Madanapalle'],
    'East Godavari': ['Kakinada', 'Rajahmundry', 'Amalapuram'],
    'Guntur': ['Guntur', 'Tenali', 'Narasaraopet'],
    'Krishna': ['Vijayawada', 'Machilipatnam', 'Gudivada'],
    'Kurnool': ['Kurnool', 'Nandyal', 'Adoni'],
    'Nellore': ['Nellore', 'Kavali', 'Gudur'],
    'Prakasam': ['Ongole', 'Chirala', 'Markapur'],
    'Srikakulam': ['Srikakulam', 'Amadalavalasa', 'Palasa'],
    'Visakhapatnam': ['Visakhapatnam', 'Anakapalle', 'Bheemunipatnam'],
    'Vizianagaram': ['Vizianagaram', 'Bobbili', 'Parvathipuram'],
    'West Godavari': [
      'Eluru',
      'Bhimavaram',
      'Tadepalligudem',
      'Narasapuram',
      'Palakollu',
    ],
    'YSR Kadapa': ['Kadapa', 'Proddatur', 'Rajampet'],
  },
  'Telangana': {
    'Hyderabad': ['Hyderabad', 'Secunderabad', 'Kukatpally'],
    'Rangareddy': ['Shamshabad', 'Ibrahimpatnam', 'Chevella'],
    'Medchal Malkajgiri': ['Kompally', 'Alwal', 'Uppal'],
    'Warangal': ['Warangal', 'Hanamkonda', 'Kazipet'],
    'Karimnagar': ['Karimnagar', 'Jagtial', 'Huzurabad'],
    'Nizamabad': ['Nizamabad', 'Bodhan', 'Armoor'],
    'Khammam': ['Khammam', 'Kothagudem', 'Sathupalli'],
    'Mahabubnagar': ['Mahabubnagar', 'Narayanpet', 'Jadcherla'],
  },
  'Karnataka': {
    'Bengaluru Urban': ['Bengaluru', 'Whitefield', 'Yelahanka'],
    'Bengaluru Rural': ['Devanahalli', 'Doddaballapur', 'Nelamangala'],
    'Mysuru': ['Mysuru', 'Nanjangud', 'Hunsur'],
    'Mangaluru': ['Mangaluru', 'Ullal', 'Bantwal'],
    'Belagavi': ['Belagavi', 'Gokak', 'Athani'],
    'Hubballi-Dharwad': ['Hubballi', 'Dharwad', 'Navalgund'],
    'Kalaburagi': ['Kalaburagi', 'Sedam', 'Aland'],
    'Ballari': ['Ballari', 'Hospet', 'Sandur'],
  },
  'Tamil Nadu': {
    'Chennai': ['Chennai', 'Tambaram', 'Avadi'],
    'Coimbatore': ['Coimbatore', 'Pollachi', 'Mettupalayam'],
    'Madurai': ['Madurai', 'Melur', 'Thirumangalam'],
    'Tiruchirappalli': ['Tiruchirappalli', 'Srirangam', 'Lalgudi'],
    'Salem': ['Salem', 'Attur', 'Mettur'],
    'Tirunelveli': ['Tirunelveli', 'Palayamkottai', 'Ambasamudram'],
  },
  'Maharashtra': {
    'Mumbai City': ['Mumbai', 'Colaba', 'Fort'],
    'Mumbai Suburban': ['Andheri', 'Bandra', 'Borivali'],
    'Pune': ['Pune', 'Pimpri-Chinchwad', 'Hinjewadi'],
    'Nagpur': ['Nagpur', 'Kamptee', 'Hingna'],
    'Nashik': ['Nashik', 'Malegaon', 'Sinnar'],
    'Thane': ['Thane', 'Kalyan', 'Ulhasnagar'],
  },
  'Delhi': {
    'New Delhi': ['New Delhi', 'Connaught Place', 'Chanakyapuri'],
    'South Delhi': ['Saket', 'Hauz Khas', 'Vasant Kunj'],
    'East Delhi': ['Laxmi Nagar', 'Mayur Vihar', 'Preet Vihar'],
    'West Delhi': ['Janakpuri', 'Rajouri Garden', 'Dwarka'],
    'North Delhi': ['Model Town', 'Civil Lines', 'Kashmere Gate'],
  },
  'Kerala': {
    'Thiruvananthapuram': ['Thiruvananthapuram', 'Neyyattinkara', 'Attingal'],
    'Ernakulam': ['Kochi', 'Aluva', 'Kalamassery'],
    'Kozhikode': ['Kozhikode', 'Feroke', 'Kunnamangalam'],
    'Thrissur': ['Thrissur', 'Guruvayur', 'Chalakudy'],
  },
  'Gujarat': {
    'Ahmedabad': ['Ahmedabad', 'Gandhinagar', 'Sanand'],
    'Surat': ['Surat', 'Bardoli', 'Olpad'],
    'Vadodara': ['Vadodara', 'Dabhoi', 'Padra'],
    'Rajkot': ['Rajkot', 'Gondal', 'Jetpur'],
  },
  'Rajasthan': {
    'Jaipur': ['Jaipur', 'Amber', 'Sanganer'],
    'Jodhpur': ['Jodhpur', 'Phalodi', 'Bilara'],
    'Udaipur': ['Udaipur', 'Fatehnagar', 'Mavli'],
    'Kota': ['Kota', 'Ramganj Mandi', 'Sangod'],
  },
  'Uttar Pradesh': {
    'Lucknow': ['Lucknow', 'Bakshi Ka Talab', 'Mohanlalganj'],
    'Kanpur Nagar': ['Kanpur', 'Bilhaur', 'Ghatampur'],
    'Varanasi': ['Varanasi', 'Ramnagar', 'Pindra'],
    'Agra': ['Agra', 'Fatehabad', 'Kiraoli'],
    'Ghaziabad': ['Ghaziabad', 'Loni', 'Modinagar'],
    'Noida': ['Noida', 'Greater Noida', 'Dadri'],
  },
  'West Bengal': {
    'Kolkata': ['Kolkata', 'Howrah', 'Salt Lake'],
    'North 24 Parganas': ['Barasat', 'Barrackpore', 'Bidhannagar'],
    'South 24 Parganas': ['Alipore', 'Diamond Harbour', 'Budge Budge'],
    'Darjeeling': ['Darjeeling', 'Siliguri', 'Kurseong'],
  },
}

export function getStates(): string[] {
  return Object.keys(INDIA_LOCATIONS).sort()
}

export function getDistricts(state: string): string[] {
  const districts = INDIA_LOCATIONS[state]
  return districts ? Object.keys(districts).sort() : []
}

export function getCities(state: string, district: string): string[] {
  const cities = INDIA_LOCATIONS[state]?.[district]
  return cities ? [...cities].sort() : []
}

/** All cities across districts for a state (deduped). */
export function getCitiesInState(state: string): string[] {
  const districts = INDIA_LOCATIONS[state]
  if (!districts) return []
  const set = new Set<string>()
  for (const cities of Object.values(districts)) {
    for (const city of cities) set.add(city)
  }
  return [...set].sort()
}

export function withCurrentOption(options: string[], current: string): string[] {
  if (!current.trim()) return options
  if (options.includes(current)) return options
  return [current, ...options]
}

function normalizeLocationKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Best-effort match of a Google Places state name to INDIA_LOCATIONS. */
export function matchStateOption(googleState?: string | null): string {
  const raw = googleState?.trim()
  if (!raw) return ''
  const states = getStates()
  const exact = states.find(
    (s) => s.toLowerCase() === raw.toLowerCase(),
  )
  if (exact) return exact

  const needle = normalizeLocationKey(raw)
  const contains = states.find((s) => {
    const key = normalizeLocationKey(s)
    return key.includes(needle) || needle.includes(key)
  })
  return contains ?? ''
}

/**
 * Match Google district/city to a catalog district under the given state.
 * Falls back to city name when district is missing or mismatched.
 */
export function matchDistrictOption(
  state: string,
  googleDistrict?: string | null,
  googleCity?: string | null,
): string {
  if (!state.trim()) return ''
  const districts = getDistricts(state)
  if (districts.length === 0) return ''

  const candidates = [googleDistrict, googleCity]
    .map((v) => v?.trim())
    .filter((v): v is string => Boolean(v))

  for (const raw of candidates) {
    const exact = districts.find(
      (d) => d.toLowerCase() === raw.toLowerCase(),
    )
    if (exact) return exact
  }

  for (const raw of candidates) {
    const needle = normalizeLocationKey(raw)
    const fuzzy = districts.find((d) => {
      const key = normalizeLocationKey(d)
      return key.includes(needle) || needle.includes(key)
    })
    if (fuzzy) return fuzzy
  }

  return ''
}

