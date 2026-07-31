// ===================================================================
//  DISPOSABLE CAMERA
//  Takes whatever photo the guest picks and re-develops it in a canvas
//  to look like a drugstore point-and-shoot print: warm cast, faded
//  blacks, grain, vignette, a light leak, and a glowing date stamp.
//
//  Tweakables are all in the FILM block below.
// ===================================================================

const FILM = {
  maxEdge: 1600,       // longest side of the finished photo, in pixels
  quality: 0.88,       // JPEG quality
  warmth: 1.07,        // red multiplier — higher is warmer
  coolLoss: 0.92,      // blue multiplier — lower is warmer
  fade: 0.9,           // how much the blacks lift (lower = more faded)
  contrast: 1.1,       // S-curve strength
  grain: 26,           // grain intensity, 0 turns it off
  vignette: "#a2887a", // edge colour, multiplied in. Darker = heavier
  leak: "rgba(255, 138, 60, 0.3)", // corner light leak
  stampColor: "rgba(255, 168, 60, 0.95)",

  // Also keep the guest's untouched original, so a clean copy survives for
  // prints or a slideshow later. Uploaded in the background after the film
  // version, so nobody waits on a 10MB file over party wifi.
  keepOriginal: true,
  maxOriginalMB: 20,
};

const els = {
  drop: document.getElementById("drop"),
  input: document.getElementById("fileInput"),
  working: document.getElementById("working"),
  result: document.getElementById("result"),
  canvas: document.getElementById("canvas"),
  sendBtn: document.getElementById("sendBtn"),
  downloadBtn: document.getElementById("downloadBtn"),
  againBtn: document.getElementById("againBtn"),
  name: document.getElementById("camName"),
  status: document.getElementById("camStatus"),
  collage: document.getElementById("collage"),
  collageGrid: document.getElementById("collageGrid"),
  collageEmpty: document.getElementById("collageEmpty"),
};

const ctx = els.canvas.getContext("2d", { willReadFrequently: true });
let developed = null;     // data URL, for the "save to my phone" link
let developedBlob = null; // the same image as a blob, for uploading
let originalFile = null;  // exactly what came off their phone, unmodified

// ===== INPUT =====

els.input.addEventListener("change", (e) => {
  if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
});

// Drag and drop, for anyone on a laptop.
["dragenter", "dragover"].forEach((evt) =>
  els.drop.addEventListener(evt, (e) => {
    e.preventDefault();
    els.drop.classList.add("is-hover");
  })
);
["dragleave", "drop"].forEach((evt) =>
  els.drop.addEventListener(evt, (e) => {
    e.preventDefault();
    els.drop.classList.remove("is-hover");
  })
);
els.drop.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (file) handleFile(file);
});

