const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Configuración - LUEGO LLENARÁS ESTOS DATOS
const CONFIG = {
  ACCESS_TOKEN: 'TU_ACCESS_TOKEN_AQUI', // Lo conseguirás después
  PHONE_NUMBER_ID: 'TU_PHONE_NUMBER_ID_AQUI', // Lo conseguirás después
  API_VERSION: 'v18.0'
};

// Respuestas automáticas para las opciones
const respuestas = {
  '1': `🛍️ *Tienda de Mascotas*\nTe ayudo con alimentos, accesorios y productos. ¿Qué específicamente necesitas?`,
  '2': `🐕 *Servicio Médico Veterinario*\nPara consultas, emergencias o citas. ¿Es una urgencia o cita programada?`,
  '3': `✂️ *Servicio de Peluquería*\nBaños, cortes y cuidado estético. ¿Te gustaría agendar cita o conocer precios?`,
  '4': `📞 *Área Comercial - Proveedores*\nContacta directamente a nuestro especialista:\n[TU_NÚMERO_PERSONAL_AQUÍ]\n\nHorario: Lunes a Viernes 9:00 AM - 6:00 PM`
};

// Mensaje de bienvenida automático
const mensajeBienvenida = `¡Hola! Bienvenido a Veterinaria Sábuesos 🐶🐱

Elige una opción:
1️⃣ 🛍️ Tienda de Mascotas
2️⃣ 🐕 Servicio Médico Veterinario  
3️⃣ ✂️ Servicio de Peluquería
4️⃣ 📞 Área Comercial

*Escribe solo el número*`;

// Webhook para recibir mensajes
app.post('/webhook', async (req, res) => {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    
    if (message && message.type === 'text') {
      const userMessage = message.text.body.trim();
      const from = message.from;
      
      // Si es el primer mensaje, enviar bienvenida
      if (userMessage.toLowerCase().includes('hola') || userMessage.toLowerCase().includes('buenas')) {
        await enviarMensajeWhatsApp(from, mensajeBienvenida);
      }
      // Si es una opción del 1-4, responder automáticamente
      else if (['1', '2', '3', '4'].includes(userMessage)) {
        const respuesta = respuestas[userMessage];
        await enviarMensajeWhatsApp(from, respuesta);
      }
      // Si no es una opción válida
      else {
        await enviarMensajeWhatsApp(from, 'Por favor, escribe solo el número de tu opción (1, 2, 3 o 4)');
      }
    }
    
    res.sendStatus(200);
  } catch (error) {
    console.error('Error en webhook:', error);
    res.sendStatus(200);
  }
});

// Función para enviar mensajes por WhatsApp
async function enviarMensajeWhatsApp(to, text) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/${CONFIG.API_VERSION}/${CONFIG.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        text: { body: text },
        context: {
          message_id: 'OPTIONAL_MESSAGE_ID'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error enviando mensaje:', error.response?.data || error.message);
  }
}

// Webhook de verificación (Meta lo requiere)
app.get('/webhook', (req, res) => {
  const verify_token = 'TU_VERIFY_TOKEN_AQUI'; // Lo configurarás después
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === verify_token) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot de veterinaria funcionando en puerto ${PORT}`);
});