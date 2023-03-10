const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const express = require("express");
const socketIO = require("socket.io");
const { body, validationResult } = require("express-validator");
const qrcode = require("qrcode");
const http = require("http");
const fs = require("fs");
const { phoneNumberFormatter } = require("./helpers/formatter");
const fileUpload = require("express-fileupload");
const cron = require("node-cron");
const port = process.env.PORT || 8000;

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    debug: true,
  })
);

const client = new Client({
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  },
  authStrategy: new LocalAuth(),
});

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: __dirname });
});

client.on("message", (msg) => {
  if (msg.body == "!ping") {
    msg.reply("pong");
  } else if (msg.body == "good morning") {
    msg.reply("selamat pagi");
  } else if (msg.body == "test") {
    msg.reply("oit, masih on bot nya");
  }
});

client.initialize();

// Socket IO
io.on("connection", function (socket) {
  socket.emit("message", "Connecting...");

  client.on("qr", (qr) => {
    console.log("QR Received", qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit("qr", url);
      socket.emit("message", "QR Code received, scan please");
    });
  });

  client.on("ready", () => {
    socket.emit("ready", "Whatsapp is ready!");
    socket.emit("message", "Whatsapp is ready!");
  });
});

const checkRegisteredNumber = async function (number) {
  const isRegistered = await client.isRegisteredUser(number);
  return isRegistered;
};

// send message
app.post(
  "/send-message",
  [body("number").notEmpty(), body("message").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req).formatWith(({ msg }) => {
      return msg;
    });

    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: false,
        message: errors.mapped(),
      });
    }
    const number = phoneNumberFormatter(req.body.number);
    const message = req.body.message;

    const isRegisteredNumber = await checkRegisteredNumber(number);

    if (!isRegisteredNumber) {
      return res.status(422).json({
        status: false,
        message: "The number is not registered",
      });
    }

    client
      .sendMessage(number, message)
      .then((response) => {
        res.status(200).json({
          status: true,
          response: response,
        });
      })
      .catch((err) => {
        res.status(500).json({
          status: false,
          response: err,
        });
      });
  }
);

// send media
app.post("/send-media", (req, res) => {
  const number = phoneNumberFormatter(req.body.number);
  const caption = req.body.caption;
  // const media = MessageMedia.fromFilePath("./smitty.jpg");
  const file = req.files.file;
  const media = new MessageMedia(
    file.mimetype,
    file.data.toString("base64"),
    file.name
  );

  client
    .sendMessage(number, media, { caption: caption })
    .then((response) => {
      res.status(200).json({
        status: true,
        response: response,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: false,
        response: err,
      });
    });
});

// cron job 1 jam
cron.schedule(
  "0 */1 * * Monday,Tuesday,Wednesday,Thursday,Friday",
  function () {
    const message = "Pesan ini akan terkirim setiap 1 jam sekali";
    const number = "6287775477657@c.us";

    // console.log("running a task every 1 hour");
    client.sendMessage(number, message);
  },
  {
    timezone: "Asia/Jakarta",
  }
);

// cron job absen datang
cron.schedule(
  "30 8 * * Monday,Tuesday,Wednesday,Thursday,Friday",
  function () {
    const message =
      "Ohayogozaimasu min'na-san,\nJangan lupa absen masuk yaa\nSemangat bekerja";
    const number = "6287775477657@c.us";

    client.sendMessage(number, message);
  },
  {
    timezone: "Asia/Jakarta",
  }
);

cron.schedule(
  "10 7 * * Monday,Tuesday,Wednesday,Thursday,Friday",
  function () {
    const message =
      "Ohayogozaimasu Annisa Rifa,\nJangan lupa absen masuk yaa\nSemangat bekerja";
    const number = "6285883060094@c.us";

    client.sendMessage(number, message);
  },
  {
    timezone: "Asia/Jakarta",
  }
);

// cron job istirahat
cron.schedule(
  "0 12 * * Monday,Tuesday,Wednesday,Thursday",
  function () {
    const message = "Hi Heri,\nSelamat istirahat, jangan lupa makan yaa";
    const number = "6287775477657@c.us";

    client.sendMessage(number, message);
  },
  {
    timezone: "Asia/Jakarta",
  }
);

cron.schedule(
  "0 12 * * Monday,Tuesday,Wednesday,Thursday,Friday",
  function () {
    const message = "Hi Annisa Rifa,\nSelamat istirahat, jangan lupa makan yaa";
    const number = "6285883060094@c.us";

    client.sendMessage(number, message);
  },
  {
    timezone: "Asia/Jakarta",
  }
);

// cron job istirahat
cron.schedule(
  "30 11 * * Friday",
  function () {
    const message = "Hi Heri,\nSelamat istirahat";
    const number = "6287775477657@c.us";

    client.sendMessage(number, message);
  },
  {
    timezone: "Asia/Jakarta",
  }
);

// cron job kerja kembali
cron.schedule(
  "0 13 * * Monday,Tuesday,Wednesday,Thursday,Friday",
  function () {
    const message = "Hi Heri,\nSelamat bekerja kembali";
    const number = "6287775477657@c.us";

    console.log("Hi Heri,\nSelamat bekerja kembali");
    client.sendMessage(number, message);
  },
  {
    timezone: "Asia/Jakarta",
  }
);

cron.schedule(
  "0 13 * * Monday,Tuesday,Wednesday,Thursday,Friday",
  function () {
    const message = "Hi Annisa Rifa,\nSelamat bekerja kembali";
    const number = "6285883060094@c.us";

    client.sendMessage(number, message);
  },
  {
    timezone: "Asia/Jakarta",
  }
);

// cron job absen pulang
cron.schedule(
  "30 17 * * Monday,Tuesday,Wednesday,Thursday,Friday",
  function () {
    const message =
      "Konnichiwa minnasan,\nJangan lupa absen pulang yaa\nHati hati di jalan";
    const number = "6287775477657@c.us";
    client.sendMessage(number, message);
  },
  {
    timezone: "Asia/Jakarta",
  }
);

cron.schedule(
  "30 16 * * Monday,Tuesday,Wednesday,Thursday,Friday",
  function () {
    const message =
      "Konnichiwa Annisa Rifa,\nJangan lupa absen pulang yaa\nHati hati di jalan";
    const number = "6285883060094@c.us";
    client.sendMessage(number, message);
  },
  {
    timezone: "Asia/Jakarta",
  }
);

server.listen(port, function () {
  console.log("App running on *:" + port);
});
