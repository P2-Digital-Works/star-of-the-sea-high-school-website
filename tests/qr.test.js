import test from "node:test";
import assert from "node:assert/strict";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { PNG } from "pngjs";
test("real generated QR round-trips through the same decoder used by the camera", async () => {
  const png = PNG.sync.read(
    await QRCode.toBuffer("DEMO-SSHS:DEMO-1001", { width: 256, margin: 2 }),
  );
  const found = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  assert.equal(found.data, "DEMO-SSHS:DEMO-1001");
});
