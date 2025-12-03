const NUM_TILES = 8;

const tilesContainer = document.getElementById("tiles");
const generateAllBtn = document.getElementById("generate-all");
const globalStatusEl = document.getElementById("global-status");

const tilesState = [];

function createTile(index) {
  const tileId = `tile-${index}`;
  const wrapper = document.createElement("article");
  wrapper.className = "tile";
  wrapper.dataset.index = index;

  wrapper.innerHTML = `
    <header class="tile-header">
      <div class="tile-label">Trend</div>
      <div class="tile-number">#${index + 1}</div>
    </header>

    <input
      type="text"
      class="trend-title"
      placeholder="e.g. AI co-pilots in every workflow"
    />

    <textarea
      class="trend-prompt"
      placeholder="Describe this trend so an image model can visualize it…"
    ></textarea>

    <div class="tile-actions">
      <button class="generate-btn">
        <span class="icon">✨</span>
        <span>Generate</span>
      </button>
      <span class="tile-status"></span>
    </div>

    <div class="image-container">
      <div class="image-placeholder">
        AI image will appear here. Then drag or paste it into your Miro board.
      </div>
    </div>

    <div class="image-tools" style="display:none;">
      <button class="download-btn">
        <span class="icon">⬇️</span>
        <span>Download</span>
      </button>
      <button class="copy-url-btn">
        <span class="icon">🔗</span>
        <span>Copy URL</span>
      </button>
    </div>
  `;

  const generateBtn = wrapper.querySelector(".generate-btn");
  const titleInput = wrapper.querySelector(".trend-title");
  const promptInput = wrapper.querySelector(".trend-prompt");
  const statusEl = wrapper.querySelector(".tile-status");
  const imgContainer = wrapper.querySelector(".image-container");
  const imgTools = wrapper.querySelector(".image-tools");
  const downloadBtn = wrapper.querySelector(".download-btn");
  const copyUrlBtn = wrapper.querySelector(".copy-url-btn");

  let imageUrl = null;

  async function generateImage() {
    const title = titleInput.value.trim();
    const prompt = promptInput.value.trim();

    if (!title && !prompt) {
      statusEl.textContent = "Add at least a title or a prompt first.";
      statusEl.classList.remove("error");
      return;
    }

    const composedPrompt =
      prompt ||
      `A visual metaphor for the 2025 trend: ${title}. Stylized, clean, workshop-friendly illustration.`;

    generateBtn.disabled = true;
    generateBtn.querySelector("span.icon").textContent = "⏳";
    statusEl.textContent = "Generating image…";
    statusEl.classList.remove("error");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: composedPrompt })
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(
          errorBody?.error || `Request failed with ${response.status}`
        );
      }

      const data = await response.json();

      imageUrl = data.imageUrl;

      // Clear container and show image
      imgContainer.innerHTML = "";
      const img = document.createElement("img");

      // If the backend returned base64, it's already a data URL; otherwise it's a normal URL
      if (imageUrl.startsWith("data:image") || imageUrl.startsWith("http")) {
        img.src = imageUrl;
      } else {
        // fallback – assume it's a path or URL string
        img.src = imageUrl;
      }

      img.alt = title || "AI-generated image for trend";
      imgContainer.appendChild(img);

      imgTools.style.display = "flex";
      statusEl.textContent = "Done! Drag/download this into Miro.";
    } catch (err) {
      console.error(err);
      statusEl.textContent = "Error generating image. Try again.";
      statusEl.classList.add("error");
    } finally {
      generateBtn.disabled = false;
      generateBtn.querySelector("span.icon").textContent = "✨";
    }
  }

  generateBtn.addEventListener("click", generateImage);

  downloadBtn.addEventListener("click", () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = (titleInput.value || `trend-${index + 1}`) + ".png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  copyUrlBtn.addEventListener("click", async () => {
    if (!imageUrl || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(imageUrl);
      statusEl.textContent = "Image URL copied!";
      statusEl.classList.remove("error");
    } catch {
      statusEl.textContent = "Could not copy URL.";
      statusEl.classList.add("error");
    }
  });

  tilesState.push({ id: tileId, generateImage });

  return wrapper;
}

// Initialize tiles
for (let i = 0; i < NUM_TILES; i++) {
  tilesContainer.appendChild(createTile(i));
}

// Generate all remaining tiles
generateAllBtn.addEventListener("click", async () => {
  globalStatusEl.textContent = "Generating all tiles…";
  generateAllBtn.disabled = true;

  for (const tile of tilesState) {
    await tile.generateImage(); // simple sequential generation
  }

  globalStatusEl.textContent = "Finished generating all tiles.";
  generateAllBtn.disabled = false;
});