async function handleFile(file) {
  if (!file.type.startsWith("image/")) {
    setStatus("That doesn't look like a photo — try again.", true);
    return;
  }

  els.result.hidden = true;
  els.working.hidden = false;
  setStatus("");
  originalFile = file;

  try {
    const image = await loadImage(file);
    develop(image);
    developed = els.canvas.toDataURL("image/jpeg", FILM.quality);
    developedBlob = await canvasBlob();
    els.downloadBtn.href = developed;
    els.working.hidden = true;
    els.result.hidden = false;
    els.result.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (err) {
    els.working.hidden = true;
    setStatus("Couldn't read that photo — try a different one.", true);
  }
}

// Honour the EXIF rotation phones bake into photos, so nothing lands sideways.
async function loadImage(file) {
  if (window.createImageBitmap) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch (err) {
      /* fall through to the <img> path */
    }
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// ===== DEVELOPING =====

function develop(image) {
  const sw = image.width;
  const sh = image.height;
  const scale = Math.min(1, FILM.maxEdge / Math.max(sw, sh));
  const w = Math.round(sw * scale);
  const h = Math.round(sh * scale);

  els.canvas.width = w;
  els.canvas.height = h;

  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(image, 0, 0, w, h);

  grade(w, h);
  vignette(w, h);
  lightLeak(w, h);
  dateStamp(w, h);

  ctx.globalCompositeOperation = "source-over";
}

// Colour grade + grain, in one pass over the pixels.
function grade(w, h) {
  const frame = ctx.getImageData(0, 0, w, h);
  const d = frame.data;

  const red = curve(FILM.warmth, 6, 20);
  const green = curve(1.01, 2, 16);
  const blue = curve(FILM.coolLoss, -4, 22);

  for (let i = 0; i < d.length; i += 4) {
    let r = red[d[i]];
    let g = green[d[i + 1]];
    let b = blue[d[i + 2]];

    if (FILM.grain) {
      // Grain reads strongest in the midtones, the way real film does.
      const mid = 1 - Math.abs((r + g + b) / 3 - 128) / 128;
      const n = (Math.random() - 0.5) * FILM.grain * (0.45 + 0.55 * mid);
      r += n;
      g += n;
      b += n;
    }

    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
  }

  ctx.putImageData(frame, 0, 0);
}

// Precompute a 256-entry lookup table for one channel — much faster than
// doing this arithmetic per pixel.
function curve(mul, add, liftBase) {
  const table = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) {
    let x = v * mul + add;
    x = liftBase + x * FILM.fade;
    x = ((x / 255 - 0.5) * FILM.contrast + 0.5) * 255;
    table[v] = x;
  }
  return table;
}

function vignette(w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const g = ctx.createRadialGradient(
    cx, cy, Math.min(w, h) * 0.3,
    cx, cy, Math.max(w, h) * 0.78
  );
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.62, "#f2ece7");
  g.addColorStop(1, FILM.vignette);

  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function lightLeak(w, h) {
  const g = ctx.createRadialGradient(
    w * 1.02, h * 0.12, 0,
    w * 1.02, h * 0.12, Math.max(w, h) * 0.55
  );
  g.addColorStop(0, FILM.leak);
  g.addColorStop(1, "rgba(255, 138, 60, 0)");

  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function dateStamp(w, h) {
  const text = STAMP_DATE || autoDate();
  const size = Math.round(Math.min(w, h) * 0.052);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.font = `bold ${size}px "Courier New", ui-monospace, monospace`;
  ctx.letterSpacing = Math.round(size * 0.12) + "px"; // ignored where unsupported
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(255, 110, 20, 0.9)";
  ctx.shadowBlur = size * 0.55;
  ctx.fillStyle = FILM.stampColor;

  const x = w - size * 0.75;
  const y = h - size * 0.7;
  ctx.fillText(text, x, y); // drawn twice so the bloom builds up
  ctx.fillText(text, x, y);
  ctx.restore();
}

// Month day year, matching the format of STAMP_DATE in config.js.
function autoDate() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  return `${now.getMonth() + 1} ${now.getDate()} '${yy}`;
}

// ===== SENDING =====

function canvasBlob() {
  return new Promise((resolve) =>
    els.canvas.toBlob(resolve, "image/jpeg", FILM.quality)
  );
}

els.sendBtn.addEventListener("click", async () => {
  if (!developedBlob) return;

  if (!isConfigured()) {
    setStatus("Setup not finished — add your Supabase details in config.js.", true);
    return;
  }

  els.sendBtn.disabled = true;
  setStatus("Sending…");

  const who = els.name.value.trim();

  try {
    // The small developed version first — this is the one that must land.
    const sent = await uploadPhoto(developedBlob, who, {
      kind: "film",
      bucket: PHOTO_BUCKET,
    });
    setStatus("Sent — thank you! 💛 Take another if you like.");

    // Put it on the wall. Non-fatal: the photo is already safely stored, so a
    // failure here costs a tile, not the picture.
    recordPhoto(sent.path, who)
      .then(() => loadCollage())
      .catch(() => {});

    // Then the original, in the background. Deliberately not awaited: it can
    // be 10MB+ and nobody should stand there watching a progress bar.
    sendOriginal(sent.id, who);
  } catch (err) {
    setStatus("Couldn't send it. Save it to your phone and text it to us?", true);
    els.sendBtn.disabled = false;
  }
});

// Best effort. If it fails the guest never hears about it — they've already
// been thanked, and the film version is safely stored.
function sendOriginal(id, who) {
  if (!FILM.keepOriginal || !originalFile) return;

  if (originalFile.size > FILM.maxOriginalMB * 1024 * 1024) {
    console.warn(
      "Skipping original: " +
        Math.round(originalFile.size / 1048576) +
        "MB exceeds the " + FILM.maxOriginalMB + "MB cap."
    );
    return;
  }

  const file = originalFile; // capture, in case they load another photo
  uploadPhoto(file, who, {
    id: id,
    kind: "original",
    ext: extensionFor(file),
    contentType: file.type || "application/octet-stream",
    // Separate private bucket — originals are never shown on the wall.
    bucket: ORIGINAL_BUCKET,
  }).catch(() => {
    /* nothing to do — the film version already made it */
  });
}

function extensionFor(file) {
  const fromName = (file.name || "").split(".").pop();
  if (fromName && fromName.length <= 5 && fromName !== file.name) return fromName;

  const fromType = (file.type || "").split("/").pop();
  return fromType || "jpg";
}

els.againBtn.addEventListener("click", () => {
  developed = null;
  developedBlob = null;
  originalFile = null;
  els.input.value = "";
  els.result.hidden = true;
  els.sendBtn.disabled = false;
  setStatus("");
  els.drop.scrollIntoView({ behavior: "smooth", block: "center" });
  els.input.click();
});

function setStatus(message, isError) {
  els.status.textContent = message;
  els.status.classList.toggle("error", !!isError);
}

// ===== THE WALL =====
//
// Shows the developed photos guests have sent, newest first — but only while
// collage_visible is true in Supabase. Off by default, so the wall is empty
// and hidden until the day.

let collageTimer = null;

async function loadCollage() {
  if (!isConfigured()) return;

  try {
    if (!(await getCollageVisible())) {
      els.collage.hidden = true;
      return;
    }

    const rows = await getPhotos(COLLAGE_LIMIT);
    if (!rows.length) {
      // Visible but empty: say so, rather than showing a blank gap.
      els.collageGrid.innerHTML = "";
      els.collageEmpty.hidden = false;
      els.collage.hidden = false;
      return;
    }

    els.collageEmpty.hidden = true;
    els.collageGrid.innerHTML = "";

    rows.forEach((row) => {
      const tile = document.createElement("figure");
      tile.className = "wall__tile";

      const img = document.createElement("img");
      img.src = photoUrl(row.path);
      img.alt = row.name ? "Photo by " + row.name : "Party photo";
      img.loading = "lazy";
      img.decoding = "async";
      // A tile whose image 404s would otherwise sit there as a broken icon.
      img.addEventListener("error", () => tile.remove());

      tile.appendChild(img);

      if (row.name) {
        const cap = document.createElement("figcaption");
        cap.textContent = row.name;
        tile.appendChild(cap);
      }

      els.collageGrid.appendChild(tile);
    });

    els.collage.hidden = false;
  } catch (err) {
    // The wall is decoration; if it won't load, the camera still works.
  }
}

function startCollage() {
  if (collageTimer) return;
  loadCollage();
  collageTimer = setInterval(loadCollage, COLLAGE_POLL_MS);
}

function stopCollage() {
  clearInterval(collageTimer);
  collageTimer = null;
}

startCollage();
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopCollage();
  else startCollage();
});
