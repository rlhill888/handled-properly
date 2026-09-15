---
status: accepted
---

# Carousel autoplay always ships with a pause control and manual navigation

Gallery's carousel mode (`docs/adr/0021-gallery-carousel-option.md`) gained an `autoplay` toggle: off by default (arrows/dots only, matching 0021), on advances slides automatically every 5 seconds.

Autoplay never removes manual control. Arrow buttons and dots work identically whether autoplay is on or off, and clicking either while autoplay is running resets the auto-advance timer from that point rather than fighting it — a click landing right before an auto-advance would otherwise feel like it did nothing. When autoplay is on, `GalleryCarousel` also shows a pause/play button: WCAG 2.2.2 requires a way to stop content that moves on its own for more than five seconds, and a visitor reading a caption shouldn't have the image change out from under them with no way to stop it.
