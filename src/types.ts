export type Service = {
  id: string;
  name: string;
  price: string;
  duration: string;
  description: string;
  iconName: 'Scissors' | 'Wand2' | 'BadgeCheck' | 'Sparkles' | 'Clock3' | 'MapPin' | 'Flame' | 'Crown';
};

export type GalleryItem = {
  id: string;
  src: string;
  alt: string;
  title?: string;
};

export type BarbershopConfig = {
  name: string;
  subname: string;
  tagline: string;
  sinceYear: string;
  whatsappNumber: string;
  phoneDisplay: string;
  instagramUrl: string;
  instagramHandle: string;
  address: string;
  addressComplement: string;
  neighborhood: string;
  city: string;
  openingDays: string;
  openingHours: string;
  googleMapsUrl: string;
  services: Service[];
  timeSlots: string[];
  gallery: GalleryItem[];
};
