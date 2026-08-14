(function () {
  const originalToBlob = HTMLCanvasElement.prototype.toBlob;
  if (!originalToBlob || originalToBlob.__gaba47PhotoFix) return;

  const MAX_BYTES = 900 * 1024;
  const MIN_SIDE = 560;
  const IMAGE_TYPES = new Set(["image/webp", "image/jpeg", "image/png"]);
  const qualities = [0.72, 0.64, 0.56, 0.48, 0.42, 0.36];
  const maxSides = [1100, 960, 820, 700, 620, MIN_SIDE];

  const encode = (canvas, type, quality) => new Promise((resolve) => {
    originalToBlob.call(canvas, resolve, type, quality);
  });

  const scaleCanvas = (source, maxSide) => {
    const side = Math.max(source.width, source.height);
    const scale = Math.min(1, maxSide / side);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas;
  };

  HTMLCanvasElement.prototype.toBlob = function patchedToBlob(callback, type, quality) {
    const source = this;
    const requestedType = type || "image/png";
    const requestedQuality = typeof quality === "number" ? quality : 0.82;

    (async () => {
      let outputType = requestedType;
      let blob = await encode(source, outputType, requestedQuality);

      if (!blob && requestedType === "image/webp") {
        outputType = "image/jpeg";
        blob = await encode(source, outputType, requestedQuality);
      }
      if (!blob) {
        callback(null);
        return;
      }
      if (blob.size <= MAX_BYTES || !IMAGE_TYPES.has(blob.type)) {
        callback(blob);
        return;
      }

      const fallbackType = outputType === "image/png" ? "image/jpeg" : outputType;
      const startSide = Math.max(source.width, source.height);
      for (const maxSide of maxSides.filter((side) => side < startSide)) {
        const canvas = scaleCanvas(source, maxSide);
        if (!canvas) continue;
        for (const nextQuality of qualities) {
          blob = await encode(canvas, fallbackType, Math.min(requestedQuality, nextQuality));
          if (blob && blob.size <= MAX_BYTES) {
            callback(blob);
            return;
          }
        }
      }

      callback(blob);
    })().catch(() => {
      originalToBlob.call(source, callback, type, quality);
    });
  };
  HTMLCanvasElement.prototype.toBlob.__gaba47PhotoFix = true;
})();
