export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-CM', { style: 'decimal', maximumFractionDigits: 0 }).format(price) + ' FCFA';
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-CM', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateStr));
}

export function getInitials(firstName: string | undefined, lastName: string | undefined): string {
  if (!firstName && !lastName) return '?';
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return `${first}${last}` || '?';
}

export function isShopOpenNow(hours: import('../types').ShopHours): boolean {
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const dayKey = days[now.getDay()];
  const dayHours = hours[dayKey];
  if (dayHours.is_closed || !dayHours.opening_time || !dayHours.closing_time) return false;
  const [oh, om] = dayHours.opening_time.split(':').map(Number);
  const [ch, cm] = dayHours.closing_time.split(':').map(Number);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= oh * 60 + om && nowMinutes <= ch * 60 + cm;
}

export function buildWhatsAppUrl(phone: string, productName: string, price: number, shopName: string): string {
  const msg = encodeURIComponent(`Bonjour ! Je suis intéressé(e) par "${productName}" à ${formatPrice(price)} chez ${shopName}. Est-ce toujours disponible ?`);
  return `https://wa.me/${phone}?text=${msg}`;
}
