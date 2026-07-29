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

export function withCurrentOption(options: string[], current: string): string[] {
  if (!current.trim()) return options
  if (options.includes(current)) return options
  return [current, ...options]
}
