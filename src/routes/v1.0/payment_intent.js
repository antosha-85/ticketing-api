const Stripe = require("stripe");
const db = require("../../db");
const createTicket = require("../../helper/ticket");
const { sendMsgAttach, sendMsg, textReceipt, htmlReceipt } = require( "../../helper/emailHelper");
const { getNewQRCode } = require("../../helper/qrCode");
const stripe = new Stripe(process.env.SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method === "POST") {
    try {
      const { amount, cartItems, handle } = req.body;
      // console.log("req.body", cartItems)

      // gets the user.id to create an order
      const vUser = await db.query('SELECT id, email FROM users WHERE handle = $1', [handle])

      // Check for valid user and cart
      if (cartItems.length > 0 && vUser.rowCount === 1 ) {
        const userID = vUser.rows[0].id;
        const userEmail = vUser.rows[0].email;
        let sqlOrderItems = ``;

        // checks the total value
        const amount = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0) * 100;

        // charges on Stripe
        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: "cad",
          metadata: {integration_check: 'accept_a_payment'},
          description: "Ticketing 4 Good - tickets for events"
        });

        // Creates the order on the db
        const vOrder = await db.query(`INSERT INTO orders (user_id, order_date, status) VALUES ( ${userID}, now(), 2) RETURNING id, conf_code;`)
        const orderID = vOrder.rows[0].id;
        const orderCode = vOrder.rows[0].conf_code;

        cartItems.forEach(item => {
          let { id, quantity } = item;
          // adds a comma if it's not the first item
          sqlOrderItems += sqlOrderItems.length > 0 ? `, ` : ``;
          sqlOrderItems += `( ${orderID}, ${id}, ${quantity})`
        });
        // adds the line items
        sqlOrderItems = `INSERT INTO order_items (order_id, event_id, qty) VALUES ` + sqlOrderItems + `;`
        const vOrderItems = await db.query(sqlOrderItems);

        const orderDetails = await db.query(`SELECT * FROM order_details_vw WHERE order_id = $1 ORDER BY event_date ASC;`, [orderID])
        orderDetails.rows.map((item )=> getNewQRCode(item.qr_code, item.item_id, "tickets/qr_code/"));

        // const testPDF = setTimeout( () => createTicket(orderDetails.rows), 3000);
        // console.log(`${orderDetails.rows[0].conf_code}-${orderID}.pdf`)
        // console.log("ok")

        // email confirmation
        const textMsg = textReceipt(orderDetails.rows);
        const htmlMsg = htmlReceipt(orderDetails.rows);
        sendMsg(userEmail, 'Ticketing 4 Good - Your order', textMsg, htmlMsg);
        // const sendPDF = setTimeout( () => sendMsgAttach(userEmail, 'Ticketing 4 Good - Your order', textMsg, htmlMsg, `${orderDetails.rows[0].conf_code}-${orderID}.pdf`), 6000);

        // res.status(200).send("All good!")
        res.status(200).send(paymentIntent.client_secret);

      } else {
        res.status(500).json({ statusCode: 500, message: "Please, verify your cart and credentials." });
      }

    } catch (err) {
      console.log("err", err)
      res.status(500).json({ statusCode: 500, message: err.message });
    }

  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
};
