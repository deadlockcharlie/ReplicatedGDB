const { UpdateDecoderV1 } = require("yjs");

ydoc.on("update", (update) => {
    // console.log("Yjs document updated:", update);
    UpdateDecoderV1.decode(update, ydoc);
    console.log("Decoded update:", ydoc);
  });