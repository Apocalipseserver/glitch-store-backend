const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 3000;
const GAMESKINBO_API_KEY = process.env.GAMESKINBO_API_KEY;

// ==============================
// CONFIGURACIÓN
// ==============================

app.use(cors());
app.use(express.json());


// ==============================
// RUTA PRINCIPAL
// ==============================

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Glitch Recargas API funcionando",
    service: "Free Fire Player Checker"
  });
});


// ==============================
// ESTADO DE LA API
// ==============================

app.get("/api/status", (req, res) => {
  res.json({
    ok: true,
    gameskinboConfigured: Boolean(GAMESKINBO_API_KEY),
    timestamp: new Date().toISOString()
  });
});


// ==============================
// CONSULTAR JUGADOR FREE FIRE
// ==============================

app.get("/api/player", async (req, res) => {

  try {

    const uid = String(req.query.uid || "").trim();
    const region = String(req.query.region || "SAC").trim().toUpperCase();


    // ------------------------------
    // VALIDAR UID
    // ------------------------------

    if (!uid) {
      return res.status(400).json({
        ok: false,
        error: "Debes proporcionar un UID."
      });
    }

    if (!/^[0-9]+$/.test(uid)) {
      return res.status(400).json({
        ok: false,
        error: "El UID solamente puede contener números."
      });
    }


    // ------------------------------
    // VALIDAR API KEY
    // ------------------------------

    if (!GAMESKINBO_API_KEY) {

      console.error(
        "Falta la variable GAMESKINBO_API_KEY en Render."
      );

      return res.status(500).json({
        ok: false,
        error: "La API de GamesKinbo no está configurada."
      });
    }


    // ------------------------------
    // CONSULTAR GAMESKINBO
    // ------------------------------

    const url =
      "https://api.gameskinbo.com/ff-info/get" +
      `?uid=${encodeURIComponent(uid)}` +
      `&region=${encodeURIComponent(region)}`;


    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": GAMESKINBO_API_KEY,
        "Accept": "application/json"
      }
    });


    // ------------------------------
    // LEER RESPUESTA
    // ------------------------------

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        raw: text
      };
    }


    // ------------------------------
    // ERROR DE GAMESKINBO
    // ------------------------------

    if (!response.ok) {

      console.error(
        "GamesKinbo respondió:",
        response.status,
        data
      );

      return res.status(response.status).json({
        ok: false,
        error: "GamesKinbo rechazó la consulta.",
        status: response.status
      });
    }


    // ------------------------------
    // OBTENER INFORMACIÓN
    // ------------------------------

    const accountInfo =
      data?.AccountInfo ||
      data?.accountInfo ||
      data?.data?.AccountInfo ||
      data?.data ||
      null;


    const nickname =
      accountInfo?.AccountName ||
      accountInfo?.accountName ||
      data?.AccountName ||
      data?.accountName ||
      null;


    // ------------------------------
    // JUGADOR NO ENCONTRADO
    // ------------------------------

    if (!nickname) {

      return res.status(404).json({
        ok: false,
        error: "No se encontró información para ese UID.",
        uid,
        region
      });
    }


    // ------------------------------
    // RESPUESTA
    // ------------------------------

    return res.json({

      ok: true,

      player: {
        uid: uid,
        nickname: nickname,
        region: region
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


// ==============================
// CREAR PEDIDO
// ==============================

app.post("/api/orders", async (req, res) => {

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


    if (!diamonds) {
      return res.status(400).json({
        ok: false,
        error: "Falta la cantidad de diamantes."
      });
    }


    const order = {

      id:
        "GR-" +
        Date.now() +
        "-" +
        Math.floor(Math.random() * 1000),

      game: game || "free-fire",

      playerId: String(playerId),

      diamonds: Number(diamonds),

      price: Number(price || 0),

      currency: currency || "VES",

      status: "pending",

      createdAt: new Date().toISOString()

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


// ==============================
// 404
// ==============================

app.use((req, res) => {

  res.status(404).json({
    ok: false,
    error: "Ruta no encontrada."
  });

});


// ==============================
// INICIAR SERVIDOR
// ==============================

app.listen(PORT, () => {

  console.log(
    `Glitch Recargas API funcionando en el puerto ${PORT}`
  );

  console.log(
    "GamesKinbo:",
    GAMESKINBO_API_KEY
      ? "API KEY configurada"
      : "API KEY NO configurada"
  );

});
