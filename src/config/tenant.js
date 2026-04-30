/*
  Configuración EXCLUSIVA de San Justo
*/

export const getTenantConfig = () => {
    return {
        navLogo: '/logosanjusto.png',
        mainLogo: '/sanjusto2.png',
        titleSize: 'text-5xl sm:text-7xl',
        franchiseName: 'Sei Tu San Justo',
        shortName: 'San Justo',
        location: 'San Justo',
        domain: 'seitu-sanjusto.vercel.app',
        systemName: 'Seitu San Justo',
        establishedYear: '2026',

        // Contacto y Redes
        social: {
            instagram: 'seitusanjusto',
            tiktok: 'seitusanjusto',
            facebook: 'seitusanjusto',
            whatsapp: '5491100000000', // Actualizar con el real
        },

        adminEmail: 'iogabbys@gmail.com',

        get instagramUrl() { return `https://instagram.com/${this.social.instagram}`; },
        get tiktokUrl() { return `https://tiktok.com/@${this.social.tiktok}`; },
        get facebookUrl() { return `https://facebook.com/${this.social.facebook}`; },
        get whatsappUrl() {
            return `https://wa.me/${this.social.whatsapp}?text=${encodeURIComponent(`Hola! Vengo desde la web Sei Tu San Justo y quería hacer una consulta.`)}`;
        }
    };
};

export const tenant = getTenantConfig();
