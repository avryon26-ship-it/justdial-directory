import type { Category } from "../types";
import { slugify } from "../slug";

export interface CategoryDef {
  name: string;
  icon: string;
  popular?: boolean;
  suffixes: string[];
  services: string;
}

export const CATEGORY_DEFS: CategoryDef[] = [
  { name: "Accountants", icon: "calculator", suffixes: ["Associates", "& Co. Chartered Accountants", "Tax Consultants"], services: "tax filing, GST returns and bookkeeping" },
  { name: "Advocates", icon: "scale", suffixes: ["Law Chambers", "Legal Associates", "Advocates"], services: "civil, property and family legal advice" },
  { name: "Architects", icon: "ruler", suffixes: ["Design Studio", "Architects", "Building Planners"], services: "house plans, approvals and site supervision" },
  { name: "Automobiles", icon: "car", popular: true, suffixes: ["Motors", "Auto Sales", "Two Wheeler Showroom"], services: "new and pre-owned vehicle sales and finance" },
  { name: "Bakeries", icon: "cake", popular: true, suffixes: ["Bakery", "Bakes", "Sweets and Bakery"], services: "fresh cakes, breads, snacks and festival orders" },
  { name: "Beauty Parlours", icon: "sparkle", popular: true, suffixes: ["Beauty Parlour", "Unisex Salon", "Bridal Studio"], services: "hair, skin care and bridal makeup" },
  { name: "Book Stores", icon: "book", suffixes: ["Book House", "Books and Stationery", "Book Centre"], services: "textbooks, novels, stationery and exam guides" },
  { name: "Car Repair", icon: "wrench", popular: true, suffixes: ["Auto Care", "Car Service Centre", "Garage"], services: "servicing, denting, painting and breakdown help" },
  { name: "Caterers", icon: "utensils", suffixes: ["Caterers", "Catering Services", "Event Kitchen"], services: "wedding, party and corporate catering" },
  { name: "Coaching Centres", icon: "cap", suffixes: ["Academy", "Coaching Centre", "Tuition Centre"], services: "school tuition and competitive exam coaching" },
  { name: "Computer Training", icon: "laptop", suffixes: ["Computer Institute", "IT Training Centre", "Tech Academy"], services: "office skills, programming and design courses" },
  { name: "Dentists", icon: "tooth", popular: true, suffixes: ["Dental Clinic", "Dental Care", "Smile Dental Hospital"], services: "check-ups, cleaning, braces and implants" },
  { name: "Doctors", icon: "stethoscope", popular: true, suffixes: ["Clinic", "Family Clinic", "Medical Centre"], services: "general consultation, health check-ups and follow-up care" },
  { name: "Driving Schools", icon: "wheel", suffixes: ["Driving School", "Motor Driving Academy", "Driving Institute"], services: "car and two-wheeler driving lessons and licence help" },
  { name: "Electricians", icon: "bolt", popular: true, suffixes: ["Electricals", "Electrical Works", "Power Services"], services: "wiring, repairs, inverters and fittings" },
  { name: "Electronics", icon: "tv", suffixes: ["Electronics", "Home Appliances", "Digital World"], services: "televisions, refrigerators and home appliances" },
  { name: "Furniture", icon: "sofa", suffixes: ["Furniture Mart", "Wood Works", "Home Furnishings"], services: "custom furniture, sofas, beds and repairs" },
  { name: "Gyms", icon: "dumbbell", suffixes: ["Fitness Studio", "Gym", "Fitness Club"], services: "strength training, cardio and personal coaching" },
  { name: "Hardware Stores", icon: "hammer", suffixes: ["Hardware", "Traders", "Building Materials"], services: "tools, paints, pipes and building materials" },
  { name: "Hospitals", icon: "hospital", popular: true, suffixes: ["Hospital", "Multispeciality Hospital", "Nursing Home"], services: "emergency care, surgery and inpatient services" },
  { name: "Hotels", icon: "bed", popular: true, suffixes: ["Residency", "Inn", "Lodge"], services: "comfortable rooms, family stays and event halls" },
  { name: "Insurance Agents", icon: "shield", suffixes: ["Insurance Services", "Financial Advisors", "Policy Point"], services: "life, health and vehicle insurance guidance" },
  { name: "Interior Designers", icon: "palette", suffixes: ["Interiors", "Design Works", "Home Interiors"], services: "modular kitchens, wardrobes and full-home interiors" },
  { name: "Jewellers", icon: "diamond", popular: true, suffixes: ["Jewellers", "Gold House", "Jewellery Mart"], services: "gold, silver and diamond jewellery" },
  { name: "Kids Wear", icon: "shirt", suffixes: ["Kids Boutique", "Little Ones", "Kids Corner"], services: "clothing and accessories for babies and children" },
  { name: "Laundry", icon: "drop", suffixes: ["Laundry", "Dry Cleaners", "Wash and Iron"], services: "washing, ironing, dry cleaning and pickup" },
  { name: "Mobile Shops", icon: "phone", suffixes: ["Mobiles", "Cell Point", "Mobile Hub"], services: "new phones, accessories and quick repairs" },
  { name: "Music Classes", icon: "music", suffixes: ["Music Academy", "Fine Arts School", "Sruthi School of Music"], services: "vocal, violin, keyboard and dance lessons" },
  { name: "Nursing Homes", icon: "heart", suffixes: ["Nursing Home", "Maternity Centre", "Care Centre"], services: "maternity, post-surgery and elder care" },
  { name: "Opticals", icon: "eye", popular: true, suffixes: ["Opticals", "Eye Care", "Vision Centre"], services: "eye tests, spectacles and contact lenses" },
  { name: "Packers and Movers", icon: "truck", suffixes: ["Packers and Movers", "Relocation Services", "Cargo Movers"], services: "home shifting, packing and local transport" },
  { name: "Pharmacies", icon: "pill", popular: true, suffixes: ["Medicals", "Pharmacy", "Medical Store"], services: "prescription medicines and health supplies" },
  { name: "Photographers", icon: "camera", suffixes: ["Photography", "Studio", "Wedding Films"], services: "weddings, portraits, events and album design" },
  { name: "Plumbers", icon: "pipe", popular: true, suffixes: ["Plumbing Works", "Plumbers", "Pipe Care"], services: "leak repairs, bathroom fittings and water tanks" },
  { name: "Printing Press", icon: "printer", suffixes: ["Printers", "Offset Press", "Digital Prints"], services: "visiting cards, flex banners, invitations and notebooks" },
  { name: "Real Estate", icon: "home", suffixes: ["Realtors", "Properties", "Land and Homes"], services: "plots, apartments and rental properties" },
  { name: "Restaurants", icon: "utensils", popular: true, suffixes: ["Restaurant", "Mess", "Family Restaurant"], services: "meals, biryani, tiffin and family dining" },
  { name: "Schools", icon: "school", popular: true, suffixes: ["Matriculation School", "Public School", "International School"], services: "primary and secondary education" },
  { name: "Supermarkets", icon: "cart", suffixes: ["Super Market", "Fresh Mart", "Provision Store"], services: "groceries, vegetables and household needs" },
  { name: "Tailors", icon: "needle", popular: true, suffixes: ["Tailors", "Boutique", "Designer Studio"], services: "custom stitching, alterations and blouse designs" },
  { name: "Travel Agents", icon: "plane", suffixes: ["Tours and Travels", "Travel Desk", "Holidays"], services: "bus, train, flight tickets and tour packages" },
  { name: "Upholstery", icon: "sofa", suffixes: ["Upholstery Works", "Sofa Makers", "Cushion Works"], services: "sofa, car seat and curtain work" },
  { name: "Veterinary", icon: "paw", suffixes: ["Pet Clinic", "Veterinary Hospital", "Animal Care"], services: "pet and livestock treatment and vaccination" },
  { name: "Wedding Halls", icon: "hall", suffixes: ["Kalyana Mandapam", "Convention Hall", "Marriage Hall"], services: "weddings, receptions and functions with parking" },
  { name: "Yoga Centres", icon: "lotus", suffixes: ["Yoga Centre", "Yoga Studio", "Wellness Centre"], services: "yoga, meditation and wellness classes" },
];

export function buildCategories(): Category[] {
  return CATEGORY_DEFS.map((c, i) => ({
    id: `c-${slugify(c.name)}`,
    name: c.name,
    slug: slugify(c.name),
    slugHistory: [],
    order: i + 1,
    icon: c.icon,
    popular: !!c.popular,
  }));
}
