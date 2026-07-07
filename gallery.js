// ===================================================================
//  PHOTO SLIDESHOW
//  To add more photos: drop the image file in the /photos folder,
//  then add its path to this list. That's the only change needed.
// ===================================================================
const PHOTOS = [
  "photos/gallery-1.jpg",
  "photos/gallery-2.jpg",
  "photos/gallery-3.jpg",
  "photos/gallery-4.jpg",
  "photos/gallery-5.jpg",
  "photos/gallery-6.jpg",
];

// How long each photo stays before advancing (milliseconds).
const INTERVAL_MS = 3000;

const slidesEl = document.getElementById("slides");
const dotsEl = document.getElementById("dots");
const slideshow = document.getElementById("slideshow");

let current = 0;
let timer = null;

// Build the slides and navigation dots.
PHOTOS.forEach((src, i) => {
  const slide = document.createElement("div");
  slide.className = "slide" + (i === 0 ? " is-active" : "");
  slide.innerHTML =
    '<div class="slide__bg" style="background-image:url(\'' + src + "')\"></div>" +
    '<img class="slide__img" src="' + src + '" alt="Alex and Amanda" loading="lazy" />';
  slidesEl.appendChild(slide);

  const dot = document.createElement("button");
  dot.className = "slide-dot" + (i === 0 ? " is-active" : "");
  dot.setAttribute("aria-label", "Go to photo " + (i + 1));
  dot.addEventListener("click", () => goTo(i));
  dotsEl.appendChild(dot);
});

const slides = Array.from(slidesEl.children);
const dots = Array.from(dotsEl.children);

function goTo(index) {
  slides[current].classList.remove("is-active");
  dots[current].classList.remove("is-active");
  current = (index + slides.length) % slides.length;
  slides[current].classList.add("is-active");
  dots[current].classList.add("is-active");
  restart();
}

function next() { goTo(current + 1); }
function prev() { goTo(current - 1); }

function restart() {
  clearInterval(timer);
  if (slides.length > 1) timer = setInterval(next, INTERVAL_MS);
}

document.getElementById("nextBtn").addEventListener("click", next);
document.getElementById("prevBtn").addEventListener("click", prev);

// Pause while the visitor is hovering, so they can look.
slideshow.addEventListener("mouseenter", () => clearInterval(timer));
slideshow.addEventListener("mouseleave", restart);

restart();
