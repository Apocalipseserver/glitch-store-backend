const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 3000;
const GAMESKINBO_API_KEY = process.env.GAMESKINBO_API_KEY;

// ==========================================
// CONFIGURACIÓN
// ==========================================

app.use(cors());
app.use(express.json());


// ==========================================
// RUTA PRINCIPAL
// ==========================================

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "Glitch Recargas API",
    status: "online",
    message: "API funcionando correctamente"
  });
});


// ==========================================
// ESTADO
// ==========================================

app.get("/api/status", (req, res) => {
  res.json({
    ok: true,
    backend: "online",
    gameskinboConfigured: Boolean(GAMESKINBO_API_KEY),
    timestamp: new Date().toISOString()
  });
});


// ==========================================
// PRUEBA DE GAMESKINBO
// ==========================================

app.get("/api/gameskinbo-test", async (req, res) => {

  try {

    if (!GAMESKINBO_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "GAMESKINBO_API_KEY no está configurada."
      });
    }

    const response = await fetch(
      "https://api.gameskinbo.com/api/usage",
      {
        method: "GET",
        headers: {
          "x-api-key": GAMESKINBO_API_KEY.trim(),
          "Accept": "application/json"
        }
      }
    );

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    console.log(
      "GamesKinbo:",
      response.status
    );

    return res.status(response.status).json({
      ok: response.ok,
      gameskinboStatus: response.status,
      data
    });

  } catch (error) {

    console.error("GamesKinbo error:", error);

    return res.status(500).json({
      ok: false,
      error: "No se pudo conectar con GamesKinbo."
    });

  }

});


// ==========================================
// CONSULTAR JUGADOR FREE FIRE
// ==========================================

app.get("/api/player", async (req, res) => {

  try {

    const uid = String(req.query.uid || "").trim();
    const region = String(
      req.query.region || "SAC"
    ).trim().toUpperCase();


    // --------------------------------------
    // VALIDAR UID
    // --------------------------------------

    if (!uid) {
      return res.status(400).json({
        ok: false,
        error: "Debes proporcionar un UID."
      });
    }

    if (!/^[0-9]+$/.test(uid)) {
      return res.status(400).json({
        ok: false,
        error: "El UID debe contener únicamente números."
      });
    }


    // --------------------------------------
    // COMPROBAR API KEY
    // --------------------------------------

    if (!GAMESKINBO_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "GamesKinbo no está configurado."
      });
    }


    // --------------------------------------
    // URL GAMESKINBO
    // --------------------------------------

    const url =
      "https://api.gameskinbo.com/ff-info/get" +
      `?uid=${encodeURIComponent(uid)}` +
      `&region=${encodeURIComponent(region)}`;


    // --------------------------------------
    // PETICIÓN
    // --------------------------------------

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": GAMESKINBO_API_KEY.trim(),
        "Accept": "application/json"
      }
    });


    // --------------------------------------
    // RESPUESTA
    // --------------------------------------

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        raw: text
      };
    }


    // --------------------------------------
    // ERROR
    // --------------------------------------

    if (!response.ok) {

      console.error(
        "GamesKinbo:",
        response.status,
        data
      );

      return res.status(response.status).json({
        ok: false,
        error: "GamesKinbo rechazó la consulta.",
        gameskinboStatus: response.status,
        details: data
      });

    }


    // --------------------------------------
    // INFORMACIÓN DE CUENTA
    // --------------------------------------

    const accountInfo =
      data?.AccountInfo || {};


    const nickname =
      accountInfo?.AccountName || null;


    const accountRegion =
      accountInfo?.AccountRegion ||
      region;


    // --------------------------------------
    // SIN NICKNAME
    // --------------------------------------

    if (!nickname) {

      return res.status(404).json({
        ok: false,
        found: false,
        uid,
        error: "GamesKinbo no devolvió el nickname."
      });

    }


    // --------------------------------------
    // ÉXITO
    // --------------------------------------

    return res.json({

      ok: true,

      found: true,

      player: {
        uid,
        nickname,
        region: accountRegion
      }

    });

  } catch (error) {

    console.error(
      "Error consultando jugador:",
      error
    );

    return res.status(500).json({
      ok: false,
      error: "Error interno del servidor."
    });

  }

});


// ==========================================
// CREAR PEDIDO
// ==========================================

app.post("/api/orders", (req, res) => {

  try {

    const {
      game,
      playerId,
      diamonds,
      price,
      currency
    } = req.body;


    if (!playerId) {
      return res.status(400).json({
        ok: false,
        error: "Falta el ID del jugador."
      });
    }


    if (!/^[0-9]+$/.test(String(playerId))) {
      return res.status(400).json({
        ok: false,
        error: "El ID del jugador no es válido."
      });
    }


    if (!diamonds) {
      return res.status(400).json({
        ok: false,
        error: "Falta la cantidad de diamantes."
      });
    }


    const order = {

      orderId:
        "GR-" +
        Date.now().toString(36).toUpperCase() +
        "-" +
        Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0"),

      game: game || "free-fire",

      playerId: String(playerId),

      diamonds: Number(diamonds),

      price: Number(price || 0),

      currency: currency || "VES",

      status: "pending",

      createdAt:
        new Date().toISOString()

    };


    console.log(
      "Nuevo pedido:",
      order
    );


    return res.status(201).json({

      ok: true,

      message: "Pedido creado correctamente.",

      order

    });

  } catch (error) {

    console.error(
      "Error creando pedido:",
      error
    );

    return res.status(500).json({
      ok: false,
      error: "No se pudo crear el pedido."
    });

  }

});


// ==========================================
// 404
// ==========================================

app.use((req, res) => {

  res.status(404).json({
    ok: false,
    error: "Ruta no encontrada."
  });

});


// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(PORT, () => {

  console.log(
    `Glitch Recargas API funcionando en puerto ${PORT}`
  );

  console.log(
    "GamesKinbo:",
    GAMESKINBO_API_KEY
      ? "API KEY configurada"
      : "API KEY NO configurada"
  );

});
