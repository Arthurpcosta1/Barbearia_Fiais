import { BarbershopConfig } from '../types';

export const initialBarbershopConfig: BarbershopConfig = {
  name: 'Barbearia',
  subname: 'Fiais',
  tagline: '',
  sinceYear: '2018',
  whatsappNumber: '558199571999',
  phoneDisplay: '(81) 9957-1999',
  instagramUrl: 'https://instagram.com/barbeariafiais',
  instagramHandle: '@barbeariafiais',
  address: 'Sítio São Braz, 130',
  addressComplement: '',
  neighborhood: 'Sítio dos Pintos',
  city: 'Recife - PE',
  openingDays: 'Segunda a Sábado',
  openingHours: '09:00 às 19:00',
  googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=S%C3%ADtio%20S%C3%A3o%20Braz%2C%20130%20-%20S%C3%ADtio%20dos%20Pintos%2C%20Recife',
  adminPin: '1999',
  services: [
    {
      id: 'cabelo',
      name: 'Cabelo',
      price: 'R$ 35,00',
      duration: '45 min',
      description: 'Corte alinhado e finalização',
      iconName: 'Scissors',
    },
    {
      id: 'barba',
      name: 'Barba',
      price: 'R$ 30,00',
      duration: '35 min',
      description: 'Barba alinhada com toalha quente e navalha',
      iconName: 'Wand2',
    },
    {
      id: 'combo',
      name: 'Combo Cabelo + Barba',
      price: 'R$ 50,00',
      duration: '1h 15min',
      description: 'Atendimento completo no mesmo horário',
      iconName: 'BadgeCheck',
    },
    {
      id: 'barboterapia',
      name: 'Barboterapia',
      price: 'R$ 45,00',
      duration: '50 min',
      description: 'Tratamento relaxante para pele e barba',
      iconName: 'Sparkles',
    },
    {
      id: 'acabamento',
      name: 'Pezinho / Acabamento',
      price: 'R$ 20,00',
      duration: '20 min',
      description: 'Contornos e laterais na navalha',
      iconName: 'Clock3',
    },
    {
      id: 'sobrancelhas',
      name: 'Sobrancelha',
      price: 'R$ 15,00',
      duration: '15 min',
      description: 'Limpeza discreta e desenho alinhado no visagismo masculino.',
      iconName: 'MapPin',
    },
  ],
  timeSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
  gallery: [
    {
      id: 'foto-1',
      src: '/images/baiano1.jpeg',
      alt: 'Corte degradado com risca lateral feito na Barbearia Fiais',
      title: 'Degradê & Risco',
    },
    {
      id: 'foto-2',
      src: '/images/baiano2.jpeg',
      alt: 'Corte alto modelado feito na Barbearia Fiais',
      title: 'Fade Alto Modelado',
    },
    {
      id: 'foto-3',
      src: '/images/baiano3.jpeg',
      alt: 'Cabelo e barba alinhados na Barbearia Fiais',
      title: 'Combo Cabelo e Barba',
    },
  ],
};

const STORAGE_KEY = 'barbearia_fiais_config_v2';

export function loadBarbershopConfig(): BarbershopConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...initialBarbershopConfig,
        ...parsed,
        // Always ensure phone number is updated if it was the old default
        whatsappNumber: (!parsed.whatsappNumber || parsed.whatsappNumber === '5585999999999') ? '558199571999' : parsed.whatsappNumber,
        phoneDisplay: (!parsed.phoneDisplay || parsed.phoneDisplay === '(85) 99999-9999') ? '(81) 9957-1999' : parsed.phoneDisplay,
        tagline: '',
        adminPin: parsed.adminPin || initialBarbershopConfig.adminPin || '1999',
        services: Array.isArray(parsed.services) && parsed.services.length > 0 ? parsed.services : initialBarbershopConfig.services,
        timeSlots: Array.isArray(parsed.timeSlots) && parsed.timeSlots.length > 0 ? parsed.timeSlots : initialBarbershopConfig.timeSlots,
        gallery: Array.isArray(parsed.gallery) && parsed.gallery.length > 0 ? parsed.gallery : initialBarbershopConfig.gallery,
      };
    }
  } catch (e) {
    console.error('Failed to parse saved config from localStorage', e);
  }
  return initialBarbershopConfig;
}

export function saveBarbershopConfig(config: BarbershopConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config to localStorage', e);
  }
}

export function resetBarbershopConfig(): BarbershopConfig {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('barbearia_fiais_config_v1');
  } catch (e) {
    console.error('Failed to reset config in localStorage', e);
  }
  return initialBarbershopConfig;
}

export function cleanPhoneForWhatsApp(phone: string): string {
  const numbersOnly = phone.replace(/\D/g, '');
  if (!numbersOnly) return '558199571999';
  if (numbersOnly.length === 10 || numbersOnly.length === 11) {
    return `55${numbersOnly}`;
  }
  return numbersOnly;
}

export function buildWhatsAppBookingLink(
  whatsappNumber: string,
  serviceName: string,
  servicePrice: string,
  timeSlot: string,
  dateText: string = 'Amanhã',
  clientName?: string
): string {
  const cleanNumber = cleanPhoneForWhatsApp(whatsappNumber);
  const lines: string[] = [
    '*Novo Agendamento - Barbearia Fiais*',
    ''
  ];

  if (clientName && clientName.trim()) {
    lines.push(`*Cliente:* ${clientName.trim()}`);
  }

  lines.push(`*Serviço:* ${serviceName} (${servicePrice})`);
  lines.push(`*Dia:* ${dateText}`);
  lines.push(`*Horário:* ${timeSlot}`);
  lines.push('');
  lines.push('Olá! Gostaria de confirmar este agendamento.');

  const message = lines.join('\n');
  return `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;
}

export function buildGenericWhatsAppLink(whatsappNumber: string, customMessage?: string): string {
  const cleanNumber = cleanPhoneForWhatsApp(whatsappNumber);
  const message = customMessage || 'Olá! Gostaria de agendar um horário na Barbearia Fiais.';
  return `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;
}
