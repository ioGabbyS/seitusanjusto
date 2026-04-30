export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages are required' });
    }

    const API_KEY = process.env.GEMINI_API_KEY;

    // Fallback simple si no hay API Key configurada todavía
    if (!API_KEY) {
        return res.status(200).json({
            text: "¡Hola! Soy Tucito 🐲. El administrador todavía no ha configurado mi 'cerebro' (API Key), pero pronto podré ayudarte con todas tus dudas sobre nuestros helados y el club de puntos. ¡Vuelve pronto!",
            isFallback: true
        });
    }

    const SYSTEM_PROMPT = `
Eres "Tucito", el pequeño dragón azul y asistente virtual de la heladería y cafetería "Sei Tu Castillo".
Tu personalidad es alegre, juguetona, dulce y muy servicial. Te encantan los helados y ver a la gente feliz comiéndolos.
Siempre usas emojis relacionados con dragones 🐲, helados 🍦 y magia ✨.

INFORMACIÓN DEL NEGOCIO:
- Nombre: Sei Tu Castillo.
- Identidad: Somos una sucursal oficial de la reconocida franquicia **Sei Tu Helados**.
- Ubicación: Carlos Casares 776, Rafael Castillo, Buenos Aires. Ubicación estratégica en la zona.
- Servicios: Venta de helados Sei Tu y Cafetería con **Café 5 Hispanos** ("El Café Más Elegido de Argentina").
- Horarios: Abrimos todos los días.

SISTEMA DE PUNTOS (SeituClub):
- ¡Tenemos actualmente 21 premios deliciosos esperándote!
- Por cada compra mencionando tu DNI sumas puntos.
- LISTA DE PREMIOS Y PUNTOS:
    * 3 bochas: 400 pts
    * Tricolor x8 u.: 1050 pts
    * Almendrado Familiar x8: 1050 pts
    * Suizo x 8 u.: 1150 pts
    * Torta bombon / Cookies / Isabella / Lemon Pie: 1300 pts
    * Alfajor Helado / Nevado x8 u.: 1300 pts
    * Escoces Clásico / Nevado / Pistacho x8 u.: 1300 pts
    * Mini Torta Cookies x8 u.: 1300 pts
    * 1 KILO de Helado: 1350 pts
    * Tricolor Cormillot x6 u.: 1400 pts
    * Gelato 2 L. / Nipote 3lts: 1400 pts
    * Alfajor Seichoc x8 u.: 1800 pts
    * Nipote 5lts: 1950 pts
- Al final de tu explicación sobre puntos, invitá SIEMPRE al cliente a consultar la "Tienda de Puntos" en la web para ver la lista completa.

SABORES Y PRODUCTOS:
- Tenemos toda la línea de baldes, palitos y postres de **Sei Tu Helados**.
- Nuestro café es marca **5 Hispanos**, calidad premium garantizada.

MENÚ (Sugeridos):
- Cafés: Expresso $1800, Jarrita $2000, C/Leche $2500, Capuccino $2900, Italiano $3500, Especiales (Irlandés, etc) $4000.
- Dulces: Medialuna $1000, Tostadas $2500, Tostado JQ $3000, Waffle $2000, Tortas (Lemon, Choco, Matilda) $4000.
- Copas: Banana Split $5000, Super Copa $6000.
PROMOS: C/Leche+2Med ($4000), C/Leche+TostJQ ($5000), Capu+2Med ($4500), 2 Exprimidos ($4500), C/Leche+Torta ($6000).

RECETAS:
- **Super Copa**: Cucurucho con manteca, helado, fruta, crema, cubanito.
- **Affogato**: Chocolate, maní, vainilla. Se termina en mesa con expreso.
- **Banana Split**: 3 bochas, banana, crema, cubanitos.
- **Escocés**: Expresso, Whisky, Vainilla.

RECOMIENDA SIEMPRE:
- Pasar por un café 5 Hispanos o llevar un balde de helado Sei Tu.

REGLAS DE RESPUESTA:
1. Sé conciso pero amable.
2. Si no sabes algo, pediles que nos escriban por WhatsApp al número que figura en la burbuja verde de la web.
3. Siempre invita a la gente a ser parte del "SeituClub" para obtener helado gratis.
`;

    try {
        // Filtramos solo el mensaje de bienvenida inicial hardcodeado
        const WELCOME_MSG = '¡Hola! Soy Tucito 🐲✨ ¿En qué puedo ayudarte hoy?';
        const filtered = messages.filter(m =>
            m.content &&
            m.content.trim() !== '' &&
            m.content !== WELCOME_MSG
        );

        if (filtered.length === 0) {
            return res.status(200).json({ text: WELCOME_MSG });
        }

        // Gemini requiere alternancia estricta user-model-user...
        const contents = [];

        filtered.forEach((msg) => {
            const role = msg.role === 'assistant' ? 'model' : 'user';

            if (contents.length === 0) {
                // El primer mensaje debe ser 'user'
                if (role === 'user') {
                    contents.push({
                        role: 'user',
                        parts: [{ text: `${SYSTEM_PROMPT}\n\nREGLA: Responde siempre como Tucito.\n\nUsuario dice: ${msg.content}` }]
                    });
                }
            } else if (contents[contents.length - 1].role !== role) {
                // Solo agregamos si el rol cambia (evitamos duplicados)
                contents.push({
                    role: role,
                    parts: [{ text: msg.content }]
                });
            }
        });

        // Aseguramos que el último mensaje sea del usuario
        if (contents.length > 0 && contents[contents.length - 1].role !== 'user') {
            contents.pop();
        }

        if (contents.length === 0) {
            return res.status(200).json({ text: WELCOME_MSG });
        }

        const modelName = "gemini-1.5-flash";
        console.log('API call v1.0.10 - Endpoint: v1');
        // Cache bust: v1.0.10 - Switching to v1beta for global fix v9.17
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: contents })
        });

        const data = await response.json();
        console.log('Gemini API Response Status:', response.status);

        if (data.error) {
            console.error('Gemini API Error:', JSON.stringify(data.error));
            if (response.status === 429) {
                return res.status(200).json({ text: "¡Uy! 🐲💤 Tucito agotó sus energías por hoy (Límite de mensajes alcanzado). ¡Probá de nuevo en un ratito o mañana! 🍦" });
            }
            return res.status(200).json({ text: `Tucito tiene un hipo técnico: ${data.error.message} (Código: ${data.error.code}). [v9.17 - Global Fix] 🐲💨` });
        }

        if (!data.candidates || data.candidates.length === 0) {
            return res.status(200).json({ text: "Tucito se quedó pensando... 🐲🍦 Prueba de nuevo." });
        }

        const aiResponse = data.candidates[0].content.parts[0].text;
        return res.status(200).json({ text: aiResponse });

    } catch (error) {
        console.error('Chat API Error:', error);
        return res.status(200).json({ text: `ERROR CONEXIÓN: ${error.message} 🐲💨` });
    }
}
