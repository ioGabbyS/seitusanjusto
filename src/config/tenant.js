/*
  CONFIGURACION HARDCODED - SAN JUSTO
  Este archivo ignora las variables de entorno para evitar errores de despliegue.
*/

export const tenant = {
    shortName: 'SAN JUSTO',
    location: 'San Justo',
    franchiseName: 'Sei Tu San Justo',
    address: 'Av. Pte. Dr. A. U. Illia 2467',
    city: 'San Justo, Provincia de Buenos Aires',
    domain: 'seitusanjusto.vercel.app',
    systemName: 'SeiTu San Justo',
    navLogo: '/logosanjusto.png',
    mainLogo: '/sanjusto2.png',
    titleSize: 'text-5xl sm:text-7xl',
    establishedYear: '2026',
    adminEmail: 'seitusanjusto@gmail.com',
    social: {
        instagram: 'seitu_san_justo',
        tiktok: 'seitu_san_justo',
        facebook: 'seitu_san_justo',
        whatsapp: '5491100000000',
    },
    get instagramUrl() { return `https://instagram.com/${this.social.instagram}`; },
    get tiktokUrl() { return `https://tiktok.com/@${this.social.tiktok}`; },
    get facebookUrl() { return `https://facebook.com/${this.social.facebook}`; },
    get whatsappUrl() {
        return `https://wa.me/${this.social.whatsapp}?text=${encodeURIComponent(`Hola! Vengo desde la web ${this.franchiseName} y quería hacer una consulta.`)}`;
    }
};
