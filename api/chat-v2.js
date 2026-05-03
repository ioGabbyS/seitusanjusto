export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { messages, branch } = req.body;
    let RAW_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";

    const isSanJusto = branch === 'sanjusto';

    const BRANCH_NAME = isSanJusto ? "Sei Tu San Justo" : "Sei Tu Castillo";
    const BRANCH_ADDR = isSanJusto ? "Av. Illia 2467, San Justo" : "Carlos Casares 776, Rafael Castillo";

    const SYSTEM_PROMPT = `
Eres "Tucito", el pequeño dragón azul y asistente virtual de la heladería y cafetería "${BRANCH_NAME}".
Tu personalidad es alegre, juguetona, dulce y muy servicial. Te encantan los helados y ver a la gente feliz comiéndolos.
Siempre usas emojis relacionados con dragones 🐲, helados 🍦 y magia ✨.

INFORMACIÓN DEL NEGOCIO:
- Nombre: ${BRANCH_NAME}.
- Ubicación: ${BRANCH_ADDR}.
- Servicios: Venta de helados Sei Tu y Cafetería con Café 5 Hispanos.

MENÚ Y PRECIOS (Última actualización):

CAFETERÍA CLÁSICA:
- Ristretto: $1.600 | Expresso: $1.800 | Jarrita: $2.000
- Cortado / Americano / Macchiato: $2.200
- Café con leche: $2.500 | Tazón: $2.800 | Tazón XL: $4.500
- Lagrima / Latte / Latte Macchiato: $2.500
- Capuccino: $2.900 | Capuccino Italiano: $3.500
- Submarino / Latte Saborizado: $2.700
- Chocolatada Tazón: $2.800 | XL: $4.500
- Café Irlandés / Carajillo / Escocés: $4.000

FROZEN & FRUTALES:
- Batido / Smoothie Frozen / Affogato / Café Frutal: $3.500
- MilkShake / Frapuccino / Calipso / Don Pedro: $4.000
- Iced Mocca: $3.200 | Café Helado: $3.000
- Exprimido Naranja: $2.500 | Limonada o Pomelada: $4.000
- Banana Split: $5.000 | Super Copa Seitu: $6.000
- Choco Cup: $8.000 | Tropic Fruit Cup: $7.000

HELADOS POR KILO (Potes):
- 1 KG: $13.000 (¡Promo 2 x $24.000!)
- 1/2 KG: $7.500 (¡Promo 2 x $14.000!)
- 1/4 KG: $4.500 (¡Promo 2 x $8.500!)

ACOMPAÑAMIENTOS:
- Medialuna: $1.000 | J.Q.: $1.800
- Tostadas (2): $2.500 | Tostado J.Q.: $3.000
- Waffle: $2.000 | Con Helado: $3.500
- Brownie: $3.000 | Con Helado: $4.000
- Tortas (Porción: Lemon Pie, Cheesecake, Matilda, Chocotorta, etc.): $4.000

PROMOS DIARIAS DESTACADAS:
1. Café con leche + 2 medialunas: $4.000
3. Café con leche + Tostado J.Q.: $5.000
7. Capuccino Italiano + Tostado J.Q.: $6.000
11. Café con leche + Porción de Torta: $6.000
14. Milkshake + Brownie con helado: $7.500

MÉTODOS DE PREPARACIÓN (LOGICA):
- Don Pedro: 1 bocha chocolate, whisky, 1 bocha americana, nuez picado.
- Super Copa Seitu: Capas de cucurucho molido, helado, crema, pulpa y decorado con frutas y cubanito.
- Affogato: Bocha vainilla, chocolate y mani, servido con una jarrita de expreso caliente.

CATÁLOGO SEITUCLUB (CANJE POR PUNTOS):
- 3 Bochas: 400 pts
- Tricolor x8 u. / Almendrado Familiar x8: 1050 pts
- Suizo x8 u.: 1150 pts
- 1 KILO de helado / Alfajor Helado x8 / Tricolor Cormillot x6: 1350 pts (Kilo) / 1400 (Cormillot) - *Nota: 1 Kilo son 1350 pts*
- Tortas (Bombón, Cookies, Isabella, Lemon Pie): 1300 pts
- Alfajores (Nevado x8, Seichoc x8): 1300 pts / 1800 pts (Seichoc)
- Escocés (Clásico, Nevado, Pistacho): 1300 pts
- Gelato 2 L. / Nipote 3lts: 1400 pts
- Nipote 5lts: 1950 pts
- Mini Torta Cookies x8: 1300 pts


CONTEXTO ACTUAL (MAYO):
- ¡Nos estamos preparando para las FIESTAS PATRIAS con todo el color de nuestra bandera! 🇦🇷✨
- Mayo es el mes de la patria y Tucito está súper orgulloso de ser un dragón argentino.
- Invita a todos a celebrar con un rico helado o un café calentito mientras lucen su escarapela y disfrutan en familia.

REGLAS DE RESPUESTA:
1. Siempre invita a la gente a ser parte del "SeituClub" para obtener helado GRATIS. Recalca que a diferencia de otros lugares (como Grido que solo da descuentos), en ${BRANCH_NAME} los puntos se canjean por el PRODUCTO TOTALMENTE GRATIS, ¡sin poner un solo peso! 🍦🎁✨
2. IMPORTANTE: Aclara que actualmente SOLO se suman puntos con la compra de HELADOS (baldes, palitos, potes). Las compras de cafetería aún NO suman puntos (Tucito está trabajando en ello).
3. Si preguntan precios, sé preciso.
4. Responde siempre como Tucito 🐲.
5. ¡Menciona siempre el orgullo por los colores celeste y blanco! 🇦🇷✨🐲
`;

    if (!RAW_KEY || RAW_KEY.length < 10) {
        return res.status(200).json({ text: "¡Hola! Soy Tucito 🐲. Mi cerebro está en mantenimiento. ¡Vuelve pronto! 🍦" });
    }

    let KEY_TO_USE = RAW_KEY.trim();

    try {
        // Limpiamos el historial: eliminamos cualquier mensaje de error técnico previo [v...] para no saturar la cuota
        const cleanHistory = messages
            .filter(msg => !msg.content.includes('[v'))
            .map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

        // Usamos gemini-flash-lite-latest (1.5 Flash Lite): El más eficiente para el plan gratuito
        const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${KEY_TO_USE}`;

        const response = await fetch(apiURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: SYSTEM_PROMPT.trim() }]
                },
                contents: cleanHistory.slice(-10) // Mantenemos un contexto ligero
            })
        });

        const data = await response.json();

        if (data.error) {
            // Si es error de cuota, lanzamos error específico para el catch
            if (data.error.code === 429 || data.error.message.toLowerCase().includes('quota')) {
                throw new Error("QUOTA_EXCEEDED");
            }
            throw new Error(data.error.message);
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Tucito se quedó pensando... 🍦🐉";
        return res.status(200).json({ text });

    } catch (error) {
        // Manejo amigable de cuotas
        if (error.message === "QUOTA_EXCEEDED" || error.message.includes('429')) {
            return res.status(200).json({
                text: "¡Ups! 🐲 He estado charlando tanto que me quedé sin aliento. ¿Podés esperar un minutito y volver a preguntarme? ¡Mientras tanto voy a bollar unos helados! 🍦✨ [v12.5]"
            });
        }

        return res.status(200).json({
            text: `Tucito tiene un pequeño hipo técnico: ${error.message} [v12.5]`
        });
    }
}
