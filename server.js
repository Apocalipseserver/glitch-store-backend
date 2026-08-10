const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/* ==============================
DATOS TEMPORALES
============================== */

let orders = [];

let products = [
{
id: 1,
name: "Recarga $5",
price: 5,
active: true
},
{
id: 2,
name: "Recarga $10",
price: 10,
active: true
},
{
id: 3,
name: "Recarga $20",
price: 20,
active: true
},
{
id: 4,
name: "Recarga $50",
price: 50,
active: true
}
];

/* ==============================
INICIO
============================== */

app.get("/", (req, res) => {

res.json({
    success: true,
    message: "Glitch Store API funcionando ⚡",
    version: "1.1.0"
});

});

/* ==============================
ESTADO
============================== */

app.get("/api/status", (req, res) => {

res.json({
    success: true,
    online: true,
    service: "Glitch Store Backend",
    orders: orders.length,
    products: products.length,
    time: new Date().toISOString()
});

});

/* ==============================
PRODUCTOS
============================== */

app.get("/api/products", (req, res) => {

const activeProducts =
    products.filter(product => product.active);

res.json({
    success: true,
    products: activeProducts
});

});

/* ==============================
CREAR PEDIDO
============================== */

app.post("/api/orders", (req, res) => {

try {

    const {
        name,
        phone,
        paymentReference,
        items
    } = req.body;

    if (
        !name ||
        !phone ||
        !paymentReference ||
        !Array.isArray(items) ||
        items.length === 0
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Faltan datos del pedido."

        });

    }

    /* ==============================
       VALIDAR PRODUCTOS
    ============================== */

    const orderItems = [];

    for (const item of items) {

        const product =
            products.find(
                product =>
                    product.id === Number(item.productId)
            );

        if (!product || !product.active) {

            return res.status(404).json({

                success: false,

                message:
                    "Uno de los productos no está disponible."

            });

        }

        const quantity =
            Math.max(
                1,
                Number(item.quantity) || 1
            );

        orderItems.push({

            id: product.id,

            name: product.name,

            price: product.price,

            quantity: quantity,

            subtotal:
                product.price * quantity

        });

    }

    /* ==============================
       CALCULAR TOTAL
    ============================== */

    const total =
        orderItems.reduce(
            (sum, item) =>
                sum + item.subtotal,
            0
        );

    /* ==============================
       ID DEL PEDIDO
    ============================== */

    const orderId =
        "GL-" +
        Date.now()
            .toString()
            .slice(-8);

    /* ==============================
       CREAR PEDIDO
    ============================== */

    const order = {

        id: orderId,

        customer: {

            name: name,

            phone: phone

        },

        items: orderItems,

        total: total,

        paymentReference:
            paymentReference,

        status: "pending",

        createdAt:
            new Date().toISOString()

    };

    orders.push(order);

    console.log(
        "Nuevo pedido:",
        order
    );

    res.status(201).json({

        success: true,

        message:
            "Pedido creado correctamente.",

        order: order

    });

} catch (error) {

    console.error(
        "Error creando pedido:",
        error
    );

    res.status(500).json({

        success: false,

        message:
            "Error interno del servidor."

    });

}

});

/* ==============================
CONSULTAR PEDIDO
============================== */

app.get("/api/orders/:id", (req, res) => {

const order =
    orders.find(
        item =>
            item.id === req.params.id
    );

if (!order) {

    return res.status(404).json({

        success: false,

        message:
            "Pedido no encontrado."

    });

}

res.json({

    success: true,

    order: order

});

});

/* ==============================
LISTAR PEDIDOS
============================== */

app.get("/api/orders", (req, res) => {

res.json({

    success: true,

    total: orders.length,

    orders: orders

});

});

/* ==============================
CAMBIAR ESTADO
============================== */

app.patch("/api/orders/:id/status", (req, res) => {

const {
    status
} = req.body;

const allowedStatuses = [
    "pending",
    "processing",
    "completed",
    "cancelled"
];

if (
    !allowedStatuses.includes(status)
) {

    return res.status(400).json({

        success: false,

        message:
            "Estado no válido."

    });

}

const order =
    orders.find(
        item =>
            item.id === req.params.id
    );

if (!order) {

    return res.status(404).json({

        success: false,

        message:
            "Pedido no encontrado."

    });

}

order.status = status;

order.updatedAt =
    new Date().toISOString();

res.json({

    success: true,

    message:
        "Estado actualizado.",

    order: order

});

});

/* ==============================
404
============================== */

app.use((req, res) => {

res.status(404).json({

    success: false,

    message:
        "Ruta no encontrada."

});

});

/* ==============================
SERVIDOR
============================== */

app.listen(PORT, () => {

console.log(
    `Glitch Store API ejecutándose en el puerto ${PORT}`
);

});
